import { describe, expect, it } from "vitest";
import {
  inferTransactionCategory,
  findPersonalTransactionCategory,
  normalizeTransactionDescription,
  parseTransactionsCsv,
  parseTransactionsFile,
  parseTransactionsOfx,
  transactionFingerprint,
} from "@/lib/transactionCsv";

describe("parseTransactionsCsv", () => {
  it("lê CSV brasileiro com ponto e vírgula", () => {
    const result = parseTransactionsCsv(
      "data;descrição;valor;tipo;categoria;conta\n30/07/2026;Mercado;185,90;despesa;Alimentação;Nubank",
    );

    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-30",
      description: "Mercado",
      amount: 185.9,
      type: "expense",
      category: "Alimentação",
      accountName: "Nubank",
    });
  });

  it("infere o tipo pelo sinal do valor", () => {
    const result = parseTransactionsCsv(
      "date,description,amount\n2026-07-30,\"Compra, mercado\",-49.90\n2026-07-30,Pix recebido,100",
    );

    expect(result.transactions.map((item) => item.type)).toEqual(["expense", "income"]);
    expect(result.transactions[0].description).toBe("Compra, mercado");
  });

  it("lê o formato comum do Nubank", () => {
    const result = parseTransactionsCsv(
      "date,title,amount\n2026-07-28,Transferência recebida,350.00\n2026-07-29,Pagamento,-89.90",
    );

    expect(result.transactions.map((item) => item.type)).toEqual(["income", "expense"]);
    expect(result.transactions[0].description).toBe("Transferência recebida");
  });

  it("lê formatos de Inter e Banco do Brasil", () => {
    const inter = parseTransactionsCsv(
      "Data Lançamento;Histórico;Descrição;Valor;Saldo\n29/07/2026;Pix;Padaria;-25,50;100,00",
    );
    const bb = parseTransactionsCsv(
      "Data;Dependência Origem;Histórico;Data Balancete;Número documento;Valor\n29/07/2026;1234;Pix recebido;29/07/2026;10;500,00",
    );

    expect(inter.transactions[0]).toMatchObject({ description: "Padaria", type: "expense", amount: 25.5 });
    expect(bb.transactions[0]).toMatchObject({ description: "Pix recebido", type: "income", amount: 500 });
  });

  it("ignora o preâmbulo e combina crédito e débito do Bradesco", () => {
    const result = parseTransactionsCsv(
      ";Bradesco Net Empresa;;;\n;Extrato de: Agência: 1 Conta: 2;;;\nData;Lançamento;Dcto.;Crédito (R$);Débito (R$);Saldo (R$)\n29/07/2026;PIX RECEBIDO;10;230,00;;230,00\n30/07/2026;CARTAO;11;;-45,90;184,10",
    );

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions.map((item) => [item.type, item.amount])).toEqual([
      ["income", 230],
      ["expense", 45.9],
    ]);
  });

  it("entende D e C em uma coluna de débito/crédito", () => {
    const result = parseTransactionsCsv(
      "Data Mov.;Histórico;Valor;Débito/Crédito\n30/07/2026;Pagamento;75,00;D\n30/07/2026;Depósito;200,00;C",
    );

    expect(result.transactions.map((item) => item.type)).toEqual(["expense", "income"]);
  });

  it("rejeita arquivos sem as colunas necessárias", () => {
    expect(() => parseTransactionsCsv("data;categoria\n30/07/2026;Outros")).toThrow("colunas");
  });
});

