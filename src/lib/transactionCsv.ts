export interface ParsedCsvTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  accountName: string;
}

export interface CsvParseResult {
  transactions: ParsedCsvTransaction[];
  skipped: number;
}

interface TransactionFingerprintInput {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  account_id: string | null;
}

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

export const normalizeTransactionDescription = (value: string) =>
  normalize(value).replace(/\s+/g, " ");

const normalizeHeader = (value: string) =>
  normalize(value)
    .replace(/\([^)]*\)/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const categoryRules: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Alimentação",
    keywords: [
      "ifood", "mercado", "supermercado", "atacadao", "assai", "padaria",
      "restaurante", "lanchonete", "mcdonald", "burger king", "hortifruti",
    ],
  },
  {
    category: "Transporte",
    keywords: [
      "uber", "99app", "99 pop", "99 taxi", "posto", "gasolina",
      "combustivel", "estacionamento", "pedagio", "metro", "onibus",
    ],
  },
  {
    category: "Moradia",
    keywords: [
      "aluguel", "condominio", "energia", "light", "enel", "cedae",
      "conta de agua", "internet", "claro", "vivo fibra", "gas", "iptu",
    ],
  },
  {
    category: "Saúde",
    keywords: [
      "farmacia", "drogaria", "hospital", "clinica", "laboratorio",
      "medico", "dentista", "odont", "academia", "plano de saude",
    ],
  },
  {
    category: "Educação",
    keywords: [
      "escola", "faculdade", "universidade", "curso", "udemy",
      "alura", "livraria", "papelaria", "material escolar",
    ],
  },
  {
    category: "Lazer",
    keywords: [
      "netflix", "spotify", "cinema", "steam", "playstation", "xbox",
      "ingresso", "show", "parque", "hotel", "viagem",
    ],
  },
];

export function inferTransactionCategory(
  description: string,
  type: "income" | "expense",
) {
  if (type === "income") return "Receita";

  const normalizedDescription = normalize(description);
  const match = categoryRules.find((rule) =>
    rule.keywords.some((keyword) => normalizedDescription.includes(keyword)),
  );

  return match?.category || "Outros";
}

export function transactionFingerprint(transaction: TransactionFingerprintInput) {
  const description = normalizeTransactionDescription(transaction.description);
  const amountInCents = Math.round(transaction.amount * 100);

  return [
    transaction.date.slice(0, 10),
    description,
    amountInCents,
    transaction.type,
    transaction.account_id || "sem-conta",
  ].join("|");
}

function parseLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];

    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === delimiter && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += character;
    }
  }

  cells.push(current.trim());
  return cells;
}

function parseAmount(rawValue: string) {
  const raw = rawValue.trim();
  const negativeByParentheses = raw.startsWith("(") && raw.endsWith(")");
  let cleaned = raw.replace(/[R$\s()]/g, "");

  if (cleaned.includes(",") && cleaned.includes(".")) {
    cleaned =
      cleaned.lastIndexOf(",") > cleaned.lastIndexOf(".")
        ? cleaned.replace(/\./g, "").replace(",", ".")
        : cleaned.replace(/,/g, "");
  } else if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }

  const value = Number(cleaned);
  return negativeByParentheses ? -Math.abs(value) : value;
}

