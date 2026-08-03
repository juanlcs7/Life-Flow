import { CalendarClock, Gauge, Info, TrendingDown, Wallet } from "lucide-react";
import { isBefore, isSameMonth, parseISO, startOfDay } from "date-fns";
import type { Transaction } from "@/hooks/useTransactions";
import type { Installment, InstallmentPayment } from "@/hooks/useInstallments";
import type { Subscription } from "@/hooks/useSubscriptions";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { calculateMonthForecast, type ForecastConfidence } from "@/lib/monthForecast";
import { cn } from "@/lib/utils";

interface MonthForecastProps {
  selectedMonth: Date;
  transactions: Transaction[];
  installments: Installment[];
  payments: InstallmentPayment[];
  subscriptions: Subscription[];
}

const currency = (value: number) =>
  value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const confidenceLabels: Record<ForecastConfidence, string> = {
  low: "Inicial",
  medium: "Moderada",
  high: "Boa",
};

export function MonthForecast({ selectedMonth, transactions, installments, payments, subscriptions }: MonthForecastProps) {
  const now = new Date();
  if (!isSameMonth(selectedMonth, now)) return null;

  const installmentById = new Map(installments.map((installment) => [installment.id, installment]));
  const fixedExpensePatterns = [
    ...payments.flatMap((payment) => {
      const installment = installmentById.get(payment.installment_id);
      return installment ? [{
        description: `${installment.description} (${payment.payment_number}/${installment.installment_count})`,
        amount: payment.amount,
      }] : [];
    }),
    ...subscriptions.map((subscription) => ({
      description: `${subscription.name} (assinatura)`,
      amount: subscription.amount,
    })),
  ];
  const today = startOfDay(now);
  const upcomingInstallments = payments
    .filter((payment) => !payment.paid && isSameMonth(parseISO(payment.due_date), now) && !isBefore(parseISO(payment.due_date), today))
    .reduce((total, payment) => total + payment.amount, 0);
  const upcomingSubscriptions = subscriptions
    .filter((subscription) => subscription.active && isSameMonth(parseISO(subscription.next_billing_date), now) && !isBefore(parseISO(subscription.next_billing_date), today))
    .reduce((total, subscription) => total + subscription.amount, 0);
  const forecast = calculateMonthForecast(transactions, now, {
    fixedExpensePatterns,
    upcomingFixedExpenses: upcomingInstallments + upcomingSubscriptions,
  });
  const monthProgress = Math.round((forecast.elapsedDays / forecast.totalDays) * 100);

  return (
    <Card className="overflow-hidden border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Previsão do mês</p>
          <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">Como o mês pode terminar</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Estimativa baseada no ritmo de despesas registrado até hoje.</p>
        </div>
        <span className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/30 px-2.5 py-1.5 text-[11px] text-muted-foreground">
          <Gauge className="h-3.5 w-3.5" />Confiança {confidenceLabels[forecast.confidence].toLowerCase()}
        </span>
      </div>

      {forecast.expensesSoFar === 0 ? (
        <div className="mt-5 rounded-xl border border-dashed border-border px-5 py-8 text-center">
          <CalendarClock className="mx-auto h-7 w-7 text-muted-foreground/60" />
          <p className="mt-2 text-sm font-medium">Ainda não há despesas para projetar</p>
          <p className="mt-1 text-xs text-muted-foreground">A previsão aparecerá conforme os gastos do mês forem registrados.</p>
        </div>
      ) : (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><TrendingDown className="h-3.5 w-3.5" />Despesas projetadas</p>
              <p className="mt-2 text-base font-bold text-destructive">{currency(forecast.projectedExpenses)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Até agora: {currency(forecast.expensesSoFar)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground"><Wallet className="h-3.5 w-3.5" />Saldo projetado</p>
              <p className={cn("mt-2 text-base font-bold", forecast.projectedBalance >= 0 ? "text-success" : "text-destructive")}>
                {currency(forecast.projectedBalance)}
              </p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Saldo atual: {currency(forecast.currentBalance)}</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <p className="text-xs text-muted-foreground">Média diária variável</p>
              <p className="mt-2 text-base font-bold">{currency(forecast.averageDailyExpense)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Em {forecast.elapsedDays} dias do mês</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <p className="text-xs text-muted-foreground">Ainda pode sair</p>
              <p className="mt-2 text-base font-bold">{currency(forecast.expectedAdditionalExpenses)}</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">Mantendo o ritmo atual</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-border/60 bg-muted/20 px-3.5 py-3">
            <div className="mb-3 grid gap-2 border-b border-border/60 pb-3 text-[11px] sm:grid-cols-2">
              <p><span className="text-muted-foreground">Fixos já pagos: </span><strong>{currency(forecast.fixedExpensesSoFar)}</strong></p>
              <p><span className="text-muted-foreground">Fixos ainda previstos: </span><strong>{currency(forecast.upcomingFixedExpenses)}</strong></p>
            </div>
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-muted-foreground">Progresso do mês</span>
              <span className="font-semibold">Dia {forecast.elapsedDays} de {forecast.totalDays}</span>
            </div>
            <Progress value={monthProgress} className="mt-2 h-1.5" />
          </div>

          <p className="mt-3 flex items-start gap-1.5 text-[10px] leading-relaxed text-muted-foreground">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            Parcelas e assinaturas são contabilizadas uma vez; somente despesas variáveis seguem a média diária. O saldo considera as receitas já registradas e não prevê entradas futuras.
          </p>
        </>
      )}
    </Card>
  );
}
