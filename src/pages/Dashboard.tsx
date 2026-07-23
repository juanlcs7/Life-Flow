import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Settings2, Bell, BellOff } from "lucide-react";
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
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-foreground">
            {greeting}, <span className="text-gradient">{displayName}</span>! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Aqui está o resumo do seu dia. Vamos fazer dele um dia produtivo!
          </p>
        </div>

        <div className="flex items-center gap-2 self-start">
          {isNativePlatform && !permissionGranted && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRequestNotifications}
              className="gap-2"
            >
              <Bell className="w-4 h-4" />
              Ativar lembretes
            </Button>
          )}
          <Button
            variant={isCustomizing ? "default" : "outline"}
            size="sm"
            onClick={() => setIsCustomizing(!isCustomizing)}
            className="gap-2"
          >
            <Settings2 className="w-4 h-4" />
            {isCustomizing ? "Concluir" : "Personalizar"}
          </Button>
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-[180px] bg-muted/50 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
