import { supabase } from "@/integrations/supabase/client";

type QueryResult = {
  data: unknown[] | null;
  error: { message: string } | null;
};

function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function backupDate() {
  return new Date().toISOString().slice(0, 10);
}

function csvCell(value: unknown) {
  const original = value == null ? "" : String(value);
  const safe = /^[=+\-@]/.test(original) ? `'${original}` : original;
  return `"${safe.replace(/"/g, '""')}"`;
}

function ensureResults(
  entries: Array<[string, QueryResult]>,
): Record<string, unknown[]> {
  return Object.fromEntries(
    entries.map(([name, result]) => {
      if (result.error) throw new Error(`Não foi possível exportar ${name}: ${result.error.message}`);
      return [name, result.data ?? []];
    }),
  );
}

export async function downloadLifeFlowBackup(userId: string, email?: string) {
  const results = await Promise.all([
    supabase.from("profiles").select("*").eq("user_id", userId),
    supabase.from("accounts").select("*").eq("user_id", userId),
    supabase.from("transactions").select("*").eq("user_id", userId),
    supabase.from("installments").select("*").eq("user_id", userId),
    supabase.from("installment_payments").select("*"),
    supabase.from("subscriptions").select("*").eq("user_id", userId),
    supabase.from("investments").select("*").eq("user_id", userId),
    supabase.from("investment_transactions").select("*").eq("user_id", userId),
    supabase.from("financial_goals").select("*").eq("user_id", userId),
    supabase.from("goal_contributions").select("*").eq("user_id", userId),
    supabase.from("tasks").select("*").eq("user_id", userId),
    supabase.from("goals").select("*").eq("user_id", userId),
    supabase.from("habits").select("*").eq("user_id", userId),
    supabase.from("habit_logs").select("*").eq("user_id", userId),
    supabase.from("contacts").select("*").eq("user_id", userId),
    supabase.from("documents").select("*").eq("user_id", userId),
    supabase.from("history_events").select("*").eq("user_id", userId),
    supabase.from("dashboard_preferences").select("*").eq("user_id", userId),
    supabase.from("monthly_budgets").select("*").eq("user_id", userId),
    supabase.from("transaction_category_rules").select("*").eq("user_id", userId),
  ]);

  const names = [
    "perfil",
    "contas",
    "transacoes",
    "parcelamentos",
    "parcelas",
    "assinaturas",
    "investimentos",
    "movimentacoes_de_investimentos",
    "metas_financeiras",
    "aportes_em_metas",
    "tarefas",
    "metas_pessoais",
    "habitos",
    "registros_de_habitos",
    "contatos",
    "documentos",
    "historico",
    "preferencias_do_dashboard",
    "orcamentos_mensais",
    "regras_de_categoria",
  ];

  const data = ensureResults(
    names.map((name, index) => [name, results[index] as QueryResult]),
  );

  const backup = {
    aplicativo: "LifeFlow",
    versao_do_backup: 1,
    exportado_em: new Date().toISOString(),
    conta: { id: userId, email: email ?? null },
    observacao: "Este arquivo contém os dados cadastrados no LifeFlow. Os arquivos enviados em Documentos não são incorporados ao JSON.",
    dados: data,
  };

  downloadFile(
    JSON.stringify(backup, null, 2),
    `lifeflow-backup-${backupDate()}.json`,
    "application/json;charset=utf-8",
  );
}

export async function downloadFinancialCsv(userId: string) {
  const [transactionsResult, accountsResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false }),
    supabase.from("accounts").select("id, name").eq("user_id", userId),
  ]);

  if (transactionsResult.error) throw new Error(transactionsResult.error.message);
  if (accountsResult.error) throw new Error(accountsResult.error.message);

  const accountNames = new Map(
    (accountsResult.data ?? []).map((account) => [account.id, account.name]),
  );
  const headers = ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Conta"];
  const rows = (transactionsResult.data ?? []).map((transaction) => [
    transaction.date,
    transaction.type === "income" ? "Receita" : "Despesa",
    transaction.description,
    transaction.category,
    Number(transaction.amount).toFixed(2).replace(".", ","),
    transaction.account_id ? accountNames.get(transaction.account_id) ?? "" : "",
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map(csvCell).join(";"))
    .join("\r\n");

  downloadFile(
    `\uFEFF${csv}`,
    `lifeflow-financas-${backupDate()}.csv`,
    "text/csv;charset=utf-8",
  );
}
