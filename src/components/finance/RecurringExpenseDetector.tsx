import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { addMonths, addWeeks, differenceInCalendarDays, format, parseISO } from "date-fns";
import { ArrowRight, CalendarSync, Plus, Radar, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/hooks/useTransactions";
import type { NewSubscription, Subscription } from "@/hooks/useSubscriptions";

interface Props {
  transactions: Transaction[];
  subscriptions: Subscription[];
  onCreate: (suggestion: NewSubscription) => void;
}

const normalize = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\d+/g, "").replace(/[^a-z ]/g, " ").replace(/\s+/g, " ").trim();
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function RecurringExpenseDetector({ transactions, subscriptions, onCreate }: Props) {
  const reduceMotion = useReducedMotion();
  const suggestions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();
    transactions.filter((item) => item.type === "expense").forEach((item) => {
      const key = normalize(item.description);
      if (key.length < 3) return;
      groups.set(key, [...(groups.get(key) ?? []), item]);
    });
    const known = subscriptions.map((item) => normalize(item.name));

    return [...groups.entries()].flatMap(([key, items]) => {
      if (items.length < 2 || known.some((name) => name.includes(key) || key.includes(name))) return [];
      const ordered = [...items].sort((a, b) => a.date.localeCompare(b.date));
      const intervals = ordered.slice(1).map((item, index) => differenceInCalendarDays(parseISO(item.date), parseISO(ordered[index].date)));
      const medianInterval = [...intervals].sort((a, b) => a - b)[Math.floor(intervals.length / 2)];
      const frequency: NewSubscription["frequency"] | null = medianInterval >= 5 && medianInterval <= 9 ? "weekly" : medianInterval >= 25 && medianInterval <= 35 ? "monthly" : null;
      if (!frequency) return [];
      const amounts = ordered.map((item) => Number(item.amount));
      const average = amounts.reduce((total, amount) => total + amount, 0) / amounts.length;
      const maxDeviation = Math.max(...amounts.map((amount) => Math.abs(amount - average) / average));
      if (maxDeviation > 0.18) return [];
      const last = ordered[ordered.length - 1];
      const nextDate = frequency === "weekly" ? addWeeks(parseISO(last.date), 1) : addMonths(parseISO(last.date), 1);
      return [{
        key,
        name: last.description,
        amount: average,
        frequency,
        category: last.category,
        accountId: last.account_id,
        occurrences: ordered.length,
        nextDate: format(nextDate, "yyyy-MM-dd"),
        confidence: Math.min(98, 62 + ordered.length * 9 - Math.round(maxDeviation * 100)),
      }];
    }).sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  }, [subscriptions, transactions]);

  if (suggestions.length === 0) return null;

  return (
    <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[2.25rem] p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-500/10 text-violet-600"><Radar className="h-5 w-5" /></span><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-violet-600"><Sparkles className="h-3.5 w-3.5" />Detecção automática</p><h3 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Isto parece recorrente</h3><p className="mt-1 text-xs text-muted-foreground">Encontramos despesas que se repetem com valor e intervalo parecidos.</p></div></div>
        <div className="mt-5 grid gap-2 md:grid-cols-2">
          {suggestions.map((suggestion) => <div key={suggestion.key} className="flex items-center gap-3 rounded-2xl border border-border/55 bg-background/55 p-3.5"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600"><CalendarSync className="h-4 w-4" /></span><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-sm font-bold">{suggestion.name}</p><span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[9px] font-bold text-violet-600">{suggestion.confidence}%</span></div><p className="mt-1 text-[10px] text-muted-foreground">{suggestion.occurrences} cobranças • {suggestion.frequency === "weekly" ? "semanal" : "mensal"} • média {money(suggestion.amount)}</p></div><Button size="sm" variant="outline" className="shrink-0" onClick={() => onCreate({ name: suggestion.name, amount: Number(suggestion.amount.toFixed(2)), frequency: suggestion.frequency, category: "Outros", next_billing_date: suggestion.nextDate, reminder_days_before: 3, account_id: suggestion.accountId, active: true, auto_debit: false })}><Plus className="h-4 w-4" /><span className="hidden sm:inline">Cadastrar</span></Button></div>)}
        </div>
        <p className="mt-4 flex items-center gap-2 text-[10px] text-muted-foreground"><ArrowRight className="h-3.5 w-3.5" />O LifeFlow apenas sugere. Nada será cadastrado ou cobrado sem sua confirmação.</p>
      </Card>
    </motion.div>
  );
}
