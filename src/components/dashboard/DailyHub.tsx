import { useMemo, useState } from "react";
import { motion } from "framer-motion";
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
      <div className="h-[420px] animate-pulse rounded-lg border bg-card sm:h-[360px]" />
    );
  }

  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: 0.05 }}
      className="overflow-hidden rounded-lg border bg-card shadow-sm"
    >
      <div className="border-b bg-muted/20 px-5 py-4">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <DayFlowIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="font-display text-lg font-bold tracking-tight">Resumo de hoje</h2>
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                  Hoje
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {completedEverything
                  ? "Você terminou tudo que estava planejado para hoje."
                  : `${completedDailyItems} de ${totalDailyItems || 0} itens concluídos hoje`}
              </p>
            </div>
          </div>

          <div className="flex min-w-48 items-center gap-3 rounded-md border bg-background px-4 py-3">
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">Feito hoje</p>
              <p className="mt-0.5 text-lg font-semibold">
                {progress}%
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                {progress === 100
                  ? "Tudo pronto"
                  : progress >= 50
                    ? "Mais da metade feita"
                    : progress > 0
                      ? "Você já começou"
                      : "Nenhum item concluído"}
                </span>
              </p>
            </div>
          </div>
        </div>
        <Progress value={progress} className="mt-4 h-1.5 bg-primary/10" />
      </div>

      <div className="grid lg:grid-cols-[1.25fr_.75fr]">
        <div className="space-y-5 p-5 sm:p-6 lg:border-r">
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
              <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-4">
                <CheckCircle2 className="h-5 w-5 text-success" />
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
                      className="group flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-muted/20"
                    >
                      <button
                        type="button"
                        onClick={() => handleTaskToggle(task.id)}
                        disabled={isPending}
                        aria-label={`Concluir ${task.title}`}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-md border text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:opacity-60"
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
              <div className="flex items-center gap-3 rounded-xl border border-dashed bg-muted/20 p-4">
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
                      className="group rounded-md border bg-background p-3 text-left transition-colors hover:border-health/35 disabled:opacity-60"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-md"
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

        <div className="space-y-5 bg-muted/10 p-5 sm:p-6">
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
                  className="flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-muted/20"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-finance/10 text-finance">
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
                  className="flex items-center gap-3 rounded-md border bg-background p-3 transition-colors hover:bg-muted/20"
                >
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-contacts/10 text-contacts">
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
                <div className="rounded-xl border border-dashed bg-background/45 p-4 text-center">
                  <CalendarDays className="mx-auto h-5 w-5 text-muted-foreground" />
                    <p className="mt-2 text-sm font-medium">Nada marcado por aqui</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Nenhum vencimento ou aniversário próximo.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t pt-5">
            <div className="rounded-xl bg-background/65 p-3">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Circle className="h-3.5 w-3.5 text-tasks" />
                <span className="text-[11px]">Pendências</span>
              </div>
              <p className="mt-1 text-xl font-bold">{allPendingTasks.length}</p>
            </div>
            <div className="rounded-xl bg-background/65 p-3">
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
