import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Apple,
  BookOpen,
  Brain,
  CalendarDays,
  Check,
  CheckCircle2,
  Circle,
  Clock3,
  CreditCard,
  Droplets,
  Dumbbell,
  Flame,
  Footprints,
  Gift,
  Heart,
  HeartPulse,
  Loader2,
  Moon,
  Sparkles,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DayFlowIcon } from "@/components/icons/LifeFlowIcons";
import { differenceInCalendarDays, format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useContacts } from "@/hooks/useContacts";
import { useHabits } from "@/hooks/useHabits";
import { useInstallments } from "@/hooks/useInstallments";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useTasks } from "@/hooks/useTasks";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const habitIconMap: Record<string, LucideIcon> = {
  Droplets,
  Apple,
  Moon,
  Dumbbell,
  Brain,
  Footprints,
  Book: BookOpen,
  Heart,
};

const getDateLabel = (date: Date) => {
  const days = differenceInCalendarDays(startOfDay(date), startOfDay(new Date()));
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return format(date, "dd MMM", { locale: ptBR });
};

export function DailyHub() {
  const reduceMotion = useReducedMotion();
  const { tasks, isLoading: tasksLoading, toggleTask } = useTasks();
  const { habits, isLoading: habitsLoading, incrementHabit } = useHabits();
  const { installments, payments, isLoading: installmentsLoading } = useInstallments();
  const { upcomingRenewals, isLoading: subscriptionsLoading } = useSubscriptions();
  const { contacts, isLoading: contactsLoading } = useContacts();
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  const today = format(new Date(), "yyyy-MM-dd");

  const todayTasks = useMemo(
    () => tasks.filter((task) => task.due_date === today),
    [tasks, today],
  );
  const allPendingTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed && task.due_date <= today)
        .sort((a, b) => {
          if (a.due_date !== b.due_date) return a.due_date.localeCompare(b.due_date);
          return (a.due_time || "23:59").localeCompare(b.due_time || "23:59");
        }),
    [tasks, today],
  );
  const pendingTasks = allPendingTasks.slice(0, 4);

  const completedToday = todayTasks.filter((task) => task.completed).length;
  const completedHabits = habits.filter(
    (habit) => habit.current_progress >= habit.daily_goal,
  ).length;
  const totalDailyItems = todayTasks.length + habits.length;
  const completedDailyItems = completedToday + completedHabits;
  const progress =
    totalDailyItems > 0 ? Math.round((completedDailyItems / totalDailyItems) * 100) : 0;

  const contactById = useMemo(
    () => new Map(contacts.map((contact) => [contact.id, contact])),
    [contacts],
  );
  const installmentById = useMemo(
    () => new Map(installments.map((installment) => [installment.id, installment])),
    [installments],
  );

  const upcomingFinancialItems = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const installmentItems = payments
      .filter((payment) => {
        const distance = differenceInCalendarDays(parseISO(payment.due_date), todayStart);
        return !payment.paid && distance >= 0 && distance <= 7;
      })
      .map((payment) => {
        const installment = installmentById.get(payment.installment_id);
        return {
          id: `installment-${payment.id}`,
          title: installment?.description || "Parcela",
          detail: `${payment.payment_number}/${installment?.installment_count || "?"}`,
          amount: payment.amount,
          date: parseISO(payment.due_date),
        };
      });

    const subscriptionItems = upcomingRenewals.map((subscription) => ({
      id: `subscription-${subscription.id}`,
      title: subscription.name,
      detail: "Assinatura",
      amount: subscription.amount,
      date: parseISO(subscription.next_billing_date),
    }));

    return [...installmentItems, ...subscriptionItems]
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 3);
  }, [installmentById, payments, upcomingRenewals]);

  const upcomingBirthdays = useMemo(() => {
    const todayStart = startOfDay(new Date());
    const currentYear = todayStart.getFullYear();

    return contacts
      .filter((contact) => contact.birthday)
      .map((contact) => {
        const parts = contact.birthday!.split("-").map(Number);
        let date = new Date(currentYear, parts[1] - 1, parts[2]);
        if (differenceInCalendarDays(date, todayStart) < 0) {
          date = new Date(currentYear + 1, parts[1] - 1, parts[2]);
        }
        return { contact, date };
      })
      .filter(({ date }) => differenceInCalendarDays(date, todayStart) <= 7)
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 2);
  }, [contacts]);

  const isLoading =
    tasksLoading || habitsLoading || installmentsLoading || subscriptionsLoading || contactsLoading;
  const pendingHabits = habits
    .filter((habit) => habit.current_progress < habit.daily_goal)
    .slice(0, 4);
  const completedEverything =
    totalDailyItems > 0 && completedDailyItems === totalDailyItems && allPendingTasks.length === 0;

  const handleTaskToggle = async (id: string) => {
    setPendingAction(`task-${id}`);
    try {
      await toggleTask({ id, completed: true });
      toast.success("Tarefa concluída!");
    } catch {
      toast.error("Não foi possível concluir a tarefa.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleHabitIncrement = async (habit: (typeof habits)[number]) => {
    setPendingAction(`habit-${habit.id}`);
    try {
      await incrementHabit({
        id: habit.id,
        current_progress: habit.current_progress,
        daily_goal: habit.daily_goal,
        streak: habit.streak,
        last_updated: habit.last_updated,
      });
      toast.success(
        habit.current_progress + 1 >= habit.daily_goal
          ? "Meta diária concluída!"
          : "Progresso registrado!",
      );
    } catch {
      toast.error("Não foi possível atualizar o hábito.");
    } finally {
      setPendingAction(null);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[420px] animate-pulse rounded-[1.75rem] border border-primary/10 bg-gradient-to-br from-card via-card to-primary/[0.04] shadow-sm sm:h-[360px]" />
    );
  }

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.08 }}
      className="relative overflow-hidden rounded-[2.25rem] border border-border/70 bg-card/80 shadow-[0_30px_90px_-55px_rgba(15,23,42,.5)] backdrop-blur-2xl"
    >
      <div className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-20 h-48 w-48 rounded-full bg-violet-400/[0.055] blur-3xl" />
      <div className="relative border-b border-white/10 bg-[#07111f] px-5 py-6 text-white sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,rgba(34,211,238,.16),transparent_32%),radial-gradient(circle_at_20%_100%,rgba(139,92,246,.13),transparent_30%)]" />
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <motion.div
              animate={reduceMotion ? undefined : { y: [0, -3, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg shadow-primary/20"
            >
              <DayFlowIcon className="h-5 w-5" />
            </motion.div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-2xl font-extrabold tracking-[-.04em] text-white">Seu painel de agora</h2>
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] font-semibold text-cyan-200">
                  <Sparkles className="h-3 w-3" />Hoje
                </span>
              </div>
              <p className="mt-1 text-sm text-slate-400">
                {completedEverything
                  ? "Você terminou tudo que estava planejado para hoje."
                  : `${completedDailyItems} de ${totalDailyItems || 0} itens concluídos hoje`}
              </p>
            </div>
          </div>

          <div className="relative flex min-w-56 items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.07] p-3 pr-4 shadow-xl backdrop-blur">
            <div className="relative grid h-14 w-14 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(hsl(var(--primary)) ${progress * 3.6}deg, hsl(var(--muted)) 0deg)` }}>
              <div className="grid h-10 w-10 place-items-center rounded-full bg-[#07111f] text-xs font-bold text-cyan-200">{progress}%</div>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-cyan-200">Seu ritmo</p>
              <p className="mt-1 text-xs font-medium text-white">
                  {progress === 100
                    ? "Tudo pronto"
                  : progress >= 50
                    ? "Mais da metade feita"
                    : progress > 0
                      ? "Você já começou"
                      : "Comece pelo primeiro passo"}
              </p>
            </div>
          </div>
        </div>
        <Progress value={progress} className="mt-5 h-2 bg-primary/10 [&>div]:bg-gradient-to-r [&>div]:from-primary [&>div]:via-cyan-400 [&>div]:to-emerald-400" />
      </div>

      <div className="relative grid gap-4 p-4 sm:p-5 lg:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-6 rounded-2xl border border-border/60 bg-background/55 p-4 shadow-sm backdrop-blur sm:p-5">
          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Tarefas pendentes</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Marque uma tarefa quando terminar
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Link to="/agenda">
                  Ver agenda <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-success/25 bg-gradient-to-r from-success/[0.07] to-transparent p-4">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-success/10"><CheckCircle2 className="h-5 w-5 text-success" /></span>
                <div>
                  <p className="text-sm font-medium">Nenhuma tarefa pendente</p>
                  <p className="text-xs text-muted-foreground">Sua lista de hoje está livre.</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.map((task) => {
                  const contact = task.contact_id ? contactById.get(task.contact_id) : undefined;
                  const isOverdue = task.due_date < today;
                  const isPending = pendingAction === `task-${task.id}`;

                  return (
                    <div
                      key={task.id}
                      className="group flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md motion-reduce:hover:translate-y-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleTaskToggle(task.id)}
                        disabled={isPending}
                        aria-label={`Concluir ${task.title}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl border bg-background text-muted-foreground transition-all hover:border-primary hover:bg-primary/10 hover:text-primary disabled:opacity-60"
                      >
                        {isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4" />
                        )}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium">{task.title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                          <span
                            className={cn(
                              "flex items-center gap-1",
                              isOverdue && "font-medium text-destructive",
                            )}
                          >
                            <Clock3 className="h-3 w-3" />
                            {isOverdue ? "Atrasada" : task.due_time?.slice(0, 5) || "Hoje"}
                          </span>
                          {contact && (
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3" />
                              {contact.name}
                            </span>
                          )}
                        </div>
                      </div>
                      {task.source === "contact_follow_up" && (
                        <span className="hidden rounded-full bg-contacts/10 px-2 py-1 text-[10px] font-semibold text-contacts sm:inline">
                          Follow-up
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold">Hábitos de hoje</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {completedHabits}/{habits.length} metas concluídas
                </p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1 text-xs">
                <Link to="/saude">
                  Ver saúde <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            {habits.length === 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-dashed border-health/25 bg-gradient-to-r from-health/[0.07] to-transparent p-4">
                <HeartPulse className="h-5 w-5 text-health" />
                <div>
                  <p className="text-sm font-medium">Crie seu primeiro hábito</p>
                  <p className="text-xs text-muted-foreground">Uma pequena ação já conta.</p>
                </div>
              </div>
            ) : pendingHabits.length === 0 ? (
              <div className="flex items-center gap-3 rounded-xl bg-success/10 p-4 text-success">
                <CheckCircle2 className="h-5 w-5" />
                <p className="text-sm font-medium">Todos os hábitos foram concluídos hoje.</p>
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {pendingHabits.map((habit) => {
                  const HabitIcon = habitIconMap[habit.icon] || HeartPulse;
                  const habitProgress = Math.min(
                    100,
                    Math.round((habit.current_progress / habit.daily_goal) * 100),
                  );
                  const isPending = pendingAction === `habit-${habit.id}`;

                  return (
                    <button
                      key={habit.id}
                      type="button"
                      onClick={() => handleHabitIncrement(habit)}
                      disabled={isPending}
                      className="group rounded-xl border border-border/60 bg-card/80 p-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-health/35 hover:shadow-md disabled:opacity-60 motion-reduce:hover:translate-y-0"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl"
                          style={{ backgroundColor: `${habit.color}18`, color: habit.color }}
                        >
                          {isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <HabitIcon className="h-4 w-4" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">{habit.name}</p>
                            {habit.streak > 0 && (
                              <span className="flex shrink-0 items-center gap-1 text-[10px] font-semibold text-warning">
                                <Flame className="h-3 w-3" />
                                {habit.streak}
                              </span>
                            )}
                          </div>
                          <p className="mt-0.5 text-[11px] text-muted-foreground">
                            {habit.current_progress}/{habit.daily_goal} {habit.unit}
                          </p>
                        </div>
                      </div>
                      <Progress value={habitProgress} className="mt-2.5 h-1 bg-health/10" />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5 rounded-2xl border border-border/60 bg-gradient-to-br from-background/70 to-primary/[0.035] p-4 shadow-sm backdrop-blur sm:p-5">
          <div>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold">Próximos 7 dias</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">O que merece sua atenção</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="h-8 gap-1 px-2 text-xs">
                <Link to="/planejamento">
                  Planejar <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>

            <div className="space-y-2">
              {upcomingFinancialItems.map((item) => (
                <Link
                  key={item.id}
                  to="/financas"
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-finance/25 hover:shadow-md motion-reduce:hover:translate-y-0"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-finance/10 text-finance">
                    <CreditCard className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      {item.detail} • {getDateLabel(item.date)}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs font-semibold">
                    {currencyFormatter.format(item.amount)}
                  </span>
                </Link>
              ))}

              {upcomingBirthdays.map(({ contact, date }) => (
                <Link
                  key={contact.id}
                  to="/contatos"
                  className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/80 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-contacts/25 hover:shadow-md motion-reduce:hover:translate-y-0"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-contacts/10 text-contacts">
                    <Gift className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{contact.name}</p>
                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                      Aniversário • {getDateLabel(date)}
                    </p>
                  </div>
                </Link>
              ))}

              {upcomingFinancialItems.length === 0 && upcomingBirthdays.length === 0 && (
                <div className="rounded-2xl border border-dashed border-primary/20 bg-gradient-to-br from-primary/[0.055] to-accent/[0.025] p-6 text-center">
                  <span className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-primary/10"><CalendarDays className="h-5 w-5 text-primary" /></span>
                    <p className="mt-2 text-sm font-medium">Nada marcado por aqui</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Nenhum vencimento ou aniversário próximo.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 border-t border-border/60 pt-5">
            <div className="rounded-2xl border border-tasks/10 bg-gradient-to-br from-tasks/[0.09] to-background p-3 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Circle className="h-3.5 w-3.5 text-tasks" />
                <span className="text-[11px]">Pendências</span>
              </div>
              <p className="mt-1 text-xl font-bold">{allPendingTasks.length}</p>
            </div>
            <div className="rounded-2xl border border-success/10 bg-gradient-to-br from-success/[0.09] to-background p-3 shadow-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                <span className="text-[11px]">Concluídos</span>
              </div>
              <p className="mt-1 text-xl font-bold">{completedDailyItems}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  );
}
