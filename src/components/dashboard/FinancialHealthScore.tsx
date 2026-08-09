import { useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, HeartPulse, ShieldCheck, Sparkles, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useInstallments } from "@/hooks/useInstallments";
import { useIncomeSources } from "@/hooks/useIncomeSources";
import { useBudgets } from "@/hooks/useBudgets";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { buildFinancialHealthScore } from "@/lib/financialHealthScore";

export function FinancialHealthScore() {
  const reduceMotion = useReducedMotion();
  const navigate = useNavigate();
  const { transactions } = useTransactions();
  const { accounts, totalBalance } = useAccounts();
  const { monthlyCost } = useSubscriptions();
  const { monthlyImpact } = useInstallments();
  const { incomeSources, monthlyIncome: plannedIncome } = useIncomeSources();
  const { budgets } = useBudgets(new Date());
  const { goals } = useFinancialGoals();

  const result = useMemo(() => {
    const start = new Date();
    start.setDate(start.getDate() - 89);
    const recent = transactions.filter((item) => new Date(`${item.date}T12:00:00`) >= start);
    const income = recent.filter((item) => item.type === "income").reduce((total, item) => total + Number(item.amount), 0) / 3;
    const expenses = recent.filter((item) => item.type === "expense").reduce((total, item) => total + Number(item.amount), 0) / 3;
    return buildFinancialHealthScore({
      monthlyIncome: plannedIncome > 0 ? plannedIncome : income,
      monthlyExpenses: expenses,
      liquidBalance: totalBalance,
      monthlyCommitments: monthlyCost + monthlyImpact,
      hasIncomePlan: incomeSources.some((source) => source.active),
      hasAccounts: accounts.length > 0,
      hasBudgets: budgets.length > 0,
      hasGoals: goals.length > 0,
    });
  }, [accounts.length, budgets.length, goals.length, incomeSources, monthlyCost, monthlyImpact, plannedIncome, totalBalance, transactions]);

  const scoreTone = result.score >= 80 ? "text-emerald-300" : result.score >= 60 ? "text-cyan-300" : result.score >= 40 ? "text-amber-300" : "text-rose-300";

  return (
    <motion.section initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="grid overflow-hidden rounded-[2.25rem] border-0 bg-[#07111f] p-0 text-white shadow-[0_34px_95px_-48px_rgba(2,12,27,.85)] lg:grid-cols-[.72fr_1.28fr]">
        <div className="relative flex items-center gap-5 overflow-hidden border-b border-white/10 p-6 lg:border-b-0 lg:border-r lg:p-7">
          <div className="pointer-events-none absolute -left-16 -top-20 h-52 w-52 rounded-full bg-cyan-400/20 blur-3xl" />
          <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(rgb(34 211 238) ${result.score * 3.6}deg, rgb(255 255 255 / .08) 0deg)` }}><div className="grid h-[88px] w-[88px] place-items-center rounded-full bg-[#07111f]"><div className="text-center"><p className={`font-display text-3xl font-extrabold ${scoreTone}`}>{result.score}</p><p className="text-[8px] font-bold uppercase tracking-[.18em] text-slate-500">de 100</p></div></div></div>
          <div className="relative"><p className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.18em] text-cyan-200"><HeartPulse className="h-3.5 w-3.5" />LifeFlow Score</p><h2 className="mt-2 font-display text-xl font-extrabold tracking-[-.04em]">{result.label}</h2><p className="mt-2 text-[11px] leading-5 text-slate-400">Sua organização financeira traduzida em um próximo passo claro.</p></div>
        </div>

        <div className="p-6 lg:p-7">
          <div className="grid gap-5 md:grid-cols-[1fr_.82fr]">
            <div><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.16em] text-slate-400"><Sparkles className="h-3.5 w-3.5 text-cyan-300" />Como a nota foi calculada</div><div className="mt-4 grid grid-cols-2 gap-x-5 gap-y-4">{result.dimensions.map((dimension) => <div key={dimension.id}><div className="flex items-center justify-between text-[10px]"><span className="text-slate-400">{dimension.label}</span><strong className="text-slate-200">{dimension.score}/{dimension.max}</strong></div><Progress value={(dimension.score / dimension.max) * 100} className="mt-2 h-1.5 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-cyan-400 [&>div]:to-emerald-300" /></div>)}</div></div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.065] p-4"><p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.14em] text-emerald-200"><Target className="h-3.5 w-3.5" />Próximo melhor passo</p><p className="mt-2 text-sm font-extrabold">{result.recommendation.title}</p><p className="mt-1.5 text-[10px] leading-4 text-slate-400">{result.recommendation.description}</p><Button size="sm" variant="outline" onClick={() => navigate(result.recommendation.href)} className="mt-3 w-full border-white/10 bg-white/[0.06] text-white hover:bg-white/10 hover:text-white">Agir agora <ArrowRight className="h-3.5 w-3.5" /></Button></div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-[9px] text-slate-500"><ShieldCheck className="h-3.5 w-3.5" />Indicador educativo do LifeFlow; não é score de crédito nem recomendação financeira.</p>
        </div>
      </Card>
    </motion.section>
  );
}
