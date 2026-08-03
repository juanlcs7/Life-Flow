import { ArrowDown, ArrowUp, BarChart3, Minus, ReceiptText } from "lucide-react";
import { format, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { Transaction } from "@/hooks/useTransactions";
import { Card } from "@/components/ui/card";
import { calculateMonthlyComparison } from "@/lib/monthlyComparison";
import { cn } from "@/lib/utils";

interface MonthlyComparisonProps {
  transactions: Transaction[];
  selectedMonth: Date;
}

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function changeText(change: number | null) {
  if (change === null) return "Sem base anterior";
  if (Math.abs(change) < 0.05) return "Sem alteração";
  return `${Math.abs(change).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function MonthlyComparison({ transactions, selectedMonth }: MonthlyComparisonProps) {
  const comparison = calculateMonthlyComparison(transactions, selectedMonth);
  const currentLabel = format(selectedMonth, "MMMM", { locale: ptBR });
  const previousLabel = format(subMonths(selectedMonth, 1), "MMMM", { locale: ptBR });
  const hasData = comparison.current.count > 0 || comparison.previous.count > 0;
  const expenseDifference = comparison.current.expenses - comparison.previous.expenses;

  const metrics = [
    {
      label: "Receitas",
      current: comparison.current.income,
      previous: comparison.previous.income,
      change: comparison.incomeChange,
      favorable: (comparison.incomeChange ?? 0) >= 0,
    },
    {
      label: "Despesas",
      current: comparison.current.expenses,
      previous: comparison.previous.expenses,
      change: comparison.expenseChange,
      favorable: (comparison.expenseChange ?? 0) <= 0,
    },
    {
      label: "Saldo do mês",
      current: comparison.current.balance,
      previous: comparison.previous.balance,
      change: comparison.balanceChange,
      favorable: comparison.current.balance >= comparison.previous.balance,
    },
  ];

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Comparação mensal</p>
          <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">
            <span className="capitalize">{currentLabel}</span> x <span className="capitalize">{previousLabel}</span>
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Veja o que mudou de um mês para o outro.</p>
        </div>
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
          <BarChart3 className="h-4 w-4 text-primary" />
        </div>
      </div>

      {!hasData ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <ReceiptText className="mx-auto h-7 w-7 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">Ainda não há dados para comparar</p>
          <p className="mt-1 text-xs text-muted-foreground">Registre transações em pelo menos um dos dois meses.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {metrics.map((metric) => {
              const unchanged = metric.change === 0;
              const increased = metric.change !== null && metric.change > 0;
              const ChangeIcon = unchanged ? Minus : increased ? ArrowUp : ArrowDown;
              return (
                <div key={metric.label} className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-xs font-medium text-muted-foreground">{metric.label}</p>
                    <span className={cn(
                      "flex items-center gap-1 text-[11px] font-semibold",
                      metric.change === null || unchanged
                        ? "text-muted-foreground"
                        : metric.favorable ? "text-success" : "text-destructive",
                    )}>
                      {metric.change !== null && <ChangeIcon className="h-3 w-3" />}
                      {changeText(metric.change)}
                    </span>
                  </div>
                  <p className={cn("mt-2 text-base font-bold", metric.label === "Saldo do mês" && metric.current < 0 && "text-destructive")}>{currency(metric.current)}</p>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">Antes: {currency(metric.previous)}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
            <div className="rounded-lg bg-muted/25 px-3 py-2.5">
              <span className="text-muted-foreground">Você gastou </span>
              <strong className={expenseDifference > 0 ? "text-destructive" : expenseDifference < 0 ? "text-success" : ""}>
                {expenseDifference === 0 ? "o mesmo valor" : `${currency(Math.abs(expenseDifference))} ${expenseDifference > 0 ? "a mais" : "a menos"}`}
              </strong>
              <span className="text-muted-foreground"> que no mês anterior.</span>
            </div>
            <div className="rounded-lg bg-muted/25 px-3 py-2.5">
              {comparison.largestExpenseIncrease ? (
                <>
                  <strong>{comparison.largestExpenseIncrease.category}</strong>
                  <span className="text-muted-foreground"> foi o maior aumento: </span>
                  <strong className="text-destructive">+{currency(comparison.largestExpenseIncrease.difference)}</strong>
                </>
              ) : (
                <span className="text-muted-foreground">Nenhuma categoria teve aumento de gastos.</span>
              )}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