describe("parseTransactionsOfx", () => {
  it("lê OFX no formato SGML usado por bancos", () => {
    const timezone = "[" + "-3:BRT]";
    const result = parseTransactionsOfx(`
      OFXHEADER:100
      DATA:OFXSGML
      <OFX>
      <BANKTRANLIST>
      <STMTTRN>
      <TRNTYPE>DEBIT
      <DTPOSTED>20260729120000${timezone}
      <TRNAMT>-42.90
      <FITID>123
      <NAME>POSTO SHELL
      <MEMO>COMPRA CARTAO
      <STMTTRN>
      <TRNTYPE>CREDIT
      <DTPOSTED>20260730120000${timezone}
      <TRNAMT>1500.00
      <FITID>124
      <MEMO>PIX RECEBIDO
      </BANKTRANLIST>
      </OFX>
    `);

    expect(result.transactions).toHaveLength(2);
    expect(result.transactions[0]).toMatchObject({
      date: "2026-07-29",
      description: "POSTO SHELL — COMPRA CARTAO",
      amount: 42.9,
      type: "expense",
      category: "Transporte",
    });
    expect(result.transactions[1]).toMatchObject({
      date: "2026-07-30",
      description: "PIX RECEBIDO",
      amount: 1500,
      type: "income",
    });
  });

  it("lê OFX XML e decodifica caracteres especiais", () => {
    const result = parseTransactionsOfx(`
      <?xml version="1.0"?>
      <OFX><BANKTRANLIST><STMTTRN>
        <DTPOSTED>20260728</DTPOSTED>
        <TRNAMT>-89.50</TRNAMT>
        <FITID>abc</FITID>
        <NAME>Mercado &amp; Padaria</NAME>
      </STMTTRN></BANKTRANLIST></OFX>
    `);

    expect(result.transactions[0].description).toBe("Mercado & Padaria");
    expect(result.transactions[0].amount).toBe(89.5);
  });

  it("detecta OFX pela extensão ou pelo conteúdo", () => {
    const content = "<OFX><STMTTRN><DTPOSTED>20260730<TRNAMT>-10<NAME>Teste</STMTTRN></OFX>";
    expect(parseTransactionsFile(content, "extrato.ofx").transactions).toHaveLength(1);
    expect(parseTransactionsFile(content, "extrato.txt").transactions).toHaveLength(1);
  });
});

describe("normalizeTransactionDescription", () => {
  it("gera uma chave estável para as preferências do usuário", () => {
    expect(normalizeTransactionDescription("  Pão   de Açúcar  ")).toBe("pao de acucar");
  });
});

describe("findPersonalTransactionCategory", () => {
  it("reconhece uma regra mesmo com texto adicional no lançamento", () => {
    expect(findPersonalTransactionCategory("POSTO SHELL 0487", {
      "posto shell": "Transporte",
    })).toBe("Transporte");
  });

  it("prioriza a regra mais específica quando mais de uma combina", () => {
    expect(findPersonalTransactionCategory("Mercado Livre Assinatura", {
      mercado: "Alimentação",
      "mercado livre": "Compras",
    })).toBe("Compras");
  });

  it("ignora regras curtas demais", () => {
    expect(findPersonalTransactionCategory("Pix recebido", {
      pi: "Outros",
    })).toBeUndefined();
  });
});

describe("transactionFingerprint", () => {
  it("considera descrições equivalentes apesar de espaços e acentos", () => {
    const base = {
      date: "2026-07-30",
      amount: 49.9,
      type: "expense" as const,
      account_id: "nubank",
    };

    expect(transactionFingerprint({ ...base, description: "  Pão   de Açúcar " })).toBe(
      transactionFingerprint({ ...base, description: "pao de acucar" }),
    );
  });

  it("diferencia conta, tipo, data e valor", () => {
    const base = {
      date: "2026-07-30",
      description: "Pix",
      amount: 100,
      type: "income" as const,
      account_id: "nubank",
    };

    expect(transactionFingerprint(base)).not.toBe(
      transactionFingerprint({ ...base, account_id: "inter" }),
    );
    expect(transactionFingerprint(base)).not.toBe(
      transactionFingerprint({ ...base, amount: 101 }),
    );
  });
});

describe("inferTransactionCategory", () => {
  it("categoriza despesas comuns sem diferenciar acentos e maiúsculas", () => {
    expect(inferTransactionCategory("IFOOD *RESTAURANTE", "expense")).toBe("Alimentação");
    expect(inferTransactionCategory("UBER TRIP", "expense")).toBe("Transporte");
    expect(inferTransactionCategory("Drogaria São Paulo", "expense")).toBe("Saúde");
    expect(inferTransactionCategory("Mensalidade Faculdade", "expense")).toBe("Educação");
    expect(inferTransactionCategory("NETFLIX.COM", "expense")).toBe("Lazer");
    expect(inferTransactionCategory("CONTA LIGHT", "expense")).toBe("Moradia");
  });

  it("classifica entradas como receita e mantém desconhecidos em Outros", () => {
    expect(inferTransactionCategory("Pix recebido", "income")).toBe("Receita");
    expect(inferTransactionCategory("Compra desconhecida", "expense")).toBe("Outros");
  });

  it("preserva a categoria informada pelo CSV", () => {
    const result = parseTransactionsCsv(
      "data;descricao;valor;tipo;categoria\n30/07/2026;Netflix;59,90;despesa;Assinaturas",
    );

    expect(result.transactions[0].category).toBe("Assinaturas");
  });
});
