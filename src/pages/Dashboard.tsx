import { useState, useEffect } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Settings2, Bell, Check, Sparkles } from "lucide-react";
import { AgendaFlowIcon } from "@/components/icons/LifeFlowIcons";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardPreferences, type CardId } from "@/hooks/useDashboardPreferences";
import { useTransactions } from "@/hooks/useTransactions";
import { useTasks } from "@/hooks/useTasks";
import type { TaskRecurrence } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useAccounts } from "@/hooks/useAccounts";
import { useNotifications } from "@/hooks/useNotifications";
import { CustomizeDashboard } from "@/components/dashboard/CustomizeDashboard";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
import { DailyHub } from "@/components/dashboard/DailyHub";
import { FinancesCard } from "@/components/dashboard/cards/FinancesCard";
import { TasksCard } from "@/components/dashboard/cards/TasksCard";
import { GoalsCard } from "@/components/dashboard/cards/GoalsCard";
import { HealthCard } from "@/components/dashboard/cards/HealthCard";
import { AgendaCard } from "@/components/dashboard/cards/AgendaCard";
import { HistoryCard } from "@/components/dashboard/cards/HistoryCard";
import { TransactionModal } from "@/components/modals/TransactionModal";
import { TaskModal } from "@/components/modals/TaskModal";
import { HabitModal } from "@/components/modals/HabitModal";
import { PersonalGoalModal } from "@/components/goals/PersonalGoalModal";
import { toast } from "sonner";
import { GettingStartedChecklist } from "@/components/onboarding/GettingStartedChecklist";
import { PlanLimitAlert } from "@/components/premium/PlanLimitAlert";

const cardComponents: Record<CardId, React.ComponentType<{
  size?: "small" | "medium" | "large";
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}>> = {
  finances: FinancesCard,
  tasks: TasksCard,
  goals: GoalsCard,
  health: HealthCard,
  agenda: AgendaCard,
  history: HistoryCard,
};

