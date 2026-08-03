import {
  createContext,
  type ComponentType,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { differenceInCalendarDays, endOfMonth, format, parseISO, startOfDay, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCheck, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  GoalFlowIcon,
  MoneyFlowIcon,
  NotificationFlowIcon,
  TaskFlowIcon,
} from "@/components/icons/LifeFlowIcons";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useTasks } from "@/hooks/useTasks";
import { useInstallments } from "@/hooks/useInstallments";
import { useSubscriptions } from "@/hooks/useSubscriptions";
import { usePersonalGoals } from "@/hooks/usePersonalGoals";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { useBudgets } from "@/hooks/useBudgets";
import { useTransactions } from "@/hooks/useTransactions";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { getUpcomingBrazilianCalendarEvents } from "@/lib/brazilianCalendar";
import { usePersonalEvents } from "@/hooks/usePersonalEvents";

type AlertTone = "danger" | "warning" | "info";

interface LifeFlowAlert {
  id: string;
  title: string;
  description: string;
  date: string;
  href: string;
  tone: AlertTone;
  icon: ComponentType<{ className?: string }>;
}

interface NotificationContextValue {
  openNotifications: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);
function loadReadAlerts(storageKey: string) {
  try {
    return JSON.parse(localStorage.getItem(storageKey) || "[]") as string[];
  } catch {
    return [];
  }
}

function relativeDate(date: string) {
  const days = differenceInCalendarDays(parseISO(date), startOfDay(new Date()));
  if (days < 0) return `${Math.abs(days)}d atrasado`;
  if (days === 0) return "Hoje";
  if (days === 1) return "Amanhã";
  return format(parseISO(date), "d 'de' MMM", { locale: ptBR });
}

function toneClasses(tone: AlertTone) {
  if (tone === "danger") return "bg-red-500/10 text-red-400";
  if (tone === "warning") return "bg-amber-500/10 text-amber-400";
  return "bg-cyan-500/10 text-cyan-400";
}

