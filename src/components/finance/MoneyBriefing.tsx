import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { addDays, endOfMonth, isAfter, parseISO, startOfDay } from "date-fns";
import { ArrowRight, BrainCircuit, CalendarClock, Gauge, MessageCircleMore, ShieldCheck, Sparkles, TrendingDown, TrendingUp, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { Transaction } from "@/hooks/useTransactions";
import type { InstallmentPayment } from "@/hooks/useInstallments";
import type { Subscription } from "@/hooks/useSubscriptions";
import { cn } from "@/lib/utils";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

type Question = "available" | "category" | "month" | "upcoming";

interface Props {
  transactions: Transaction[];
  totalBalance: number;
  expectedMonthlyIncome: number;
  payments: InstallmentPayment[];
  subscriptions: Subscription[];
  selectedMonth: Date;
}

export function MoneyBriefing({ transactions, totalBalance, expectedMonthlyIncome, payments, subscriptions, selectedMonth }: Props) {
  const reduceMotion = useReducedMotion();
  const [question, setQuestion] = useState<Question>("available");
  const today = startOfDay(new Date());
  const monthEnd = endOfMonth(selectedMonth);
  const daysInMonth = monthEnd.getDate();
  const elapsedDays = Math.max(1, selectedMonth.getMonth() === today.getMonth() && selectedMonth.getFullYear() === today.getFullYear() ? today.getDate() : daysInMonth);
  const remainingDays = Math.max(0, daysInMonth - elapsedDays);

  const analysis = useMemo(() => {
    const income = transactions.filter((item) => item.type === "income").reduce((total, item) => total + Number(item.amount), 0);
    const expenses = transactions.filter((item) => item.type === "expense").reduce((total, item) => total + Number(item.amount), 0);
    const dailyExpense = expenses / elapsedDays;
    const projectedExpenses = dailyExpense * daysInMonth;
    const projectedIncome = Math.max(income, expectedMonthlyIncome);
    const nextThirtyDays = addDays(today, 30);
    const installmentCommitments = payments.filter((item) => !item.paid && isAfter(parseISO(item.due_date), today) && !isAfter(parseISO(item.due_date), nextThirtyDays)).reduce((total, item) => total + Number(item.amount), 0);
    const subscriptionCommitments = subscriptions.filter((item) => item.active && isAfter(parseISO(item.next_billing_date), today) && !isAfter(parseISO(item.next_billing_date), nextThirtyDays)).reduce((total, item) => total + Number(item.amount), 0);
    const upcomingCommitments = installmentCommitments + subscriptionCommitments;
    const safetyReserve = Math.max(projectedExpenses * 0.1, 0);
    const available = Math.max(0, totalBalance - upcomingCommitments - safetyReserve);
    const projectedMonthBalance = projectedIncome - projectedExpenses;
    const categoryTotals = new Map<string, number>();
    transactions.filter((item) => item.type === "expense").forEach((item) => categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + Number(item.amount)));
    const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
    const pace = projectedIncome > 0 ? (projectedExpenses / projectedIncome) * 100 : expenses > 0 ? 100 : 0;
    return { income, expenses, dailyExpense, projectedExpenses, projectedMonthBalance, upcomingCommitments, available, safetyReserve, topCategory, pace };
  }, [elapsedDays, expectedMonthlyIncome, payments, subscriptions, today, totalBalance, transactions, daysInMonth]);

  const answers: Record<Question, { title: string; answer: string; detail: string; tone: string }> = {
    available: {
      title: "Quanto está livre para usar?",
      answer: money(analysis.available),
      detail: `Estimativa após separar ${money(analysis.upcomingCommitments)} para os próximos 30 dias e uma margem de segurança de ${money(analysis.safetyReserve)}.`,
      tone: analysis.available > 0 ? "text-emerald-300" : "text-amber-300",
    },
    category: {
      title: "Onde estou gastando mais?",
      answer: analysis.topCategory?.[0] ?? "Ainda sem dados",
      detail: analysis.topCategory ? `${money(analysis.topCategory[1])} no mês, equivalente a ${analysis.expenses > 0 ? ((analysis.topCategory[1] / analysis.expenses) * 100).toFixed(0) : 0}% das suas despesas.` : "Registre algumas despesas para o LifeFlow encontrar seu padrão principal.",
      tone: "text-cyan-300",
    },
    month: {
      title: "Como o mês tende a terminar?",
      answer: money(analysis.projectedMonthBalance),
      detail: `Mantendo o ritmo atual de ${money(analysis.dailyExpense)} por dia durante os ${remainingDays} dias restantes.`,
      tone: analysis.projectedMonthBalance >= 0 ? "text-emerald-300" : "text-rose-300",
    },
    upcoming: {
      title: "O que vence nos próximos dias?",
      answer: money(analysis.upcomingCommitments),
      detail: "Total de parcelas e assinaturas cadastradas com vencimento nos próximos 30 dias.",
      tone: "text-violet-300",
    },
  };
  const current = answers[question];

  const status = analysis.pace <= 70 ? { label: "Ritmo saudável", icon: ShieldCheck, tone: "text-emerald-600 bg-emerald-500/10" } : analysis.pace <= 90 ? { label: "Atenção ao ritmo", icon: Gauge, tone: "text-amber-600 bg-amber-500/10" } : { label: "Risco de fechar negativo", icon: TrendingDown, tone: "text-rose-600 bg-rose-500/10" };
  const StatusIcon = status.icon;

  return (
    <section className="grid gap-4 xl:grid-cols-[1.2fr_.8fr]">
      <Card className="relative overflow-hidden rounded-[2.25rem] border-0 bg-[#07111f] p-0 text-white shadow-[0_35px_90px_-45px_rgba(2,12,27,.85)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(45,212,191,.2),transparent_32%),radial-gradient(circle_at_90%_100%,rgba(139,92,246,.18),transparent_35%)]" />
        <div className="relative p-6 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.2em] text-cyan-200"><BrainCircuit className="h-4 w-4" />Briefing do seu dinheiro</p><h2 className="mt-2 font-display text-2xl font-extrabold tracking-[-.045em]">Pergunte. Entenda. Decida.</h2></div><span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold", status.tone)}><StatusIcon className="h-3.5 w-3.5" />{status.label}</span></div>

          <div className="mt-6 flex flex-wrap gap-2">
            {([
              ["available", "Quanto posso usar?"],
              ["category", "Onde mais gastei?"],
              ["month", "Como fecha o mês?"],
              ["upcoming", "O que vence?"],
            ] as Array<[Question, string]>).map(([id, label]) => <button key={id} type="button" onClick={() => setQuestion(id)} className={cn("rounded-full border px-3 py-2 text-[11px] font-semibold transition-all", question === id ? "border-cyan-300/30 bg-cyan-300/15 text-cyan-100" : "border-white/10 bg-white/[0.05] text-slate-400 hover:bg-white/10 hover:text-white")}>{label}</button>)}
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={question} initial={reduceMotion ? undefined : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={reduceMotion ? undefined : { opacity: 0, y: -8 }} className="mt-6 rounded-[1.6rem] border border-white/10 bg-white/[0.065] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-xs text-slate-400"><MessageCircleMore className="h-4 w-4 text-cyan-300" />{current.title}</div>
              <p className={cn("mt-3 font-display text-3xl font-extrabold tracking-[-.05em] sm:text-4xl", current.tone)}>{current.answer}</p>
              <p className="mt-3 max-w-2xl text-xs leading-5 text-slate-400">{current.detail}</p>
            </motion.div>
          </AnimatePresence>
          <p className="mt-4 text-[9px] leading-4 text-slate-500">Estimativas informativas calculadas com os dados cadastrados no LifeFlow. Não constituem recomendação financeira.</p>
        </div>
      </Card>

      <Card className="rounded-[2.25rem] p-5 sm:p-6">
        <div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-primary">Pulso do mês</p><h3 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Seu dinheiro em movimento</h3></div><span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/10 text-primary"><Sparkles className="h-5 w-5" /></span></div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          <BriefMetric icon={TrendingUp} label="Entrou" value={money(analysis.income)} tone="text-emerald-600 bg-emerald-500/10" />
          <BriefMetric icon={TrendingDown} label="Saiu" value={money(analysis.expenses)} tone="text-rose-600 bg-rose-500/10" />
          <BriefMetric icon={CalendarClock} label="Próximos 30 dias" value={money(analysis.upcomingCommitments)} tone="text-violet-600 bg-violet-500/10" />
          <BriefMetric icon={WalletCards} label="Saldo em contas" value={money(totalBalance)} tone="text-cyan-600 bg-cyan-500/10" />
        </div>
        <div className="mt-5 rounded-2xl border border-border/60 bg-background/55 p-4"><div className="flex items-center justify-between text-xs"><span className="text-muted-foreground">Ritmo da renda comprometida</span><strong>{Math.min(999, analysis.pace).toFixed(0)}%</strong></div><Progress value={Math.min(100, analysis.pace)} className="mt-3 h-2" /></div>
        <Button variant="ghost" className="mt-3 w-full justify-between text-xs text-muted-foreground">Análise atualizada com seus lançamentos <ArrowRight className="h-4 w-4" /></Button>
      </Card>
    </section>
  );
}

function BriefMetric({ icon: Icon, label, value, tone }: { icon: typeof TrendingUp; label: string; value: string; tone: string }) {
  return <div className="rounded-2xl border border-border/55 bg-background/60 p-3.5"><span className={cn("grid h-8 w-8 place-items-center rounded-xl", tone)}><Icon className="h-4 w-4" /></span><p className="mt-3 text-[10px] text-muted-foreground">{label}</p><p className="mt-1 truncate text-sm font-extrabold">{value}</p></div>;
}
