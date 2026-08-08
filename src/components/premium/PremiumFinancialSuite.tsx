import { useMemo, useState } from "react";
import { addMonths, addWeeks, addYears, format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Crown,
  Gauge,
  Loader2,
  Plus,
  ReceiptText,
  ShieldAlert,
  Sparkles,
  Target,
  Trash2,
  TrendingUp,
  WalletCards,
  type LucideIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { PremiumModal } from "./PremiumModal";
import { usePlan } from "@/hooks/usePlan";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useInstallments } from "@/hooks/useInstallments";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useDebts, type NewDebt } from "@/hooks/useDebts";
import { useIncomeSources } from "@/hooks/useIncomeSources";
import {
  buildBalanceForecast,
  buildDebtPayoffPlan,
  buildWeeklyFinancialSummary,
  simulatePurchase,
} from "@/lib/premiumFinancialInsights";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function addSubscriptionCommitments(subscriptions: ReturnType<typeof useSubscriptions>["subscriptions"]) {
  const end = addMonths(new Date(), 3);
  return subscriptions.flatMap((subscription) => {
    if (!subscription.active) return [];
    const dates: Array<{ amount: number; date: string }> = [];
    let date = parseISO(subscription.next_billing_date);
    while (!isAfter(date, end)) {
      dates.push({ amount: Number(subscription.amount), date: format(date, "yyyy-MM-dd") });
      date = subscription.frequency === "weekly"
        ? addWeeks(date, 1)
        : subscription.frequency === "yearly"
          ? addYears(date, 1)
          : addMonths(date, 1);
    }
    return dates;
  });
}

function addIncomeCommitments(sources: ReturnType<typeof useIncomeSources>["activeIncomeSources"]) {
  const now = new Date();
  const end = addMonths(now, 3);
  return sources.flatMap((source) => Array.from({ length: 4 }, (_, offset) => {
    const year = addMonths(now, offset).getFullYear();
    const month = addMonths(now, offset).getMonth();
    const lastDay = new Date(year, month + 1, 0).getDate();
    const date = new Date(year, month, Math.min(source.payment_day, lastDay));
    return date > now && date <= end ? { amount: Number(source.amount), date: format(date, "yyyy-MM-dd") } : null;
  }).filter((item): item is { amount: number; date: string } => item !== null));
}