export function NotificationCenterProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [readAlerts, setReadAlerts] = useState<string[]>([]);
  const { user } = useAuth();
  const readAlertsKey = `lifeflow_read_alerts_${user?.id ?? "guest"}`;
  const navigate = useNavigate();
  const { tasks } = useTasks();
  const { installments, payments } = useInstallments({ processAutoDebit: false });
  const { subscriptions } = useSubscriptions({ processAutoDebit: false });
  const { goals: personalGoals } = usePersonalGoals();
  const { goals: financialGoals } = useFinancialGoals();
  const { budgets } = useBudgets(new Date());
  const { transactions } = useTransactions();
  const { events: personalEvents } = usePersonalEvents();

  useEffect(() => {
    setReadAlerts(loadReadAlerts(readAlertsKey));
  }, [readAlertsKey]);

  const alerts = useMemo<LifeFlowAlert[]>(() => {
    const today = startOfDay(new Date());
    const installmentNames = new Map(installments.map((item) => [item.id, item]));
    const items: LifeFlowAlert[] = [];

    getUpcomingBrazilianCalendarEvents(today, 7).forEach((event) => {
      items.push({
        id: `calendar-${event.id}-${event.date}`,
        title: event.name,
        description: `${event.description} • ${relativeDate(event.date)}`,
        date: event.date,
        href: "/agenda",
        tone: differenceInCalendarDays(parseISO(event.date), today) <= 1 ? "warning" : "info",
        icon: NotificationFlowIcon,
      });
    });

    personalEvents.forEach((event) => {
      const days = differenceInCalendarDays(parseISO(event.event_date), today);
      if (days < 0 || days > event.reminder_days_before) return;
      items.push({
        id: `personal-event-${event.id}-${event.event_date}`,
        title: event.title,
        description: `${event.notes || "Lembrete pessoal"} • ${relativeDate(event.event_date)}`,
        date: event.event_date,
        href: "/agenda",
        tone: days <= 1 ? "warning" : "info",
        icon: NotificationFlowIcon,
      });
    });

    tasks
      .filter((task) => !task.completed)
      .forEach((task) => {
        const days = differenceInCalendarDays(parseISO(task.due_date), today);
        if (days > 7) return;
        const overdue = days < 0;
        items.push({
          id: `task-${task.id}-${task.due_date}`,
          title: overdue ? `Tarefa atrasada: ${task.title}` : task.title,
          description: `${task.category} • ${relativeDate(task.due_date)}`,
          date: task.due_date,
          href: "/agenda",
          tone: overdue || task.priority === "high" ? "danger" : days <= 1 ? "warning" : "info",
          icon: TaskFlowIcon,
        });
      });

    payments
      .filter((payment) => !payment.paid)
      .forEach((payment) => {
        const days = differenceInCalendarDays(parseISO(payment.due_date), today);
        if (days > 7) return;
        const installment = installmentNames.get(payment.installment_id);
        if (!installment) return;
        items.push({
          id: `installment-${payment.id}-${payment.due_date}`,
          title: days < 0 ? `Parcela atrasada: ${installment.description}` : installment.description,
          description: `Parcela ${payment.payment_number}/${installment.installment_count} • ${relativeDate(payment.due_date)}`,
          date: payment.due_date,
          href: "/financas",
          tone: days < 0 ? "danger" : "warning",
          icon: MoneyFlowIcon,
        });
      });

    subscriptions
      .filter((subscription) => subscription.active)
      .forEach((subscription) => {
        const days = differenceInCalendarDays(parseISO(subscription.next_billing_date), today);
        if (days < 0 || days > 7) return;
        items.push({
          id: `subscription-${subscription.id}-${subscription.next_billing_date}`,
          title: `Renovação de ${subscription.name}`,
          description: `R$ ${subscription.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} • ${relativeDate(subscription.next_billing_date)}`,
          date: subscription.next_billing_date,
          href: "/financas",
          tone: days <= 1 ? "warning" : "info",
          icon: MoneyFlowIcon,
        });
      });

    personalGoals
      .filter((goal) => goal.status !== "completed")
      .forEach((goal) => {
        const days = differenceInCalendarDays(parseISO(goal.deadline), today);
        if (days > 14) return;
        items.push({
          id: `goal-${goal.id}-${goal.deadline}`,
          title: days < 0 ? `Prazo vencido: ${goal.title}` : `Meta perto do prazo: ${goal.title}`,
          description: `${goal.progress}% concluída • ${relativeDate(goal.deadline)}`,
          date: goal.deadline,
          href: "/metas",
          tone: days < 0 ? "danger" : days <= 3 ? "warning" : "info",
          icon: GoalFlowIcon,
        });
      });

    financialGoals
      .filter((goal) => goal.deadline && goal.current_amount < goal.target_amount)
      .forEach((goal) => {
        const deadline = goal.deadline as string;
        const days = differenceInCalendarDays(parseISO(deadline), today);
        if (days > 14) return;
        const progress = Math.min(100, Math.round((goal.current_amount / goal.target_amount) * 100));
        items.push({
          id: `financial-goal-${goal.id}-${deadline}`,
          title: days < 0 ? `Meta financeira vencida: ${goal.name}` : `Prazo de ${goal.name} se aproximando`,
          description: `${progress}% guardado • ${relativeDate(deadline)}`,
          date: deadline,
          href: "/financas",
          tone: days < 0 ? "danger" : days <= 3 ? "warning" : "info",
          icon: GoalFlowIcon,
        });
      });

    const currentMonthStart = startOfMonth(today);
    const currentMonthEnd = endOfMonth(today);
    const expensesByCategory = new Map<string, number>();
    transactions
      .filter((transaction) => {
        if (transaction.type !== "expense") return false;
        const date = parseISO(transaction.date);
        return date >= currentMonthStart && date <= currentMonthEnd;
      })
      .forEach((transaction) => {
        expensesByCategory.set(
          transaction.category,
          (expensesByCategory.get(transaction.category) ?? 0) + transaction.amount,
        );
      });

    budgets.forEach((budget) => {
      const spent = expensesByCategory.get(budget.category) ?? 0;
      const percent = Math.round((spent / budget.amount) * 100);
      if (percent < 80) return;
      const exceeded = percent >= 100;
      items.push({
        id: `budget-${budget.id}-${exceeded ? 100 : 80}`,
        title: exceeded ? `Orçamento excedido: ${budget.category}` : `Orçamento perto do limite: ${budget.category}`,
        description: `${percent}% utilizado • R$ ${spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} de R$ ${budget.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
        date: format(today, "yyyy-MM-dd"),
        href: "/financas",
        tone: exceeded ? "danger" : "warning",
        icon: MoneyFlowIcon,
      });
    });

    return items.sort((a, b) => a.date.localeCompare(b.date));
  }, [budgets, financialGoals, installments, payments, personalEvents, personalGoals, subscriptions, tasks, transactions]);

  const unreadCount = alerts.filter((alert) => !readAlerts.includes(alert.id)).length;

  useEffect(() => {
    const validIds = new Set(alerts.map((alert) => alert.id));
    setReadAlerts((current) => {
      const next = current.filter((id) => validIds.has(id));
      if (next.length !== current.length) localStorage.setItem(readAlertsKey, JSON.stringify(next));
      return next;
    });
  }, [alerts, readAlertsKey]);

  const openNotifications = useCallback(() => setOpen(true), []);

  const markAsRead = (id: string) => {
    setReadAlerts((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      localStorage.setItem(readAlertsKey, JSON.stringify(next));
      return next;
    });
  };

  const markAllAsRead = () => {
    const next = alerts.map((alert) => alert.id);
    setReadAlerts(next);
    localStorage.setItem(readAlertsKey, JSON.stringify(next));
  };

  const openAlert = (alert: LifeFlowAlert) => {
    markAsRead(alert.id);
    setOpen(false);
    navigate(alert.href);
  };

  return (
    <NotificationContext.Provider value={{ openNotifications, unreadCount }}>
      {children}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="flex w-full flex-col border-slate-800 bg-slate-950 p-0 sm:max-w-md"
        >
          <SheetHeader className="border-b border-slate-800 px-5 pb-4 pt-5 text-left">
            <div className="flex items-start justify-between gap-4 pr-8">
              <div>
                <SheetTitle className="text-white">Seus alertas</SheetTitle>
                <SheetDescription className="mt-1 text-slate-400">
                  O que merece atenção nos próximos dias.
                </SheetDescription>
              </div>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-cyan-300 hover:text-cyan-200"
                >
                  <CheckCheck className="h-4 w-4" />
                  Marcar lidos
                </button>
              )}
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-3 py-4">
            {alerts.length === 0 ? (
              <div className="mx-2 mt-8 rounded-xl border border-dashed border-slate-700 px-5 py-10 text-center">
                <NotificationFlowIcon className="mx-auto h-8 w-8 text-slate-500" />
                <p className="mt-3 text-sm font-medium text-slate-200">Tudo em dia por aqui</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Quando uma tarefa ou cobrança estiver próxima, ela aparecerá aqui.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {alerts.map((alert) => {
                  const Icon = alert.icon;
                  const unread = !readAlerts.includes(alert.id);
                  return (
                    <button
                      key={alert.id}
                      type="button"
                      onClick={() => openAlert(alert)}
                      className={cn(
                        "group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors hover:bg-slate-800/80",
                        unread && "bg-slate-900",
                      )}
                    >
                      <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", toneClasses(alert.tone))}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={cn("block truncate text-sm text-slate-300", unread && "font-semibold text-white")}>
                          {alert.title}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-slate-500">
                          {alert.description}
                        </span>
                      </span>
                      {unread ? (
                        <span className="h-2 w-2 shrink-0 rounded-full bg-cyan-400" />
                      ) : (
                        <ChevronRight className="h-4 w-4 shrink-0 text-slate-600 transition-transform group-hover:translate-x-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-slate-800 px-5 py-3 text-xs text-slate-500">
            Alertas são atualizados com os dados do LifeFlow.
          </div>
        </SheetContent>
      </Sheet>
    </NotificationContext.Provider>
  );
}

// O hook acompanha o provider para manter a central em um único módulo.
export function useNotificationCenter() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotificationCenter precisa estar dentro de NotificationCenterProvider");
  return context;
}

export function NotificationCenterButton({
  compact = false,
  mobile = false,
}: {
  compact?: boolean;
  mobile?: boolean;
}) {
  const { openNotifications, unreadCount } = useNotificationCenter();
  const badge = unreadCount > 9 ? "9+" : unreadCount;

  if (mobile) {
    return (
      <button
        type="button"
        onClick={openNotifications}
        className="relative grid h-10 w-10 place-items-center rounded-xl text-foreground transition-colors hover:bg-muted"
        aria-label={`Abrir alertas${unreadCount ? `, ${unreadCount} não lidos` : ""}`}
      >
        <NotificationFlowIcon className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid min-h-4 min-w-4 place-items-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {badge}
          </span>
        )}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={openNotifications}
      className="relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-colors hover:bg-white/[0.055] hover:text-white"
    >
      <NotificationFlowIcon className="h-5 w-5 shrink-0" />
      {!compact && (
        <>
          <span className="flex-1 text-left text-sm font-medium">Alertas</span>
          {unreadCount > 0 && (
            <span className="grid min-h-5 min-w-5 place-items-center rounded-full bg-red-500/90 px-1.5 text-[10px] font-bold text-white">
              {badge}
            </span>
          )}
        </>
      )}
      {compact && unreadCount > 0 && (
        <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
      )}
    </button>
  );
}
