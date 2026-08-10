import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Pencil, Plus, Sparkles, Trash2, WalletCards, WandSparkles } from "lucide-react";
import { isSameMonth } from "date-fns";
import { toast } from "sonner";
import type { Transaction } from "@/hooks/useTransactions";
import { useBudgets, type MonthlyBudget } from "@/hooks/useBudgets";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useTransactionCategories } from "@/hooks/useTransactionCategories";
import { useBudgetAlerts } from "@/hooks/useBudgetAlerts";
import { buildSmartBudgetSuggestions } from "@/lib/smartBudget";

export function BudgetsSection({
  selectedMonth,
  transactions,
  historyTransactions,
}: {
  selectedMonth: Date;
  transactions: Transaction[];
  historyTransactions?: Transaction[];
}) {
  const { categories: transactionCategories } = useTransactionCategories();
  const { budgets, isLoading, saveBudget, deleteBudget, isSaving } = useBudgets(selectedMonth);
  const { claimBudgetAlert } = useBudgetAlerts();
  const attemptedAlerts = useRef(new Set<string>());
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<MonthlyBudget | null>(null);
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");

  const expenses = useMemo(() => {
    const totals = new Map<string, number>();
    transactions.filter((item) => item.type === "expense").forEach((item) => {
      totals.set(item.category, (totals.get(item.category) ?? 0) + item.amount);
    });
    return totals;
  }, [transactions]);

  const categories = [...new Set([...transactionCategories.map((item) => item.name), ...transactions.map((item) => item.category)])].sort();
  const totalLimit = budgets.reduce((sum, item) => sum + item.amount, 0);
  const totalSpent = budgets.reduce((sum, item) => sum + (expenses.get(item.category) ?? 0), 0);
  const budgetProgress = useMemo(
    () => budgets.map((budget) => {
      const spent = expenses.get(budget.category) ?? 0;
      const percent = Math.round((spent / budget.amount) * 100);
      return { budget, spent, percent, exceeded: percent >= 100, near: percent >= 80 };
    }),
    [budgets, expenses],
  );
  const exceededBudgets = budgetProgress.filter((item) => item.exceeded);
  const nearBudgets = budgetProgress.filter((item) => item.near && !item.exceeded);
  const smartSuggestions = useMemo(() => {
    const existing = new Set(budgets.map((budget) => budget.category));
    return buildSmartBudgetSuggestions(historyTransactions ?? transactions).filter((suggestion) => !existing.has(suggestion.category)).slice(0, 6);
  }, [budgets, historyTransactions, transactions]);

  useEffect(() => {
    if (isLoading || !isSameMonth(selectedMonth, new Date())) return;

    budgetProgress.forEach(({ budget, spent, percent }) => {
      const level: 80 | 100 | null = percent >= 100 ? 100 : percent >= 80 ? 80 : null;
      if (!level) return;

      const attemptKey = `${budget.id}:${level}:${budget.amount}`;
      if (attemptedAlerts.current.has(attemptKey)) return;
      attemptedAlerts.current.add(attemptKey);

      void claimBudgetAlert({
        budgetId: budget.id,
        level,
        spentAmount: spent,
        budgetAmount: budget.amount,
      }).then((claimed) => {
        if (!claimed) return;
        if (level === 100) {
          toast.error(`Orçamento de ${budget.category} excedido`, {
            description: `${percent}% do limite mensal já foi utilizado.`,
          });
        } else {
          toast.warning(`Orçamento de ${budget.category} perto do limite`, {
            description: `${percent}% do limite mensal já foi utilizado.`,
          });
        }
      }).catch((error) => {
        console.error("Não foi possível registrar o alerta de orçamento:", error);
      });
    });
  }, [budgetProgress, claimBudgetAlert, isLoading, selectedMonth]);

  const beginCreate = () => {
    setEditing(null);
    setCategory("");
    setAmount("");
    setOpen(true);
  };

  const beginEdit = (budget: MonthlyBudget) => {
    setEditing(budget);
    setCategory(budget.category);
    setAmount(String(budget.amount));
    setOpen(true);
  };

  const handleSave = async () => {
    const value = Number(amount.replace(",", "."));
    if (!category || !Number.isFinite(value) || value <= 0) {
      toast.error("Informe a categoria e um limite válido");
      return;
    }
    await saveBudget({ category, amount: value });
    if (editing && editing.category !== category) await deleteBudget(editing.id);
    toast.success(editing ? "Orçamento atualizado" : "Orçamento criado");
    setOpen(false);
  };

  const createSuggestedBudgets = async () => {
    await Promise.all(smartSuggestions.map((suggestion) => saveBudget({ category: suggestion.category, amount: suggestion.suggestedAmount })));
    toast.success(`${smartSuggestions.length} ${smartSuggestions.length === 1 ? "orçamento criado" : "orçamentos criados"} com base no seu histórico`);
  };

  return (
    <>
      <Card className="relative overflow-hidden rounded-[1.75rem] border-warning/15 bg-gradient-to-br from-card via-card to-warning/[0.055] p-4 shadow-sm sm:p-5">
        <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-warning/10 blur-3xl" />
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Planejamento mensal</p>
            <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">Orçamento por categoria</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">Compare seus gastos com os limites definidos para este mês.</p>
          </div>
          <Button size="sm" variant="outline" onClick={beginCreate}>
            <Plus className="mr-1.5 h-4 w-4" />Novo limite
          </Button>
        </div>

        {smartSuggestions.length > 0 && (
          <div className="relative mt-5 overflow-hidden rounded-[1.5rem] border border-violet-500/20 bg-gradient-to-br from-violet-500/[0.08] via-background/60 to-cyan-500/[0.06] p-4">
            <div className="pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full bg-violet-500/15 blur-3xl" />
            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600"><WandSparkles className="h-5 w-5" /></span><div><p className="flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-[.16em] text-violet-600"><Sparkles className="h-3 w-3" />Orçamento que se monta sozinho</p><p className="mt-1 text-sm font-extrabold">Encontramos {smartSuggestions.length} limites possíveis</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Calculados com os últimos três meses completos e uma margem para variações.</p></div></div><Button size="sm" onClick={createSuggestedBudgets} disabled={isSaving}><CheckCircle2 className="h-4 w-4" />Criar todos</Button></div>
            <div className="relative mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{smartSuggestions.map((suggestion) => <div key={suggestion.category} className="flex items-center justify-between rounded-xl border border-border/55 bg-background/65 px-3 py-2.5"><div className="min-w-0"><p className="truncate text-xs font-bold">{suggestion.category}</p><p className="mt-0.5 text-[9px] text-muted-foreground">Média {suggestion.average.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • confiança {suggestion.confidence === "high" ? "alta" : "média"}</p></div><button type="button" onClick={async () => { await saveBudget({ category: suggestion.category, amount: suggestion.suggestedAmount }); toast.success(`Orçamento de ${suggestion.category} criado`); }} className="ml-2 shrink-0 rounded-lg bg-violet-500/10 px-2.5 py-1.5 text-[10px] font-extrabold text-violet-600 hover:bg-violet-500/15">{suggestion.suggestedAmount.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })}</button></div>)}</div>
          </div>
        )}

        {isLoading ? (
          <div className="mt-5 h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : budgets.length === 0 ? (
          <button type="button" onClick={beginCreate} className="mt-5 flex w-full flex-col items-center rounded-2xl border border-dashed border-warning/25 bg-warning/[0.035] p-7 text-center transition-all hover:border-warning/40 hover:bg-warning/[0.07]">
            <WalletCards className="h-7 w-7 text-muted-foreground" />
            <span className="mt-2 text-sm font-medium">Nenhum limite definido</span>
            <span className="mt-1 text-xs text-muted-foreground">Crie um orçamento para acompanhar onde pode gastar.</span>
          </button>
        ) : (
          <>
            {(exceededBudgets.length > 0 || nearBudgets.length > 0) && (
              <div className={cn(
                "mt-5 flex items-start gap-3 rounded-xl border px-3.5 py-3",
                exceededBudgets.length > 0
                  ? "border-destructive/30 bg-destructive/[0.07]"
                  : "border-warning/30 bg-warning/[0.07]",
              )}>
                <AlertTriangle className={cn("mt-0.5 h-4 w-4 shrink-0", exceededBudgets.length > 0 ? "text-destructive" : "text-warning")} />
                <div>
                  <p className="text-xs font-semibold">
                    {exceededBudgets.length > 0
                      ? `${exceededBudgets.length} ${exceededBudgets.length === 1 ? "limite foi ultrapassado" : "limites foram ultrapassados"}`
                      : `${nearBudgets.length} ${nearBudgets.length === 1 ? "categoria está" : "categorias estão"} perto do limite`}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {exceededBudgets.length > 0 && nearBudgets.length > 0
                      ? `${nearBudgets.length} ${nearBudgets.length === 1 ? "outra categoria precisa" : "outras categorias precisam"} de atenção.`
                      : "Revise os gastos abaixo para manter o planejamento do mês."}
                  </p>
                </div>
              </div>
            )}
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {budgetProgress.map(({ budget, spent, percent, exceeded, near }) => {
                return (
                  <div key={budget.id} className="rounded-2xl border border-border/50 bg-background/55 p-3.5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-warning/20 hover:shadow-md motion-reduce:hover:translate-y-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold">{budget.category}</p>
                        <p className={cn("mt-0.5 text-xs", exceeded ? "text-destructive" : near ? "text-warning" : "text-muted-foreground")}>
                          {spent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de {budget.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                        </p>
                      </div>
                      <div className="flex">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => beginEdit(budget)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteBudget(budget.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </div>
                    <Progress value={Math.min(percent, 100)} className={cn("mt-3 h-2", exceeded && "[&>div]:bg-destructive", near && !exceeded && "[&>div]:bg-warning")} />
                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{percent}% utilizado</span>
                      {exceeded && <span className="flex items-center gap-1 text-destructive"><AlertTriangle className="h-3 w-3" />Limite excedido</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border/60 pt-3 text-xs">
              <span className="text-muted-foreground">Total acompanhado</span>
              <span className="font-semibold">{totalSpent.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} de {totalLimit.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>
            </div>
          </>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{editing ? "Editar orçamento" : "Novo orçamento"}</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>{categories.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Limite mensal</Label>
              <Input inputMode="decimal" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="500,00" />
            </div>
            <Button className="w-full" onClick={handleSave} disabled={isSaving}>{editing ? "Salvar alterações" : "Criar orçamento"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
