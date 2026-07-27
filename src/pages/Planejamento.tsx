import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CalendarRange,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock3,
  CreditCard,
  Gift,
  Loader2,
  Plus,
  Repeat2,
  RotateCcw,
  Target,
  TrendingUp,
  Users,
} from "lucide-react";
import { WeekFlowIcon } from "@/components/icons/LifeFlowIcons";
import {
  addDays,
  addWeeks,
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isSameWeek,
  parseISO,
  startOfDay,
  startOfWeek,
  subWeeks,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TaskModal } from "@/components/modals/TaskModal";
import { useTasks, type Task, type TaskRecurrence } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useInstallments } from "@/hooks/useInstallments";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { useContacts } from "@/hooks/useContacts";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const priorityLabels = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const priorityStyles = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

type BusyAction = { type: "toggle" | "move"; taskId: string } | null;

export default function Planejamento() {
  const [weekAnchor, setWeekAnchor] = useState(new Date());
  const [busyAction, setBusyAction] = useState<BusyAction>(null);
  const [taskModalOpen, setTaskModalOpen] = useState(false);

  const { tasks, isLoading: tasksLoading, toggleTask, updateTask, addTask } = useTasks();
  const { habits, habitLogs, isLoading: habitsLoading } = useHabits();
  const { installments, payments, isLoading: installmentsLoading } = useInstallments();
  const { subscriptions, isLoading: subscriptionsLoading } = useSubscriptions();
  const { contacts, isLoading: contactsLoading } = useContacts();

  const weekStart = startOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(weekAnchor, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });
  const todayStart = startOfDay(new Date());
  const todayString = format(todayStart, "yyyy-MM-dd");
  const isCurrentWeek = isSameWeek(weekStart, todayStart, { weekStartsOn: 1 });

  const weekTasks = useMemo(
    () =>
      tasks.filter((task) => {
        const date = parseISO(task.due_date);
        return date >= weekStart && date <= weekEnd;
      }),
    [tasks, weekEnd, weekStart],
  );

  const overdueTasks = useMemo(
    () =>
      tasks
        .filter((task) => !task.completed && task.due_date < todayString)
        .sort((a, b) => a.due_date.localeCompare(b.due_date)),
    [tasks, todayString],
  );

  const completedWeekTasks = weekTasks.filter((task) => task.completed).length;
  const taskProgress =
    weekTasks.length > 0 ? Math.round((completedWeekTasks / weekTasks.length) * 100) : 0;

  const weekHabitLogs = useMemo(
    () =>
      habitLogs.filter((log) => {
        const date = parseISO(log.completed_at);
        return date >= weekStart && date <= weekEnd && log.goal_reached;
      }),
    [habitLogs, weekEnd, weekStart],
  );
  const habitGoal = habits.length * (isCurrentWeek ? Math.max(1, todayStart.getDay() || 7) : 7);
  const habitProgress =
    habitGoal > 0 ? Math.min(100, Math.round((weekHabitLogs.length / habitGoal) * 100)) : 0;

  const installmentById = useMemo(
    () => new Map(installments.map((installment) => [installment.id, installment])),
    [installments],
  );

  const financialEvents = useMemo(() => {
    const installmentEvents = payments
      .filter((payment) => {
        const date = parseISO(payment.due_date);
        return !payment.paid && date >= weekStart && date <= weekEnd;
      })
      .map((payment) => {
        const installment = installmentById.get(payment.installment_id);
        return {
          id: `payment-${payment.id}`,
          name: installment?.description || "Parcela",
          detail: `Parcela ${payment.payment_number}/${installment?.installment_count || "?"}`,
          amount: payment.amount,
          date: parseISO(payment.due_date),
        };
      });

    const subscriptionEvents = subscriptions
      .filter((subscription) => {
        const date = parseISO(subscription.next_billing_date);
        return subscription.active && date >= weekStart && date <= weekEnd;
      })
      .map((subscription) => ({
        id: `subscription-${subscription.id}`,
        name: subscription.name,
        detail: "Assinatura",
        amount: subscription.amount,
        date: parseISO(subscription.next_billing_date),
      }));

    return [...installmentEvents, ...subscriptionEvents].sort(
      (a, b) => a.date.getTime() - b.date.getTime(),
    );
  }, [installmentById, payments, subscriptions, weekEnd, weekStart]);

  const birthdayEvents = useMemo(
    () =>
      weekDays.flatMap((day) =>
        contacts
          .filter((contact) => {
            if (!contact.birthday) return false;
            const birthday = parseISO(contact.birthday);
            return birthday.getMonth() === day.getMonth() && birthday.getDate() === day.getDate();
          })
          .map((contact) => ({ contact, date: day })),
      ),
    [contacts, weekDays],
  );

  const weekAmount = financialEvents.reduce((sum, item) => sum + item.amount, 0);
  const totalFocus = weekTasks.length + habitGoal;
  const totalDone = completedWeekTasks + weekHabitLogs.length;
  const overallProgress =
    totalFocus > 0 ? Math.min(100, Math.round((totalDone / totalFocus) * 100)) : 0;

  const isLoading =
    tasksLoading ||
    habitsLoading ||
    installmentsLoading ||
    subscriptionsLoading ||
    contactsLoading;

  const tasksForDay = (day: Date) =>
    weekTasks
      .filter((task) => isSameDay(parseISO(task.due_date), day))
      .sort((a, b) => {
        if (a.completed !== b.completed) return Number(a.completed) - Number(b.completed);
        return (a.due_time || "23:59").localeCompare(b.due_time || "23:59");
      });

  const handleToggleTask = async (task: Task) => {
    setBusyAction({ type: "toggle", taskId: task.id });
    try {
      await toggleTask({ id: task.id, completed: !task.completed });
      toast.success(task.completed ? "Tarefa reaberta." : "Tarefa concluída!");
    } catch {
      toast.error("Não foi possível atualizar a tarefa.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleMoveTask = async (task: Task, date: Date) => {
    setBusyAction({ type: "move", taskId: task.id });
    try {
      await updateTask({ id: task.id, due_date: format(date, "yyyy-MM-dd") });
      toast.success(`Tarefa reagendada para ${format(date, "dd/MM")}.`);
    } catch {
      toast.error("Não foi possível reagendar a tarefa.");
    } finally {
      setBusyAction(null);
    }
  };

  const handleAddTask = async (data: {
    title: string;
    due_date: string;
    due_time: string | null;
    priority: string;
    category: string;
    recurrence: TaskRecurrence;
    contact_id: string | null;
  }) => {
    await addTask({
      ...data,
      priority: data.priority as Task["priority"],
    });
    toast.success("Tarefa adicionada!");
  };

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-48 animate-pulse rounded-[1.6rem] bg-muted/60" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="h-28 animate-pulse rounded-2xl bg-muted/60" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-muted/60" />
      </div>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onSubmit={handleAddTask}
      />

      <PageHeader
        title="Planejamento Semanal"
        description="Veja o que está marcado para cada dia e ajuste quando precisar."
        eyebrow="Esta semana"
        icon={WeekFlowIcon}
        variant="tasks"
        actions={
          <>
            {!isCurrentWeek && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekAnchor(new Date())}
                className="h-10 gap-2 border-white/15 bg-white/[0.07] text-white hover:bg-white/15 hover:text-white"
              >
                <RotateCcw className="h-4 w-4" />
                Semana atual
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => setTaskModalOpen(true)}
              className="h-10 gap-2 bg-sky-400 text-slate-950 hover:bg-sky-300"
            >
              <Plus className="h-4 w-4" />
              Nova tarefa
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 rounded-2xl border bg-card/80 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekAnchor(subWeeks(weekAnchor, 1))}
            className="h-9 w-9 rounded-xl"
            aria-label="Semana anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-[210px] text-center">
            <p className="text-sm font-semibold capitalize">
              {format(weekStart, "dd MMM", { locale: ptBR })} —{" "}
              {format(weekEnd, "dd MMM yyyy", { locale: ptBR })}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {isCurrentWeek ? "Semana atual" : "Período selecionado"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setWeekAnchor(addWeeks(weekAnchor, 1))}
            className="h-9 w-9 rounded-xl"
            aria-label="Próxima semana"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3 rounded-xl bg-primary/[0.06] px-4 py-2">
          <WeekFlowIcon className="h-4 w-4 text-primary" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="font-medium">Ritmo da semana</span>
              <span className="font-bold text-primary">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="mt-1.5 h-1.5 w-36 bg-primary/10 sm:w-48" />
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={CheckCircle2}
          label="Tarefas concluídas"
          value={`${completedWeekTasks}/${weekTasks.length}`}
          detail={`${taskProgress}% da semana`}
          color="text-tasks"
          background="bg-tasks/10"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Hábitos cumpridos"
          value={`${weekHabitLogs.length}/${habitGoal}`}
          detail={`${habitProgress}% do esperado`}
          color="text-health"
          background="bg-health/10"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Tarefas atrasadas"
          value={String(overdueTasks.length)}
          detail={overdueTasks.length ? "Precisam de atenção" : "Tudo sob controle"}
          color={overdueTasks.length ? "text-destructive" : "text-success"}
          background={overdueTasks.length ? "bg-destructive/10" : "bg-success/10"}
        />
        <SummaryCard
          icon={CreditCard}
          label="Vencimentos"
          value={currencyFormatter.format(weekAmount)}
          detail={`${financialEvents.length} lançamento${financialEvents.length === 1 ? "" : "s"}`}
          color="text-finance"
          background="bg-finance/10"
        />
      </div>

      {overdueTasks.length > 0 && (
        <Card className="overflow-hidden rounded-2xl border-destructive/20 bg-gradient-to-r from-destructive/[0.07] to-card shadow-sm">
          <div className="flex flex-col gap-4 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-destructive/10 text-destructive">
                  <AlertTriangle className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-semibold">Pendências acumuladas</h2>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Resolva ou reagende antes de planejar novas prioridades.
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-bold text-destructive">
                {overdueTasks.length}
              </span>
            </div>
            <div className="grid gap-2 lg:grid-cols-2">
              {overdueTasks.slice(0, 4).map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  busyAction={busyAction}
                  overdue
                  onToggle={handleToggleTask}
                  onMove={handleMoveTask}
                />
              ))}
            </div>
          </div>
        </Card>
      )}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_330px]">
        <Card className="overflow-hidden rounded-2xl border-border/70 bg-card/90 shadow-sm">
          <div className="flex items-center justify-between border-b p-4 sm:p-5">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-tasks">
                Linha da semana
              </p>
              <h2 className="mt-1 font-display text-lg font-semibold">Prioridades por dia</h2>
            </div>
            <CalendarDays className="h-5 w-5 text-tasks" />
          </div>

          <div className="divide-y">
            {weekDays.map((day) => {
              const dayTasks = tasksForDay(day);
              const dayIsToday = isSameDay(day, todayStart);

              return (
                <section
                  key={day.toISOString()}
                  className={cn(
                    "grid gap-3 p-4 sm:grid-cols-[96px_minmax(0,1fr)] sm:p-5",
                    dayIsToday && "bg-tasks/[0.035]",
                  )}
                >
                  <div>
                    <p
                      className={cn(
                        "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                        dayIsToday && "text-tasks",
                      )}
                    >
                      {format(day, "EEE", { locale: ptBR })}
                    </p>
                    <div className="mt-1 flex items-center gap-2 sm:block">
                      <p className="text-2xl font-bold">{format(day, "dd")}</p>
                      <p className="text-xs capitalize text-muted-foreground">
                        {format(day, "MMM", { locale: ptBR })}
                      </p>
                    </div>
                    {dayIsToday && (
                      <span className="mt-2 inline-flex rounded-full bg-tasks/10 px-2 py-0.5 text-[10px] font-semibold text-tasks">
                        Hoje
                      </span>
                    )}
                  </div>

                  {dayTasks.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => setTaskModalOpen(true)}
                      className="flex min-h-14 items-center justify-center gap-2 rounded-xl border border-dashed text-xs text-muted-foreground transition-colors hover:border-tasks/35 hover:bg-tasks/[0.03] hover:text-tasks"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Adicionar tarefa
                    </button>
                  ) : (
                    <div className="space-y-2">
                      {dayTasks.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          busyAction={busyAction}
                          onToggle={handleToggleTask}
                          onMove={handleMoveTask}
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </Card>

        <div className="space-y-5">
          <Card className="rounded-2xl border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-finance">
                  Financeiro
                </p>
                <h2 className="mt-1 text-sm font-semibold">Vencimentos da semana</h2>
              </div>
              <CreditCard className="h-4 w-4 text-finance" />
            </div>
            {financialEvents.length === 0 ? (
              <CompactEmpty icon={CheckCircle2} text="Nenhum vencimento nesta semana." />
            ) : (
              <div className="space-y-2">
                {financialEvents.map((event) => (
                  <div key={event.id} className="flex items-center gap-3 rounded-xl bg-muted/35 p-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-finance/10 text-finance">
                      <CalendarClock className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{event.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {event.detail} • {format(event.date, "dd/MM")}
                      </p>
                    </div>
                    <span className="text-xs font-semibold">
                      {currencyFormatter.format(event.amount)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="rounded-2xl border-border/70 bg-card/90 p-4 shadow-sm sm:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-contacts">
                  Contatos
                </p>
                <h2 className="mt-1 text-sm font-semibold">Datas importantes</h2>
              </div>
              <Users className="h-4 w-4 text-contacts" />
            </div>
            {birthdayEvents.length === 0 ? (
              <CompactEmpty icon={Gift} text="Nenhum aniversário nesta semana." />
            ) : (
              <div className="space-y-2">
                {birthdayEvents.map(({ contact, date }) => (
                  <div key={`${contact.id}-${date.toISOString()}`} className="flex items-center gap-3 rounded-xl bg-muted/35 p-3">
                    <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-contacts/10 text-contacts">
                      <Gift className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{contact.name}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        Aniversário • {format(date, "EEEE, dd/MM", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="overflow-hidden rounded-2xl border-primary/20 bg-gradient-to-br from-primary/[0.08] via-card to-card p-4 shadow-sm sm:p-5">
            <div className="flex gap-3">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                <Target className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm font-semibold">Antes de começar</h2>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                  {overdueTasks.length
                    ? `Comece pelas ${overdueTasks.length} pendências atrasadas e deixe espaço para as prioridades desta semana.`
                    : weekTasks.length
                      ? `Você tem ${weekTasks.length} tarefas nesta semana. Confira se algum dia ficou carregado demais.`
                      : "A semana está vazia. Adicione primeiro o que não pode ficar para depois."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

interface SummaryCardProps {
  icon: React.ElementType;
  label: string;
  value: string;
  detail: string;
  color: string;
  background: string;
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  detail,
  color,
  background,
}: SummaryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border bg-card/85 p-4 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">{detail}</p>
        </div>
        <div className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-xl", background, color)}>
          <Icon className="h-4 w-4" />
        </div>
      </div>
    </motion.div>
  );
}

interface TaskRowProps {
  task: Task;
  busyAction: BusyAction;
  overdue?: boolean;
  onToggle: (task: Task) => void;
  onMove: (task: Task, date: Date) => void;
}

function TaskRow({ task, busyAction, overdue, onToggle, onMove }: TaskRowProps) {
  const isBusy = busyAction?.taskId === task.id;
  const taskDate = parseISO(task.due_date);

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-xl border bg-background/65 p-3 transition-colors hover:border-tasks/30",
        task.completed && "opacity-60",
      )}
    >
      <button
        type="button"
        onClick={() => onToggle(task)}
        disabled={isBusy}
        aria-label={task.completed ? `Reabrir ${task.title}` : `Concluir ${task.title}`}
        className={cn(
          "grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all disabled:opacity-50",
          task.completed
            ? "border-success bg-success text-success-foreground"
            : "text-muted-foreground hover:border-tasks hover:bg-tasks hover:text-tasks-foreground",
        )}
      >
        {isBusy && busyAction?.type === "toggle" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : task.completed ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <Circle className="h-3.5 w-3.5" />
        )}
      </button>

      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className={cn("truncate text-sm font-medium", task.completed && "line-through")}>
            {task.title}
          </p>
          {task.recurrence !== "none" && <Repeat2 className="h-3 w-3 shrink-0 text-primary" />}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-muted-foreground">
          <span className={cn("rounded-full px-2 py-0.5 font-medium", priorityStyles[task.priority])}>
            {priorityLabels[task.priority]}
          </span>
          {task.due_time && (
            <span className="flex items-center gap-1">
              <Clock3 className="h-3 w-3" />
              {task.due_time.slice(0, 5)}
            </span>
          )}
          {overdue && <span className="font-medium text-destructive">{format(taskDate, "dd/MM")}</span>}
          <span className="truncate">{task.category}</span>
        </div>
      </div>

      {!task.completed && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className="h-8 shrink-0 gap-1 px-2 text-[11px] text-muted-foreground hover:text-foreground"
            >
              {isBusy && busyAction?.type === "move" ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CalendarClock className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">Reagendar</span>
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>Escolher nova data</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => onMove(task, new Date())}>
              Hoje
              <span className="ml-auto text-xs text-muted-foreground">
                {format(new Date(), "dd/MM")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(task, addDays(new Date(), 1))}>
              Amanhã
              <span className="ml-auto text-xs text-muted-foreground">
                {format(addDays(new Date(), 1), "dd/MM")}
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onMove(task, addWeeks(taskDate, 1))}>
              Próxima semana
              <ArrowRight className="ml-auto h-3.5 w-3.5" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function CompactEmpty({ icon: Icon, text }: { icon: React.ElementType; text: string }) {
  return (
    <div className="rounded-xl border border-dashed bg-muted/15 px-3 py-5 text-center">
      <Icon className="mx-auto h-4 w-4 text-muted-foreground" />
      <p className="mt-2 text-xs text-muted-foreground">{text}</p>
    </div>
  );
}
