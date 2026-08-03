import { useEffect, useMemo, useState } from "react";
import { Check, ChevronRight, Circle, ListChecks, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useAccounts } from "@/hooks/useAccounts";
import { useAuth } from "@/hooks/useAuth";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useGoals } from "@/hooks/useGoals";
import { useHabits } from "@/hooks/useHabits";
import { useTasks } from "@/hooks/useTasks";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";

export function GettingStartedChecklist() {
  const { user } = useAuth();
  const { accounts } = useAccounts();
  const { transactions } = useTransactions();
  const { tasks } = useTasks();
  const { goals } = useGoals();
  const { goals: financialGoals } = useFinancialGoals();
  const { habits } = useHabits();
  const navigate = useNavigate();
  const storageKey = user ? `lifeflow:getting-started:hidden:${user.id}` : null;
  const [hidden, setHidden] = useState(() => Boolean(storageKey && localStorage.getItem(storageKey)));

  const steps = useMemo(() => [
    { label: "Confirmar seu e-mail", detail: "Proteja o acesso à sua conta", done: Boolean(user?.email_confirmed_at), href: "/configuracoes" },
    { label: "Cadastrar uma conta", detail: "Conta bancária, carteira ou cartão", done: accounts.length > 0, href: "/financas" },
    { label: "Registrar uma transação", detail: "Adicione sua primeira receita ou despesa", done: transactions.length > 0, href: "/financas" },
    { label: "Criar uma tarefa", detail: "Organize algo que precisa fazer", done: tasks.length > 0, href: "/agenda" },
    { label: "Definir uma meta", detail: "Pessoal ou financeira", done: goals.length + financialGoals.length > 0, href: "/metas" },
    { label: "Criar um hábito", detail: "Comece uma rotina saudável", done: habits.length > 0, href: "/saude" },
  ], [accounts.length, financialGoals.length, goals.length, habits.length, tasks.length, transactions.length, user?.email_confirmed_at]);

  const completed = steps.filter((step) => step.done).length;
  const allDone = completed === steps.length;

  useEffect(() => {
    if (!allDone || !storageKey) return;
    const timeout = window.setTimeout(() => {
      localStorage.setItem(storageKey, "done");
      setHidden(true);
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [allDone, storageKey]);

  const dismiss = () => {
    if (storageKey) localStorage.setItem(storageKey, "hidden");
    setHidden(true);
  };

  if (hidden) return null;

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.04] p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><ListChecks className="h-5 w-5" /></span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Primeiros passos</p>
            <h2 className="mt-1 font-display text-lg font-semibold">{allDone ? "Tudo pronto!" : "Prepare seu LifeFlow"}</h2>
            <p className="mt-1 text-xs text-muted-foreground">{completed} de {steps.length} etapas concluídas</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={dismiss} aria-label="Ocultar primeiros passos"><X className="h-4 w-4" /></Button>
      </div>
      <Progress value={(completed / steps.length) * 100} className="mt-4 h-2" />
      <div className="mt-4 grid gap-2 md:grid-cols-2">
        {steps.map((step) => (
          <button key={step.label} type="button" disabled={step.done} onClick={() => navigate(step.href)} className={cn("flex items-center gap-3 rounded-xl border p-3 text-left transition", step.done ? "border-success/15 bg-success/[0.045]" : "border-border/70 bg-background/55 hover:border-primary/30 hover:bg-primary/[0.035]")}>
            {step.done ? <span className="grid h-7 w-7 place-items-center rounded-full bg-success/10 text-success"><Check className="h-4 w-4" /></span> : <Circle className="h-7 w-7 text-muted-foreground/35" />}
            <span className="min-w-0 flex-1"><span className={cn("block text-xs font-medium", step.done && "text-muted-foreground line-through")}>{step.label}</span><span className="mt-0.5 block truncate text-[10px] text-muted-foreground">{step.detail}</span></span>
            {!step.done && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
          </button>
        ))}
      </div>
    </Card>
  );
}
