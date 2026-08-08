import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { addDays, addMonths, addWeeks, addYears, format, isAfter, isBefore, isEqual, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ArrowDown, ArrowUp, CalendarClock, CheckCircle2, CircleAlert, Clock3, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Account } from "@/hooks/useAccounts";
import type { IncomeSource } from "@/hooks/useIncomeSources";
import type { Installment, InstallmentPayment } from "@/hooks/useInstallments";
import type { Subscription } from "@/hooks/useSubscriptions";
import { cn } from "@/lib/utils";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface TimelineEvent {
  id: string;
  date: Date;
  title: string;
  detail: string;
  amount: number;
  type: "income" | "expense";
  balanceAfter: number;
}

interface Props {
  totalBalance: number;
  accounts: Account[];
  incomeSources: IncomeSource[];
  installments: Installment[];
  payments: InstallmentPayment[];
  subscriptions: Subscription[];
}

const inWindow = (date: Date, start: Date, end: Date) => (isAfter(date, start) || isEqual(date, start)) && (isBefore(date, end) || isEqual(date, end));

export function FinancialTimeline({ totalBalance, accounts, incomeSources, installments, payments, subscriptions }: Props) {
  const reduceMotion = useReducedMotion();
  const today = startOfDay(new Date());
  const horizon = addDays(today, 45);

  const events = useMemo(() => {
    const drafts: Omit<TimelineEvent, "balanceAfter">[] = [];
    const installmentNames = new Map(installments.map((item) => [item.id, item.description]));

    incomeSources.filter((source) => source.active).forEach((source) => {
      for (let offset = 0; offset < 3; offset += 1) {
        const base = addMonths(today, offset);
        const lastDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
        const date = new Date(base.getFullYear(), base.getMonth(), Math.min(source.payment_day, lastDay));
        if (!inWindow(date, today, horizon)) continue;
        const account = accounts.find((item) => item.id === source.account_id);
        drafts.push({ id: `income-${source.id}-${format(date, "yyyy-MM-dd")}`, date, title: source.name, detail: account?.name ?? "Renda prevista", amount: Number(source.amount), type: "income" });
      }
    });

    payments.filter((payment) => !payment.paid).forEach((payment) => {
      const date = startOfDay(parseISO(payment.due_date));
      if (!inWindow(date, today, horizon)) return;
      drafts.push({ id: `payment-${payment.id}`, date, title: installmentNames.get(payment.installment_id) ?? "Parcela", detail: `Parcela ${payment.payment_number}`, amount: Number(payment.amount), type: "expense" });
    });

    subscriptions.filter((subscription) => subscription.active).forEach((subscription) => {
      let date = startOfDay(parseISO(subscription.next_billing_date));
      let occurrence = 0;
      while (!isAfter(date, horizon) && occurrence < 8) {
        if (inWindow(date, today, horizon)) drafts.push({ id: `subscription-${subscription.id}-${format(date, "yyyy-MM-dd")}`, date, title: subscription.name, detail: "Assinatura recorrente", amount: Number(subscription.amount), type: "expense" });
        date = subscription.frequency === "weekly" ? addWeeks(date, 1) : subscription.frequency === "yearly" ? addYears(date, 1) : addMonths(date, 1);
        occurrence += 1;
      }
    });

    drafts.sort((a, b) => a.date.getTime() - b.date.getTime() || (a.type === "income" ? -1 : 1));
    let runningBalance = totalBalance;
    return drafts.map((event) => {
      runningBalance += event.type === "income" ? event.amount : -event.amount;
      return { ...event, balanceAfter: runningBalance };
    });
  }, [accounts, horizon, incomeSources, installments, payments, subscriptions, today, totalBalance]);

  const lowestBalance = events.length ? Math.min(totalBalance, ...events.map((event) => event.balanceAfter)) : totalBalance;
  const totalIncome = events.filter((event) => event.type === "income").reduce((total, event) => total + event.amount, 0);
  const totalExpenses = events.filter((event) => event.type === "expense").reduce((total, event) => total + event.amount, 0);
  const firstRisk = events.find((event) => event.balanceAfter < 0);

  return (
    <motion.section initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[2.25rem] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-600"><CalendarClock className="h-5 w-5" /></span><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-cyan-600"><Sparkles className="h-3.5 w-3.5" />Próximos 45 dias</p><h3 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Agenda financeira</h3><p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">Veja quando o dinheiro entra, quando sai e como cada compromisso pode afetar seu saldo.</p></div></div>
          <div className="grid grid-cols-3 gap-2 lg:min-w-[390px]"><MiniStat label="Entradas" value={money(totalIncome)} tone="text-emerald-600" /><MiniStat label="Saídas" value={money(totalExpenses)} tone="text-rose-600" /><MiniStat label="Menor saldo" value={money(lowestBalance)} tone={lowestBalance >= 0 ? "text-cyan-600" : "text-rose-600"} /></div>
        </div>

        {firstRisk ? <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/[0.07] p-4"><CircleAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" /><div><p className="text-sm font-bold text-rose-700 dark:text-rose-300">Atenção antes de {format(firstRisk.date, "dd 'de' MMMM", { locale: ptBR })}</p><p className="mt-1 text-xs text-muted-foreground">Com os compromissos cadastrados, o saldo projetado chega a {money(firstRisk.balanceAfter)}. Ajuste uma data ou reserve dinheiro antes desse ponto.</p></div></div> : events.length > 0 && <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-3.5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><p className="text-xs"><strong className="text-emerald-700 dark:text-emerald-300">Fluxo protegido:</strong> nenhum saldo negativo previsto nos próximos 45 dias.</p></div>}

        {events.length === 0 ? <div className="mt-5 rounded-2xl border border-dashed border-border p-8 text-center"><Clock3 className="mx-auto h-7 w-7 text-muted-foreground/40" /><p className="mt-3 text-sm font-bold">Nenhum evento financeiro previsto</p><p className="mt-1 text-xs text-muted-foreground">Cadastre sua renda, parcelas ou assinaturas para montar a linha do tempo.</p></div> : <div className="mt-6 max-h-[390px] space-y-1 overflow-y-auto pr-1">{events.map((event) => <div key={event.id} className="relative flex items-center gap-3 py-2.5 pl-1 before:absolute before:bottom-0 before:left-[20px] before:top-0 before:w-px before:bg-border last:before:bottom-1/2 first:before:top-1/2"><span className={cn("relative z-10 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border-4 border-card", event.type === "income" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white")}>{event.type === "income" ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />}</span><div className="min-w-0 flex-1 rounded-2xl border border-border/55 bg-background/55 p-3"><div className="flex flex-wrap items-center justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-bold">{event.title}</p><p className="mt-0.5 text-[10px] text-muted-foreground"><span className="capitalize">{format(event.date, "EEE, dd MMM", { locale: ptBR })}</span> • {event.detail}</p></div><div className="text-right"><p className={cn("text-xs font-extrabold", event.type === "income" ? "text-emerald-600" : "text-rose-600")}>{event.type === "income" ? "+" : "−"}{money(event.amount)}</p><p className={cn("mt-0.5 text-[9px]", event.balanceAfter >= 0 ? "text-muted-foreground" : "font-bold text-rose-600")}>Saldo: {money(event.balanceAfter)}</p></div></div></div></div>)}</div>}
        <p className="mt-4 text-[9px] leading-4 text-muted-foreground">Projeção baseada apenas nos eventos cadastrados. Compras futuras e rendimentos não registrados podem alterar o resultado.</p>
      </Card>
    </motion.section>
  );
}

function MiniStat({ label, value, tone }: { label: string; value: string; tone: string }) {
  return <div className="rounded-2xl border border-border/55 bg-background/55 p-3"><p className="text-[9px] text-muted-foreground">{label}</p><p className={cn("mt-1 truncate text-xs font-extrabold", tone)}>{value}</p></div>;
}
