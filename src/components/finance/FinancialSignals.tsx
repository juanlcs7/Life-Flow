import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowDownRight, ArrowRight, CircleAlert, Radar, ShieldCheck, Sparkles, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Transaction } from "@/hooks/useTransactions";
import { buildFinancialSignals } from "@/lib/financialSignals";
import { cn } from "@/lib/utils";

const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function FinancialSignals({ transactions }: { transactions: Transaction[] }) {
  const reduceMotion = useReducedMotion();
  const signals = useMemo(() => buildFinancialSignals(transactions), [transactions]);

  return (
    <motion.section initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="rounded-[2.25rem] p-5 sm:p-6">
        <div className="flex items-start gap-3"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-500/10 text-amber-600"><Radar className="h-5 w-5" /></span><div><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-amber-600"><Sparkles className="h-3.5 w-3.5" />Análise proativa</p><h3 className="mt-1 font-display text-xl font-extrabold tracking-[-.035em]">Radar de gastos</h3><p className="mt-1 text-xs text-muted-foreground">Mudanças relevantes encontradas no seu comportamento financeiro.</p></div></div>

        {signals.length === 0 ? <div className="mt-5 flex items-center gap-3 rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.06] p-4"><ShieldCheck className="h-5 w-5 text-emerald-600" /><div><p className="text-sm font-bold">Nenhuma mudança importante detectada</p><p className="mt-1 text-xs text-muted-foreground">Continue registrando seus lançamentos para deixar o radar mais preciso.</p></div></div> : <div className="mt-5 grid gap-2 md:grid-cols-2 xl:grid-cols-3">{signals.map((signal) => {
          const visual = signal.severity === "danger" ? { icon: CircleAlert, box: "border-rose-500/20 bg-rose-500/[0.06]", iconTone: "bg-rose-500/10 text-rose-600" } : signal.severity === "attention" ? { icon: TrendingUp, box: "border-amber-500/20 bg-amber-500/[0.06]", iconTone: "bg-amber-500/10 text-amber-600" } : { icon: ArrowDownRight, box: "border-emerald-500/20 bg-emerald-500/[0.06]", iconTone: "bg-emerald-500/10 text-emerald-600" };
          const Icon = visual.icon;
          return <article key={signal.id} className={cn("rounded-2xl border p-4", visual.box)}><div className="flex items-start gap-3"><span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", visual.iconTone)}><Icon className="h-4 w-4" /></span><div className="min-w-0"><p className="text-sm font-extrabold">{signal.title}</p><p className="mt-1.5 text-[11px] leading-4 text-muted-foreground">{signal.description}</p>{signal.value > 0 && <p className="mt-3 text-xs font-bold">{money(signal.value)}</p>}</div></div></article>;
        })}</div>}
        <Button variant="ghost" className="mt-3 w-full justify-between text-xs text-muted-foreground">Atualizado automaticamente com seus lançamentos <ArrowRight className="h-4 w-4" /></Button>
      </Card>
    </motion.section>
  );
}
