import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Settings2, Bell, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/useProfile";
import { useDashboardPreferences, type CardId } from "@/hooks/useDashboardPreferences";
import { useTransactions } from "@/hooks/useTransactions";
import { useTasks } from "@/hooks/useTasks";
import { useHabits } from "@/hooks/useHabits";
import { useAccounts } from "@/hooks/useAccounts";
import { useNotifications } from "@/hooks/useNotifications";
import { CustomizeDashboard } from "@/components/dashboard/CustomizeDashboard";
import { QuickActionsWidget } from "@/components/dashboard/QuickActionsWidget";
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
  }) => {
    await addTask({
      title: data.title,
      due_date: data.due_date,
      due_time: data.due_time,
      priority: data.priority as "low" | "medium" | "high",
      category: data.category,
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
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative overflow-hidden rounded-[1.75rem] border border-white/60 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 p-6 text-white shadow-[0_24px_70px_-38px_rgba(8,145,178,.7)] sm:p-8"
      >
        <div className="pointer-events-none absolute -right-16 -top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs font-medium text-cyan-100 backdrop-blur">
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="capitalize">{formattedDate}</span>
            </div>
            <h1 className="font-display text-3xl font-bold tracking-[-0.03em] text-white lg:text-4xl">
              {greeting}, {displayName}.
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
              Seu dia começa com clareza. Acompanhe o que importa e avance no seu ritmo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:justify-end">
            {isNativePlatform && !permissionGranted && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestNotifications}
                className="gap-2 border-white/15 bg-white/[0.07] text-white hover:bg-white/15 hover:text-white"
              >
                <Bell className="h-4 w-4" />
                Ativar lembretes
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCustomizing(!isCustomizing)}
              className="gap-2 border-white/15 bg-white/[0.07] text-white hover:bg-white/15 hover:text-white"
            >
              {isCustomizing ? <Sparkles className="h-4 w-4" /> : <Settings2 className="h-4 w-4" />}
              {isCustomizing ? "Concluir" : "Personalizar"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Customization Panel */}
      <CustomizeDashboard isOpen={isCustomizing} onClose={() => setIsCustomizing(false)} />

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