function parseDate(rawValue: string) {
  const value = rawValue.trim();
  const isoMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;

  const brazilianMatch = value.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (brazilianMatch) {
    const [, day, month, year] = brazilianMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

const aliases = {
  date: ["data", "date", "data lancamento", "data movimento", "data mov"],
  description: ["descricao", "description", "title", "lancamento", "titulo", "estabelecimento", "historico"],
  amount: ["valor", "amount", "quantia", "valor lancamento"],
  credit: ["credito", "credit", "entrada"],
  debit: ["debito", "debit", "saida"],
  type: ["tipo", "type", "natureza", "debito credito", "credito debito"],
  category: ["categoria", "category"],
  account: ["conta", "account", "banco"],
};

function findColumn(headers: string[], names: string[]) {
  for (const name of names) {
    const index = headers.indexOf(name);
    if (index >= 0) return index;
  }
  return -1;
}

function findHeader(lines: string[]) {
  let best:
    | { lineIndex: number; delimiter: string; headers: string[]; score: number }
    | undefined;

  lines.slice(0, 30).forEach((line, lineIndex) => {
    [";", ","].forEach((delimiter) => {
      const headers = parseLine(line, delimiter).map(normalizeHeader);
      const hasDate = findColumn(headers, aliases.date) >= 0;
      const hasDescription = findColumn(headers, aliases.description) >= 0;
      const hasAmount =
        findColumn(headers, aliases.amount) >= 0 ||
        findColumn(headers, aliases.credit) >= 0 ||
        findColumn(headers, aliases.debit) >= 0;
      const score = Number(hasDate) + Number(hasDescription) * 2 + Number(hasAmount) * 2;

      if (hasDescription && hasAmount && (!best || score > best.score)) {
        best = { lineIndex, delimiter, headers, score };
      }
    });
  });

  return best;
}

export function parseTransactionsCsv(content: string): CsvParseResult {
  const lines = content
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim());

  if (lines.length < 2) {
    throw new Error("O arquivo precisa ter cabeçalho e pelo menos uma transação.");
  }

  const header = findHeader(lines);
  if (!header) {
    throw new Error("Não encontrei as colunas de descrição e valor no arquivo.");
  }

  const { delimiter, headers } = header;
  const columns = {
    date: findColumn(headers, aliases.date),
    description: findColumn(headers, aliases.description),
    amount: findColumn(headers, aliases.amount),
    credit: findColumn(headers, aliases.credit),
    debit: findColumn(headers, aliases.debit),
    type: findColumn(headers, aliases.type),
    category: findColumn(headers, aliases.category),
    account: findColumn(headers, aliases.account),
  };

  const transactions: ParsedCsvTransaction[] = [];
  let skipped = 0;

  lines.slice(header.lineIndex + 1, header.lineIndex + 501).forEach((line) => {
    const cells = parseLine(line, delimiter);
    const amountValue = columns.amount >= 0 ? parseAmount(cells[columns.amount] || "") : 0;
    const creditValue = columns.credit >= 0 ? parseAmount(cells[columns.credit] || "") : 0;
    const debitValue = columns.debit >= 0 ? parseAmount(cells[columns.debit] || "") : 0;
    const signedAmount =
      Number.isFinite(amountValue) && amountValue !== 0
        ? amountValue
        : Number.isFinite(creditValue) && creditValue !== 0
          ? Math.abs(creditValue)
          : Number.isFinite(debitValue) && debitValue !== 0
            ? -Math.abs(debitValue)
            : Number.NaN;
    const description = (cells[columns.description] || "").trim();
    const parsedDate = columns.date >= 0 ? parseDate(cells[columns.date] || "") : "";

    if (!description || !Number.isFinite(signedAmount) || signedAmount === 0) {
      skipped += 1;
      return;
    }

    const rawType = columns.type >= 0 ? normalize(cells[columns.type] || "") : "";
    const isIncome = ["receita", "income", "entrada", "credito", "recebimento", "c", "cr"].includes(rawType);
    const isExpense = ["despesa", "expense", "saida", "debito", "pagamento", "d", "db"].includes(rawType);

    const type = isIncome ? "income" : isExpense ? "expense" : signedAmount < 0 ? "expense" : "income";
    const csvCategory =
      columns.category >= 0 ? (cells[columns.category] || "").trim() : "";

    transactions.push({
      date: parsedDate || new Date().toISOString().slice(0, 10),
      description,
      amount: Math.abs(signedAmount),
      type,
      category:
        csvCategory && normalize(csvCategory) !== "outros"
          ? csvCategory
          : inferTransactionCategory(description, type),
      accountName: columns.account >= 0 ? (cells[columns.account] || "").trim() : "",
    });
  });

  if (!transactions.length) {
    throw new Error("Nenhuma transação válida foi encontrada.");
  }

  return { transactions, skipped };
}

export function downloadTransactionsCsvTemplate() {
  const content = [
    "data;descricao;valor;tipo;categoria;conta",
    "30/07/2026;Salário;2500,00;receita;Salário;Nubank",
    "30/07/2026;Supermercado;185,90;despesa;Alimentação;Nubank",
  ].join("\n");
  const blob = new Blob([`\uFEFF${content}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "modelo-transacoes-lifeflow.csv";
  anchor.click();
  URL.revokeObjectURL(url);
}
