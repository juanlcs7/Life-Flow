import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { differenceInCalendarDays, differenceInCalendarMonths, endOfMonth, isSameMonth, parseISO } from "date-fns";
import { CalendarDays, CircleAlert, Coins, Flag, Gauge, Layers3, ReceiptText, Sparkles, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { MonthlyBudget } from "@/hooks/useBudgets";
import type { FinancialGoal } from "@/hooks/useFinancialGoals";
import type { Installment, InstallmentPayment } from "@/hooks/useInstallments";
import type { Subscription } from "@/hooks/useSubscriptions";
import type { Transaction } from "@/hooks/useTransactions";
import { buildMoneyPlan, calculateSafeToSpend } from "@/lib/moneyPlan";
import { monthlyEquivalent } from "@/lib/financialCalculations";
import { cn } from "@/lib/utils";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface Props {
  expectedIncome: number;
  budgets: MonthlyBudget[];
  subscriptions: Subscription[];
  installments: Installment[];
  payments: InstallmentPayment[];
  goals: FinancialGoal[];
  transactions: Transaction[];
  selectedMonth: Date;
}

export function MoneyAllocationPlan({ expectedIncome, budgets, subscriptions, installments, payments, goals, transactions, selectedMonth }: Props) {
  const reduceMotion = useReducedMotion();
  const plan = useMemo(() => {
    const unpaidInstallments = new Set(payments.filter((payment) => !payment.paid).map((payment) => payment.installment_id));
    const commitments = [
      ...subscriptions.filter((item) => item.active).map((item) => ({ category: item.category, amount: monthlyEquivalent(Number(item.amount), item.frequency) })),
      ...installments.filter((item) => unpaidInstallments.has(item.id)).map((item) => ({ category: item.category, amount: Number(item.installment_amount) })),
    ];
    const plannedGoals = goals.filter((goal) => goal.deadline && goal.current_amount < goal.target_amount).map((goal) => ({ name: goal.name, remaining: Number(goal.target_amount) - Number(goal.current_amount), monthsRemaining: Math.max(1, differenceInCalendarMonths(parseISO(goal.deadline!), new Date())) }));
    return buildMoneyPlan({ income: expectedIncome, commitments, budgets, goals: plannedGoals });
  }, [budgets, expectedIncome, goals, installments, payments, subscriptions]);

  const safeSpending = useMemo(() => {
    const expensesByCategory = transactions.filter((item) => item.type === "expense").reduce((totals, item) => {
      totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount));
      return totals;
    }, new Map<string, number>());
    const variableSpent = plan.variableAllocations.reduce((total, allocation) => {
      const categorySpent = expensesByCategory.get(allocation.category) ?? 0;
      return total + Math.min(allocation.amount, Math.max(0, categorySpent - allocation.fixed));
    }, 0);
    const today = new Date();
    const daysRemaining = isSameMonth(selectedMonth, today)
      ? differenceInCalendarDays(endOfMonth(today), today) + 1
      : 1;
    return calculateSafeToSpend({ unassigned: plan.unassigned, variableBudget: plan.variable, variableSpent, daysRemaining });
  }, [plan, selectedMonth, transactions]);

  const parts = [
    { label: "Compromissos fixos", value: plan.fixed, color: "bg-violet-500", tone: "text-violet-600 bg-violet-500/10", icon: ReceiptText },
    { label: "Gastos planejados", value: plan.variable, color: "bg-cyan-500", tone: "text-cyan-600 bg-cyan-500/10", icon: Layers3 },
    { label: "Metas com prazo", value: plan.goals, color: "bg-emerald-500", tone: "text-emerald-600 bg-emerald-500/10", icon: Flag },
    { label: plan.overallocated ? "Faltando distribuir" : "Livre para decidir", value: Math.abs(plan.unassigned), color: plan.overallocated ? "bg-rose-500" : "bg-amber-400", tone: plan.overallocated ? "text-rose-600 bg-rose-500/10" : "text-amber-600 bg-amber-500/10", icon: WalletCards },
  ];

  return (
    <motion.section initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[2.25rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-600"><Coins className="h-5 w-5" /></span><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-600"><Sparkles className="h-3.5 w-3.5" />Cada real com uma função</p><h3 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Plano do dinheiro</h3><p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">Distribuição sugerida com sua renda, compromissos, orçamentos e metas já cadastrados.</p></div></div><div className="rounded-2xl border border-border/60 bg-background/60 px-4 py-3 lg:min-w-52"><p className="text-[9px] uppercase tracking-[.14em] text-muted-foreground">Renda mensal prevista</p><p className="mt-1 font-display text-xl font-extrabold text-emerald-600">{money(plan.income)}</p></div></div>

        {expectedIncome <= 0 ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-dashed border-amber-500/25 bg-amber-500/[0.05] p-5"><CircleAlert className="mt-0.5 h-5 w-5 text-amber-600" /><div><p className="text-sm font-bold">Cadastre sua renda mensal para montar o plano</p><p className="mt-1 text-xs text-muted-foreground">Depois disso, o LifeFlow distribui automaticamente o que já está comprometido e mostra o que ficou livre.</p></div></div> : <>
          <div className="mt-6 flex h-4 overflow-hidden rounded-full bg-muted">{parts.slice(0, 3).map((part) => <span key={part.label} className={part.color} style={{ width: `${Math.min(100, Math.max(0, (part.value / plan.income) * 100))}%` }} />)}{!plan.overallocated && <span className={parts[3].color} style={{ width: `${Math.min(100, Math.max(0, (plan.unassigned / plan.income) * 100))}%` }} />}</div>
          <div className="mt-5 grid grid-cols-2 gap-3 lg:grid-cols-4">{parts.map((part) => { const Icon = part.icon; return <div key={part.label} className="rounded-2xl border border-border/55 bg-background/55 p-3.5"><span className={cn("grid h-8 w-8 place-items-center rounded-xl", part.tone)}><Icon className="h-4 w-4" /></span><p className="mt-3 text-[10px] text-muted-foreground">{part.label}</p><p className={cn("mt-1 text-sm font-extrabold", plan.overallocated && part === parts[3] && "text-rose-600")}>{money(part.value)}</p></div>; })}</div>
          {isSameMonth(selectedMonth, new Date()) && !plan.overallocated && <div className="mt-4 overflow-hidden rounded-[1.5rem] border border-cyan-500/20 bg-gradient-to-r from-cyan-500/[0.09] via-background/70 to-violet-500/[0.08] p-4 sm:p-5"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-cyan-500/12 text-cyan-600"><Gauge className="h-5 w-5" /></span><div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-cyan-700 dark:text-cyan-300">Quanto posso gastar hoje?</p><p className="mt-1 font-display text-2xl font-black tracking-tight text-foreground">{money(safeSpending.daily)}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">Valor diário sugerido sem consumir o que já está reservado no seu plano.</p></div></div><div className="flex items-center gap-2 rounded-2xl border border-border/50 bg-background/60 px-3.5 py-2.5 text-[10px] text-muted-foreground"><CalendarDays className="h-4 w-4 text-violet-500" /><span><strong className="text-foreground">{safeSpending.daysRemaining} dias</strong> restantes · {money(safeSpending.available)} disponíveis</span></div></div></div>}
          {plan.overallocated ? <div className="mt-4 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.06] p-4"><CircleAlert className="mt-0.5 h-5 w-5 text-rose-600" /><div><p className="text-sm font-bold text-rose-700 dark:text-rose-300">Seu plano ultrapassa a renda prevista</p><p className="mt-1 text-xs text-muted-foreground">Revise limites, assinaturas ou o valor mensal reservado para metas.</p></div></div> : plan.unassigned > plan.income * 0.2 && <div className="mt-4 rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4 text-xs"><strong className="text-amber-700 dark:text-amber-300">Ainda há {money(plan.unassigned)} sem destino.</strong><span className="text-muted-foreground"> Você pode aumentar sua reserva, acelerar uma meta ou manter esse valor como margem.</span></div>}
          {plan.goalAllocations.length > 0 && <div className="mt-4 border-t border-border/60 pt-4"><p className="text-[10px] font-bold uppercase tracking-[.14em] text-muted-foreground">Reserva mensal para metas</p><div className="mt-2 flex flex-wrap gap-2">{plan.goalAllocations.slice(0, 4).map((goal) => <span key={goal.name} className="rounded-full border border-emerald-500/15 bg-emerald-500/[0.06] px-3 py-1.5 text-[10px]"><strong>{goal.name}</strong> • {money(goal.amount)}/mês</span>)}</div></div>}
        </>}
        <p className="mt-4 text-[9px] leading-4 text-muted-foreground">Compromissos que já pertencem a uma categoria orçada são descontados do limite variável para evitar contagem duplicada.</p>
      </Card>
    </motion.section>
  );
}