export default function Dashboard() {
  const { profile } = useProfile();
  const { preferences, isLoading } = useDashboardPreferences();
  const { addTransaction } = useTransactions();
  const { addTask } = useTasks();
  const { addHabit } = useHabits();
  const { accounts } = useAccounts();
  const { isNativePlatform, permissionGranted, requestPermission } = useNotifications();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();

  const [isCustomizing, setIsCustomizing] = useState(false);
  const [transactionModal, setTransactionModal] = useState<{ open: boolean; type: "income" | "expense" }>({
    open: false,
    type: "expense",
  });
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [habitModalOpen, setHabitModalOpen] = useState(false);
  const [goalModalOpen, setGoalModalOpen] = useState(false);

  const today = new Date();
  const greeting = today.getHours() < 12 ? "Bom dia" : today.getHours() < 18 ? "Boa tarde" : "Boa noite";
  const displayName = profile?.name || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();
  const formattedDate = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  }).format(today);

  const cardOrder = preferences?.card_order || ["finances", "tasks", "goals", "health", "agenda", "history"];
  const visibleCards = preferences?.visible_cards || cardOrder;
  const cardSizes = preferences?.card_sizes || {};

  // Filter visible cards in order
  const orderedVisibleCards = cardOrder.filter((id) => visibleCards.includes(id));

  // Determine grid layout based on card sizes
  const getGridClass = (cardId: CardId) => {
    const size = cardSizes[cardId] || "medium";
    if (size === "large") return "sm:col-span-2 lg:col-span-2";
    if (size === "medium") return "sm:col-span-1 lg:col-span-1";
    return "sm:col-span-1 lg:col-span-1";
  };

  const handleRequestNotifications = async () => {
    const granted = await requestPermission();
    if (granted) {
      toast.success("Notificações ativadas!");
    } else {
      toast.error("Permissão de notificações negada");
    }
  };

  const handleAddTransaction = async (data: {
    description: string;
    amount: number;
    type: "income" | "expense";
    category: string;
    account_id: string | null;
  }) => {
    await addTransaction({
      ...data,
      date: new Date().toISOString().split("T")[0],
    });
    toast.success(data.type === "income" ? "Receita adicionada!" : "Despesa adicionada!");
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
      title: data.title,
      due_date: data.due_date,
      due_time: data.due_time,
      priority: data.priority as "low" | "medium" | "high",
      category: data.category,
      recurrence: data.recurrence,
      contact_id: data.contact_id,
    });
    toast.success("Tarefa adicionada!");
  };

  const handleAddHabit = async (data: {
    name: string;
    daily_goal: number;
    unit: string;
    icon: string;
    color: string;
  }) => {
    await addHabit(data);
    toast.success("Hábito criado!");
  };

  return (
    <div className="space-y-6">
      <GettingStartedChecklist />
      <PlanLimitAlert />
      {/* Header */}
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-border/70 bg-gradient-to-br from-card via-card to-cyan-500/[0.09] p-6 text-foreground shadow-[0_24px_70px_-42px_rgba(8,145,178,.42)] dark:border-white/10 dark:from-slate-950 dark:via-slate-900 dark:to-cyan-950 dark:text-white dark:shadow-[0_24px_70px_-38px_rgba(8,145,178,.7)] sm:p-8"
      >
        <motion.div
          className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl"
          animate={reduceMotion ? undefined : { scale: [1, 1.15, 1], opacity: [0.55, 0.9, 0.55] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl"
          animate={reduceMotion ? undefined : { x: [0, 36, 0], y: [0, -16, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_30%,rgba(34,211,238,.12),transparent_28%),linear-gradient(115deg,transparent_40%,rgba(255,255,255,.04)_50%,transparent_60%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex max-w-2xl items-start gap-4 sm:gap-5">
            <motion.button
              type="button"
              onClick={() => navigate("/configuracoes")}
              whileHover={reduceMotion ? undefined : { scale: 1.04, rotate: -1 }}
              whileTap={{ scale: 0.97 }}
              className="group relative mt-1 shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-4 focus-visible:ring-offset-background dark:focus-visible:ring-cyan-300 dark:focus-visible:ring-offset-slate-950"
              aria-label="Abrir meu perfil"
            >
              <span className="absolute -inset-1 rounded-full bg-gradient-to-br from-cyan-300 via-emerald-300 to-violet-400 opacity-80 blur-[2px] transition group-hover:opacity-100" />
              <Avatar className="relative h-16 w-16 border-[3px] border-card shadow-2xl dark:border-slate-950 sm:h-20 sm:w-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600 text-lg font-bold text-white sm:text-xl">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-[3px] border-card bg-emerald-500 shadow-[0_0_12px_rgba(52,211,153,.65)] dark:border-slate-950 dark:bg-emerald-400" />
            </motion.button>

            <div className="min-w-0">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/[0.07] px-3 py-1.5 text-xs font-medium text-primary backdrop-blur dark:border-white/10 dark:bg-white/[0.07] dark:text-cyan-100">
              <AgendaFlowIcon className="h-3.5 w-3.5" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-[-0.03em] text-foreground dark:text-white sm:text-3xl lg:text-4xl">
              {greeting}, {displayName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground dark:text-slate-300 sm:text-base">
              Veja o que está pendente e organize o restante do dia.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-emerald-700 dark:text-emerald-200">
              <Sparkles className="h-3.5 w-3.5" />Seu dia em movimento
            </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
            {isNativePlatform && !permissionGranted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestNotifications}
                className="gap-2 border-border bg-background/70 text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
              >
                <Bell className="h-4 w-4" />
                Ativar lembretes
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="gap-2 border-border bg-background/70 text-foreground hover:bg-muted hover:text-foreground dark:border-white/15 dark:bg-white/[0.07] dark:text-white dark:hover:bg-white/15 dark:hover:text-white"
            >
              {isCustomizing ? <Check className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              {isCustomizing ? "Concluir" : "Personalizar"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Customization Panel */}
      <CustomizeDashboard isOpen={isCustomizing} onClose={() => setIsCustomizing(false)} />

      {/* Daily command center */}
      <DailyHub />

      {/* Quick Actions Widget */}
      <QuickActionsWidget
        onAddIncome={() => setTransactionModal({ open: true, type: "income" })}
        onAddExpense={() => setTransactionModal({ open: true, type: "expense" })}
        onAddTask={() => setTaskModalOpen(true)}
        onAddGoal={() => setGoalModalOpen(true)}
        onAddHabit={() => setHabitModalOpen(true)}
        onViewCalendar={() => navigate("/agenda")}
      />

      {/* Dashboard Cards Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[180px] bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {orderedVisibleCards.map((cardId, index) => {
            const CardComponent = cardComponents[cardId];
            const size = cardSizes[cardId] || "medium";

            return (
              <div key={cardId} className={getGridClass(cardId)}>
                <CardComponent
                  size={size}
                  delay={index * 0.05}
                  isCustomizing={isCustomizing}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && orderedVisibleCards.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <p className="text-muted-foreground">
            Nenhum card visível. Clique em "Personalizar" para ativar os cards.
          </p>
        </motion.div>
      )}

      {/* Modals */}
      <TransactionModal
        open={transactionModal.open}
        onOpenChange={(open) => setTransactionModal((prev) => ({ ...prev, open }))}
        onSubmit={handleAddTransaction}
        accounts={accounts}
        editData={transactionModal.open ? {
          id: "",
          description: "",
          amount: 0,
          type: transactionModal.type,
          category: transactionModal.type === "income" ? "Receita" : "",
          account_id: null,
        } : null}
      />

      <TaskModal
        open={taskModalOpen}
        onOpenChange={setTaskModalOpen}
        onSubmit={handleAddTask}
      />

      <HabitModal
        open={habitModalOpen}
        onOpenChange={setHabitModalOpen}
        onSubmit={handleAddHabit}
      />

      <PersonalGoalModal
        open={goalModalOpen}
        onOpenChange={setGoalModalOpen}
        onSubmit={async (data) => {
          navigate("/metas");
        }}
      />
    </div>
  );
}
