import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Crown, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { PremiumModal } from "./PremiumModal";

export function PlanLimitAlert() {
  const { isPremium, limits, usage } = usePlan();
  const reduceMotion = useReducedMotion();
  const [dismissed, setDismissed] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);

  const reachedLimits = useMemo(() => {
    if (isPremium) return [];
    const items: string[] = [];
    if (usage.transactionsThisMonth >= limits.transactionsPerMonth) {
      items.push(`${limits.transactionsPerMonth} transações neste mês`);
    }
    if (usage.investmentsCount >= limits.investments) {
      items.push(`${limits.investments} investimentos cadastrados`);
    }
    if (usage.goalsCount >= limits.goals) {
      items.push(`${limits.goals} metas ativas`);
    }
    return items;
  }, [isPremium, limits.goals, limits.investments, limits.transactionsPerMonth, usage.goalsCount, usage.investmentsCount, usage.transactionsThisMonth]);

  if (reachedLimits.length === 0) return null;

  const reason = reachedLimits.length === 1
    ? `Você atingiu o limite de ${reachedLimits[0]} do plano gratuito.`
    : `Você atingiu ${reachedLimits.length} limites do plano gratuito: ${reachedLimits.join(", ")}.`;

  return (
    <>
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} reason={reason} />
      {!dismissed && (
        <motion.aside
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="relative overflow-hidden rounded-[1.4rem] border border-violet-500/20 bg-gradient-to-r from-violet-500/[0.1] via-card to-cyan-500/[0.08] p-4 shadow-sm sm:p-5"
        >
          <div className="pointer-events-none absolute -right-12 -top-20 h-44 w-44 rounded-full bg-violet-500/15 blur-3xl" />
          <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <motion.span
                animate={reduceMotion ? undefined : { rotate: [0, -5, 5, 0], scale: [1, 1.08, 1] }}
                transition={{ duration: 3.5, repeat: Infinity, repeatDelay: 2 }}
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-600 to-cyan-500 text-white shadow-lg shadow-violet-500/20"
              >
                <Crown className="h-5 w-5" />
              </motion.span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-display text-base font-bold sm:text-lg">Você chegou ao limite do plano gratuito</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold text-violet-700 dark:text-violet-300">
                    <Sparkles className="h-3 w-3" />Desbloqueie mais
                  </span>
                </div>
                <p className="mt-1 max-w-2xl text-xs leading-5 text-muted-foreground sm:text-sm">{reason} Continue sua organização sem interrupções com o LifeFlow Premium.</p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2 pl-14 sm:pl-0">
              <Button onClick={() => setPremiumOpen(true)} className="bg-gradient-to-r from-violet-600 to-primary text-white shadow-md hover:brightness-110">
                Conhecer Premium <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDismissed(true)} aria-label="Fechar aviso" className="h-9 w-9 text-muted-foreground">
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.aside>
      )}
    </>
  );
}