export function PremiumFinancialSuite() {
  const { isPremium } = usePlan();
  const { transactions } = useTransactions();
  const { totalBalance } = useAccounts();
  const { payments, monthlyImpact } = useInstallments();
  const { subscriptions, monthlyCost } = useSubscriptions();
  const { activeIncomeSources, monthlyIncome: configuredMonthlyIncome } = useIncomeSources();
  const { debts, addDebt, deleteDebt, isLoading: debtsLoading, isSaving } = useDebts({ enabled: isPremium });
  const reduceMotion = useReducedMotion();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [debtOpen, setDebtOpen] = useState(false);
  const [purchasePrice, setPurchasePrice] = useState("");
  const [purchaseInstallments, setPurchaseInstallments] = useState("1");
  const [strategy, setStrategy] = useState<"avalanche" | "snowball">("avalanche");
  const [extraPayment, setExtraPayment] = useState("0");
  const [debtForm, setDebtForm] = useState({ name: "", balance: "", rate: "", minimum: "", dueDay: "" });

  const weekly = useMemo(() => buildWeeklyFinancialSummary(transactions), [transactions]);
  const commitments = useMemo(() => [
    ...payments.filter((payment) => !payment.paid).map((payment) => ({ amount: Number(payment.amount), date: payment.due_date })),
    ...addSubscriptionCommitments(subscriptions),
  ], [payments, subscriptions]);
  const predictableIncome = useMemo(() => addIncomeCommitments(activeIncomeSources), [activeIncomeSources]);
  const forecast = useMemo(() => buildBalanceForecast({ currentBalance: totalBalance, transactions, commitments, predictableIncome }), [commitments, predictableIncome, totalBalance, transactions]);
  const historicalMonthlyIncome = useMemo(() => {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 89);
    return transactions
      .filter((item) => item.type === "income" && parseISO(item.date) >= ninetyDaysAgo)
      .reduce((total, item) => total + Number(item.amount), 0) / 3;
  }, [transactions]);
  const monthlyIncome = configuredMonthlyIncome > 0 ? configuredMonthlyIncome : historicalMonthlyIncome;
  const purchase = useMemo(() => {
    const price = Number(purchasePrice);
    if (!price || price <= 0) return null;
    return simulatePurchase({
      price,
      installments: Number(purchaseInstallments) || 1,
      currentBalance: totalBalance,
      monthlyIncome,
      monthlyCommitments: monthlyImpact + monthlyCost,
    });
  }, [monthlyCost, monthlyImpact, monthlyIncome, purchaseInstallments, purchasePrice, totalBalance]);
  const debtPlan = useMemo(() => buildDebtPayoffPlan(
    debts.map((debt) => ({
      id: debt.id,
      name: debt.name,
      balance: Number(debt.balance),
      annualInterestRate: Number(debt.annual_interest_rate),
      minimumPayment: Number(debt.minimum_payment),
    })),
    Number(extraPayment) || 0,
    strategy,
  ), [debts, extraPayment, strategy]);

  const saveDebt = async () => {
    const payload: NewDebt = {
      name: debtForm.name.trim(),
      balance: Number(debtForm.balance),
      annual_interest_rate: Number(debtForm.rate) || 0,
      minimum_payment: Number(debtForm.minimum),
      due_day: debtForm.dueDay ? Number(debtForm.dueDay) : null,
    };
    if (!payload.name || payload.balance <= 0 || payload.minimum_payment <= 0) {
      toast.error("Preencha nome, saldo e pagamento mínimo");
      return;
    }
    try {
      await addDebt(payload);
      setDebtOpen(false);
      setDebtForm({ name: "", balance: "", rate: "", minimum: "", dueDay: "" });
      toast.success("Dívida adicionada ao planejamento");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar a dívida");
    }
  };

  if (!isPremium) {
    return (
      <>
        <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} reason="A Inteligência Financeira é exclusiva do LifeFlow Premium." />
        <Card className="relative overflow-hidden rounded-[1.75rem] border-primary/20 bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-6 text-white shadow-xl sm:p-9">
          <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="relative grid gap-7 md:grid-cols-[1fr_.85fr] md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100"><Crown className="h-4 w-4" />Inteligência Premium</span>
              <h2 className="mt-5 font-display text-3xl font-bold tracking-tight">Entenda o amanhã antes de gastar hoje.</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">Receba seu resumo semanal, projete o saldo, simule compras e organize a quitação das suas dívidas.</p>
              <Button onClick={() => setPremiumOpen(true)} className="mt-6 bg-gradient-to-r from-violet-600 to-cyan-500 text-white shadow-lg">Conhecer Premium <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                [Sparkles, "Resumo semanal"],
                [TrendingUp, "Previsão de 90 dias"],
                [CreditCard, "Simulador de compra"],
                [Target, "Plano de dívidas"],
              ].map(([Icon, label]) => {
                const FeatureIcon = Icon as typeof Sparkles;
                return <div key={String(label)} className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"><FeatureIcon className="h-5 w-5 text-cyan-300" /><p className="mt-3 text-xs font-semibold">{String(label)}</p></div>;
              })}
            </div>
          </div>
        </Card>
      </>
    );
  }

  const expenseTrend = weekly.expenseChangePercent;
  const purchaseTone = purchase?.verdict === "comfortable"
    ? { label: "Cenário confortável", color: "text-success", bg: "border-success/20 bg-success/[0.07]", icon: CheckCircle2 }
    : purchase?.verdict === "attention"
      ? { label: "Analise com atenção", color: "text-warning", bg: "border-warning/20 bg-warning/[0.07]", icon: Gauge }
      : { label: "Impacto elevado", color: "text-destructive", bg: "border-destructive/20 bg-destructive/[0.07]", icon: ShieldAlert };
  const PurchaseIcon = purchaseTone.icon;

  return (
    <div className="space-y-4">
      <Dialog open={debtOpen} onOpenChange={setDebtOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>Adicionar dívida ao planejamento</DialogTitle></DialogHeader>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2"><Label>Nome</Label><Input value={debtForm.name} onChange={(event) => setDebtForm((current) => ({ ...current, name: event.target.value }))} placeholder="Ex: Cartão, financiamento..." /></div>
            <div className="space-y-1.5"><Label>Saldo devedor</Label><Input type="number" min="0" step="0.01" value={debtForm.balance} onChange={(event) => setDebtForm((current) => ({ ...current, balance: event.target.value }))} placeholder="5000,00" /></div>
            <div className="space-y-1.5"><Label>Juros ao ano (%)</Label><Input type="number" min="0" step="0.01" value={debtForm.rate} onChange={(event) => setDebtForm((current) => ({ ...current, rate: event.target.value }))} placeholder="12,5" /></div>
            <div className="space-y-1.5"><Label>Pagamento mínimo</Label><Input type="number" min="0" step="0.01" value={debtForm.minimum} onChange={(event) => setDebtForm((current) => ({ ...current, minimum: event.target.value }))} placeholder="300,00" /></div>
            <div className="space-y-1.5"><Label>Dia de vencimento</Label><Input type="number" min="1" max="31" value={debtForm.dueDay} onChange={(event) => setDebtForm((current) => ({ ...current, dueDay: event.target.value }))} placeholder="10" /></div>
          </div>
          <Button onClick={saveDebt} disabled={isSaving} className="w-full">{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar dívida</Button>
        </DialogContent>
      </Dialog>

      <motion.header
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 p-6 text-white shadow-xl sm:p-7"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-violet-500/25 blur-3xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><span className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-200"><Sparkles className="h-4 w-4" />Inteligência Financeira</span><h2 className="mt-2 font-display text-2xl font-bold">Seu dinheiro, visto de frente e de longe.</h2><p className="mt-2 text-sm text-slate-300">Análises baseadas nos dados registrados no LifeFlow.</p></div>
          <span className="rounded-full border border-white/10 bg-white/[0.08] px-3 py-1.5 text-xs text-slate-200">Atualizado agora</span>
        </div>
      </motion.header>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="rounded-[1.6rem] border-primary/15 bg-gradient-to-br from-card to-primary/[0.05] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Últimos 7 dias</p><h3 className="mt-1 font-display text-lg font-bold">Resumo inteligente</h3></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary"><ReceiptText className="h-5 w-5" /></span></div>
          <div className="mt-5 grid grid-cols-2 gap-3">
            <Metric label="Entradas" value={money(weekly.income)} icon={ArrowUp} tone="text-success bg-success/10" />
            <Metric label="Saídas" value={money(weekly.expenses)} icon={ArrowDown} tone="text-destructive bg-destructive/10" />
            <Metric label="Saldo da semana" value={money(weekly.balance)} icon={WalletCards} tone={weekly.balance >= 0 ? "text-success bg-success/10" : "text-destructive bg-destructive/10"} />
            <Metric label="Lançamentos" value={String(weekly.transactionCount)} icon={BarChart3} tone="text-primary bg-primary/10" />
          </div>
          <div className="mt-4 rounded-2xl border border-border/60 bg-background/55 p-4 text-xs leading-5 text-muted-foreground">
            {expenseTrend === null ? "Registre mais uma semana de dados para comparar seus gastos." : expenseTrend > 0 ? `Seus gastos subiram ${Math.abs(expenseTrend).toFixed(1)}% em relação à semana anterior.` : `Seus gastos caíram ${Math.abs(expenseTrend).toFixed(1)}% em relação à semana anterior.`}
            {weekly.topCategory && ` A categoria com maior saída foi ${weekly.topCategory.name}, com ${money(weekly.topCategory.amount)}.`}
          </div>
        </Card>

        <Card className="rounded-[1.6rem] border-info/15 bg-gradient-to-br from-card to-info/[0.05] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-info">Próximos passos</p><h3 className="mt-1 font-display text-lg font-bold">Previsão de saldo</h3></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-info/10 text-info"><CalendarClock className="h-5 w-5" /></span></div>
          <p className="mt-2 text-xs text-muted-foreground">Estimativa baseada nos últimos 90 dias e compromissos cadastrados.</p>
          <div className="mt-5 grid grid-cols-3 gap-2">
            {forecast.map((item) => (
              <div key={item.days} className="rounded-2xl border border-border/60 bg-background/60 p-3 text-center shadow-sm">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{item.days} dias</p>
                <p className={cn("mt-2 text-sm font-bold", item.projectedBalance >= 0 ? "text-success" : "text-destructive")}>{money(item.projectedBalance)}</p>
                <p className="mt-1 text-[9px] text-muted-foreground">+{money(item.scheduledIncome)} renda • -{money(item.scheduledCommitments)}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] leading-4 text-muted-foreground">Projeção informativa: os valores podem mudar conforme novos lançamentos forem registrados.</p>
        </Card>

        <Card className="rounded-[1.6rem] border-warning/15 bg-gradient-to-br from-card to-warning/[0.05] p-5 shadow-sm">
          <div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-warning">Antes de decidir</p><h3 className="mt-1 font-display text-lg font-bold">Posso comprar?</h3></div><span className="grid h-10 w-10 place-items-center rounded-xl bg-warning/10 text-warning"><CreditCard className="h-5 w-5" /></span></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="space-y-1.5"><Label>Valor da compra</Label><Input type="number" min="0" step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} placeholder="1200,00" /></div><div className="space-y-1.5"><Label>Parcelas</Label><Input type="number" min="1" max="60" value={purchaseInstallments} onChange={(event) => setPurchaseInstallments(event.target.value)} /></div></div>
          {purchase ? (
            <div className={cn("mt-4 rounded-2xl border p-4", purchaseTone.bg)}>
              <div className="flex items-center gap-2"><PurchaseIcon className={cn("h-5 w-5", purchaseTone.color)} /><p className={cn("text-sm font-bold", purchaseTone.color)}>{purchaseTone.label}</p></div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs"><div><p className="text-muted-foreground">Valor da parcela</p><p className="mt-1 font-bold">{money(purchase.installmentAmount)}</p></div><div><p className="text-muted-foreground">Renda comprometida</p><p className="mt-1 font-bold">{purchase.commitmentRatio.toFixed(1)}%</p></div></div>
              <Progress value={Math.min(100, purchase.commitmentRatio)} className="mt-3 h-2" />
              <p className="mt-3 text-[10px] leading-4 text-muted-foreground">Simulação informativa, sem considerar juros da compra ou mudanças futuras de renda.</p>
            </div>
          ) : <div className="mt-4 rounded-2xl border border-dashed border-warning/20 p-5 text-center text-xs text-muted-foreground">Informe o valor para analisar o impacto.</div>}
        </Card>

        <Card className="rounded-[1.6rem] border-destructive/15 bg-gradient-to-br from-card to-destructive/[0.035] p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-destructive">Plano de quitação</p><h3 className="mt-1 font-display text-lg font-bold">Planejador de dívidas</h3></div><Button size="sm" onClick={() => setDebtOpen(true)}><Plus className="mr-1.5 h-4 w-4" />Adicionar</Button></div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setStrategy("avalanche")} className={cn("rounded-xl border px-3 py-2 text-xs font-medium", strategy === "avalanche" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>Avalanche: maiores juros</button>
            <button type="button" onClick={() => setStrategy("snowball")} className={cn("rounded-xl border px-3 py-2 text-xs font-medium", strategy === "snowball" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground")}>Bola de neve: menores saldos</button>
          </div>
          <div className="mt-3 max-w-48 space-y-1.5"><Label>Pagamento extra mensal</Label><Input type="number" min="0" step="0.01" value={extraPayment} onChange={(event) => setExtraPayment(event.target.value)} /></div>

          {debtsLoading ? <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : debts.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-destructive/20 p-6 text-center"><Target className="mx-auto h-6 w-6 text-destructive/60" /><p className="mt-2 text-sm font-medium">Nenhuma dívida cadastrada</p><p className="mt-1 text-xs text-muted-foreground">Adicione seus saldos para montar uma estratégia.</p></div>
          ) : (
            <>
              <div className="mt-4 grid grid-cols-3 gap-2"><SmallStat label="Prazo estimado" value={`${debtPlan.months} meses`} /><SmallStat label="Juros estimados" value={money(debtPlan.totalInterest)} /><SmallStat label="Pagamento mensal" value={money(debtPlan.totalMonthlyPayment)} /></div>
              <div className="mt-4 space-y-2">
                {debtPlan.order.map((id, index) => {
                  const debt = debts.find((item) => item.id === id);
                  if (!debt) return null;
                  return <div key={id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-background/60 p-3"><span className="grid h-7 w-7 place-items-center rounded-lg bg-primary/10 text-xs font-bold text-primary">{index + 1}</span><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{debt.name}</p><p className="text-[10px] text-muted-foreground">{money(Number(debt.balance))} • {Number(debt.annual_interest_rate).toFixed(2)}% a.a.</p></div><Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={async () => { await deleteDebt(debt.id); toast.success("Dívida removida"); }}><Trash2 className="h-4 w-4" /></Button></div>;
                })}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, icon: Icon, tone }: { label: string; value: string; icon: LucideIcon; tone: string }) {
  return <div className="rounded-2xl border border-border/50 bg-background/60 p-3 shadow-sm"><span className={cn("grid h-8 w-8 place-items-center rounded-xl", tone)}><Icon className="h-4 w-4" /></span><p className="mt-3 text-[10px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-bold">{value}</p></div>;
}

function SmallStat({ label, value }: { label: string; value: string }) {
  return <div className="rounded-xl border border-border/50 bg-background/60 p-2.5"><p className="text-[9px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-xs font-bold">{value}</p></div>;
}
