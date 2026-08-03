import { useMemo, useState } from "react";
import { AlertTriangle, Pencil, Plus, Trash2, WalletCards } from "lucide-react";
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

export function BudgetsSection({
  selectedMonth,
  transactions,
}: {
  selectedMonth: Date;
  transactions: Transaction[];
}) {
  const { categories: transactionCategories } = useTransactionCategories();
  const { budgets, isLoading, saveBudget, deleteBudget, isSaving } = useBudgets(selectedMonth);
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

  return (
    <>
      <Card className="overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
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

        {isLoading ? (
          <div className="mt-5 h-24 animate-pulse rounded-xl bg-muted/40" />
        ) : budgets.length === 0 ? (
          <button type="button" onClick={beginCreate} className="mt-5 flex w-full flex-col items-center rounded-xl border border-dashed border-border p-7 text-center hover:bg-muted/20">
            <WalletCards className="h-7 w-7 text-muted-foreground" />
            <span className="mt-2 text-sm font-medium">Nenhum limite definido</span>
            <span className="mt-1 text-xs text-muted-foreground">Crie um orçamento para acompanhar onde pode gastar.</span>
          </button>
        ) : (
          <>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {budgets.map((budget) => {
                const spent = expenses.get(budget.category) ?? 0;
                const percent = Math.round((spent / budget.amount) * 100);
                const exceeded = percent >= 100;
                const near = percent >= 80;
                return (
                  <div key={budget.id} className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
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
