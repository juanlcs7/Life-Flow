import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Target,
  Wallet,
  Clock,
  Flag,
  CheckCircle2,
  Pause,
  Play,
  History,
  Link2,
  Loader2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { usePersonalGoals, PersonalGoal } from "@/hooks/usePersonalGoals";
import { useFinancialGoals, FinancialGoal } from "@/hooks/useFinancialGoals";
import { useAccounts } from "@/hooks/useAccounts";
import { useTasks } from "@/hooks/useTasks";
import { PersonalGoalModal } from "@/components/goals/PersonalGoalModal";
import { FinancialGoalModal } from "@/components/finance/FinancialGoalModal";
import { AddToGoalModal } from "@/components/finance/AddToGoalModal";
import { LinkTaskModal } from "@/components/goals/LinkTaskModal";
import { ContributionHistoryModal } from "@/components/goals/ContributionHistoryModal";
import { GoalInsights } from "@/components/goals/GoalInsights";
import { format, parseISO, isPast } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { usePlan } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { PageHeader } from "@/components/layout/PageHeader";

const priorityColors = {
  high: "text-destructive bg-destructive/10",
  medium: "text-warning bg-warning/10",
  low: "text-muted-foreground bg-muted",
};

const priorityLabels = {
  high: "Alta",
  medium: "Média",
  low: "Baixa",
};

const statusLabels = {
  in_progress: "Em andamento",
  completed: "Concluída",
  paused: "Pausada",
};

const statusColors = {
  in_progress: "bg-info/10 text-info",
  completed: "bg-success/10 text-success",
  paused: "bg-muted text-muted-foreground",
};

export default function Metas() {
  const [activeTab, setActiveTab] = useState("personal");
  
  // Personal goals modals
  const [personalGoalModalOpen, setPersonalGoalModalOpen] = useState(false);
  const [editingPersonalGoal, setEditingPersonalGoal] = useState<PersonalGoal | null>(null);
  const [linkTaskModalOpen, setLinkTaskModalOpen] = useState(false);
  const [selectedGoalForLink, setSelectedGoalForLink] = useState<PersonalGoal | null>(null);
  
  // Financial goals modals
  const [financialGoalModalOpen, setFinancialGoalModalOpen] = useState(false);
  const [editingFinancialGoal, setEditingFinancialGoal] = useState<FinancialGoal | null>(null);
  const [addToGoalModalOpen, setAddToGoalModalOpen] = useState(false);
  const [selectedGoalForAdd, setSelectedGoalForAdd] = useState<FinancialGoal | null>(null);
  const [contributionHistoryModalOpen, setContributionHistoryModalOpen] = useState(false);
  const [selectedGoalForHistory, setSelectedGoalForHistory] = useState<FinancialGoal | null>(null);

  // Expanded state for cards
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  // Hooks
  const { 
    goals: personalGoals, 
    linkedTasks,
    isLoading: personalLoading, 
    addGoal: addPersonalGoal, 
    updateGoal: updatePersonalGoal,
    updateProgress: updatePersonalProgress,
    updateStatus: updatePersonalStatus,
    deleteGoal: deletePersonalGoal,
    getGoalProgress,
    getGoalTasks,
  } = usePersonalGoals();

  const { 
    goals: financialGoals, 
    totalSavings,
    isLoading: financialLoading, 
    addGoal: addFinancialGoal, 
    updateGoal: updateFinancialGoal,
    deleteGoal: deleteFinancialGoal,
    addToGoal,
    withdrawFromGoal,
  } = useFinancialGoals();

  const { accounts } = useAccounts();
  const { tasks, linkTask } = useTasks();

  const { canAddGoal, limits, usage } = usePlan();
  const [premiumOpen, setPremiumOpen] = useState(false);
  const [premiumReason, setPremiumReason] = useState<string | null>(null);

  const toggleExpanded = (id: string) => {
    const newSet = new Set(expandedGoals);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedGoals(newSet);
  };

  // Handlers
  const handleAddPersonalGoal = async (data: any) => {
    if (!editingPersonalGoal && !canAddGoal) {
      setPremiumReason(`Plano gratuito permite ${limits.goals} metas. Você já tem ${usage.goalsCount}.`);
      setPremiumOpen(true);
      return;
    }
    if (editingPersonalGoal) {
      await updatePersonalGoal({ id: editingPersonalGoal.id, ...data });
      toast.success("Meta atualizada!");
    } else {
      await addPersonalGoal(data);
      toast.success("Meta criada!");
    }
    setEditingPersonalGoal(null);
  };

  const handleAddFinancialGoal = async (data: any) => {
    if (!editingFinancialGoal && !canAddGoal) {
      setPremiumReason(`Plano gratuito permite ${limits.goals} metas. Você já tem ${usage.goalsCount}.`);
      setPremiumOpen(true);
      return;
    }
    if (editingFinancialGoal) {
      await updateFinancialGoal({ id: editingFinancialGoal.id, ...data });
      toast.success("Meta atualizada!");
    } else {
      await addFinancialGoal(data);
      toast.success("Meta financeira criada!");
    }
    setEditingFinancialGoal(null);
  };

  const handleLinkTask = async (taskId: string, goalId: string | null) => {
    await linkTask({ taskId, goalId });
    toast.success(goalId ? "Tarefa vinculada!" : "Tarefa desvinculada!");
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} reason={premiumReason} />
      {/* Modals */}
      <PersonalGoalModal 
        open={personalGoalModalOpen} 
        onOpenChange={setPersonalGoalModalOpen} 
        onSubmit={handleAddPersonalGoal}
        editData={editingPersonalGoal}
      />
      <FinancialGoalModal 
        open={financialGoalModalOpen} 
        onOpenChange={setFinancialGoalModalOpen} 
        onSubmit={handleAddFinancialGoal}
        editData={editingFinancialGoal}
      />
      <AddToGoalModal 
        open={addToGoalModalOpen} 
        onOpenChange={setAddToGoalModalOpen} 
        onSubmit={async (data) => { await addToGoal(data); toast.success("Aporte realizado!"); }}
        goal={selectedGoalForAdd}
        accounts={accounts}
      />
      {selectedGoalForLink && (
        <LinkTaskModal
          open={linkTaskModalOpen}
          onOpenChange={setLinkTaskModalOpen}
          goalId={selectedGoalForLink.id}
          goalTitle={selectedGoalForLink.title}
          tasks={tasks.map(t => ({ id: t.id, title: t.title, completed: t.completed, priority: t.priority, goal_id: t.goal_id }))}
          onLink={handleLinkTask}
        />
      )}
      <ContributionHistoryModal
        open={contributionHistoryModalOpen}
        onOpenChange={setContributionHistoryModalOpen}
        goal={selectedGoalForHistory}
      />

      <PageHeader
        title="Metas Inteligentes"
        description="Transforme objetivos em etapas visíveis e acompanhe cada avanço até a conquista."
        eyebrow="Evolução pessoal"
        icon={Target}
        variant="goals"
      />

      {/* Insights */}
      <GoalInsights personalGoals={personalGoals} financialGoals={financialGoals} />

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid h-11 w-full grid-cols-2 rounded-xl border border-border/60 bg-card/60 p-1 lg:w-auto">
          <TabsTrigger value="personal" className="flex items-center gap-2 rounded-lg px-6 data-[state=active]:bg-goals data-[state=active]:text-goals-foreground data-[state=active]:shadow-sm">
            <Target className="w-4 h-4" />
            Pessoais
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2 rounded-lg px-6 data-[state=active]:bg-goals data-[state=active]:text-goals-foreground data-[state=active]:shadow-sm">
            <Wallet className="w-4 h-4" />
            Financeiras
          </TabsTrigger>
        </TabsList>

        {/* Personal Goals Tab */}
        <TabsContent value="personal" className="mt-4 space-y-4">
          <div className="flex justify-end">
            <Button
              className="gradient-tasks text-tasks-foreground h-10 active:scale-95 transition-transform w-full sm:w-auto"
              onClick={() => {
                setEditingPersonalGoal(null);
                setPersonalGoalModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta Pessoal
            </Button>
          </div>

          {personalLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : personalGoals.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-muted/15 p-8 text-center text-muted-foreground">
              <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhuma meta pessoal definida</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setPersonalGoalModalOpen(true)}
              >
                Criar primeira meta
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {personalGoals.map((goal, index) => (
                <PersonalGoalCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  expanded={expandedGoals.has(goal.id)}
                  onToggleExpand={() => toggleExpanded(goal.id)}
                  tasks={getGoalTasks(goal.id)}
                  calculatedProgress={getGoalProgress(goal.id)}
                  onEdit={() => {
                    setEditingPersonalGoal(goal);
                    setPersonalGoalModalOpen(true);
                  }}
                  onDelete={async () => {
                    await deletePersonalGoal(goal.id);
                    toast.success("Meta excluída!");
                  }}
                  onUpdateProgress={async (progress) => {
                    await updatePersonalProgress({ id: goal.id, progress });
                  }}
                  onUpdateStatus={async (status) => {
                    await updatePersonalStatus({ id: goal.id, status });
                    toast.success(`Status atualizado para: ${statusLabels[status as keyof typeof statusLabels]}`);
                  }}
                  onLinkTasks={() => {
                    setSelectedGoalForLink(goal);
                    setLinkTaskModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Financial Goals Tab */}
        <TabsContent value="financial" className="mt-4 space-y-4">
          <div className="flex flex-col gap-3 rounded-2xl border border-warning/15 bg-gradient-to-r from-warning/[0.08] to-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning/10">
                <Wallet className="w-6 h-6 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total em Poupança</p>
                <p className="text-xl font-bold text-warning">
                  R$ {totalSavings.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <Button
              className="gradient-finance text-finance-foreground h-10 active:scale-95 transition-transform w-full sm:w-auto"
              onClick={() => {
                setEditingFinancialGoal(null);
                setFinancialGoalModalOpen(true);
              }}
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Meta Financeira
            </Button>
          </div>

          {financialLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : financialGoals.length === 0 ? (
            <Card className="border-dashed border-border/70 bg-muted/15 p-8 text-center text-muted-foreground">
              <Wallet className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">Nenhuma meta financeira definida</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={() => setFinancialGoalModalOpen(true)}
              >
                Criar primeira meta
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {financialGoals.map((goal, index) => (
                <FinancialGoalCard
                  key={goal.id}
                  goal={goal}
                  index={index}
                  expanded={expandedGoals.has(goal.id)}
                  onToggleExpand={() => toggleExpanded(goal.id)}
                  onEdit={() => {
                    setEditingFinancialGoal(goal);
                    setFinancialGoalModalOpen(true);
                  }}
                  onDelete={async () => {
                    await deleteFinancialGoal(goal.id);
                    toast.success("Meta excluída!");
                  }}
                  onAddContribution={() => {
                    setSelectedGoalForAdd(goal);
                    setAddToGoalModalOpen(true);
                  }}
                  onWithdraw={async () => {
                    // Simple withdraw - could open a modal for amount selection
                    const amount = prompt("Valor para resgatar:");
                    if (amount && parseFloat(amount) > 0) {
                      try {
                        await withdrawFromGoal({ id: goal.id, amount: parseFloat(amount) });
                        toast.success("Resgate realizado!");
                      } catch (error: any) {
                        toast.error(error.message || "Erro ao resgatar");
                      }
                    }
                  }}
                  onViewHistory={() => {
                    setSelectedGoalForHistory(goal);
                    setContributionHistoryModalOpen(true);
                  }}
                  accounts={accounts}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Personal Goal Card Component
interface PersonalGoalCardProps {
  goal: PersonalGoal;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  tasks: { id: string; title: string; completed: boolean }[];
  calculatedProgress: number | null;
  onEdit: () => void;
  onDelete: () => void;
  onUpdateProgress: (progress: number) => Promise<void>;
  onUpdateStatus: (status: string) => Promise<void>;
  onLinkTasks: () => void;
}

function PersonalGoalCard({
  goal,
  index,
  expanded,
  onToggleExpand,
  tasks,
  calculatedProgress,
  onEdit,
  onDelete,
  onUpdateProgress,
  onUpdateStatus,
  onLinkTasks,
}: PersonalGoalCardProps) {
  const progress = calculatedProgress !== null ? calculatedProgress : goal.progress;
  const isOverdue = isPast(parseISO(goal.deadline)) && goal.status !== "completed";
  const isCompleted = goal.status === "completed" || progress >= 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-goals/[0.035] p-4 shadow-sm transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-goals hover:-translate-y-0.5 hover:shadow-md sm:p-5",
        isCompleted && "opacity-80",
        isOverdue && "border-destructive/50"
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className={cn(
                "font-semibold text-sm sm:text-base",
                isCompleted && "line-through text-muted-foreground"
              )}>
                {goal.title}
              </h4>
              <span className={cn(
                "text-[10px] px-2 py-0.5 rounded-full",
                statusColors[goal.status as keyof typeof statusColors]
              )}>
                {statusLabels[goal.status as keyof typeof statusLabels]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              <span className={cn(isOverdue && "text-destructive")}>
                {format(parseISO(goal.deadline), "dd MMM yyyy", { locale: ptBR })}
              </span>
              <span className={cn(
                "px-1.5 py-0.5 rounded",
                priorityColors[goal.priority as keyof typeof priorityColors]
              )}>
                {priorityLabels[goal.priority as keyof typeof priorityLabels]}
              </span>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onLinkTasks}>
                <Link2 className="w-4 h-4 mr-2" />
                Vincular Tarefas
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {goal.status === "paused" ? (
                <DropdownMenuItem onClick={() => onUpdateStatus("in_progress")}>
                  <Play className="w-4 h-4 mr-2" />
                  Retomar
                </DropdownMenuItem>
              ) : goal.status !== "completed" && (
                <DropdownMenuItem onClick={() => onUpdateStatus("paused")}>
                  <Pause className="w-4 h-4 mr-2" />
                  Pausar
                </DropdownMenuItem>
              )}
              {goal.status !== "completed" && (
                <DropdownMenuItem onClick={() => onUpdateStatus("completed")}>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Concluir
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs sm:text-sm">
            <span className="text-muted-foreground">
              {tasks.length > 0 ? `${tasks.filter(t => t.completed).length}/${tasks.length} tarefas` : "Progresso"}
            </span>
            <span className="font-medium">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Manual progress slider if no linked tasks */}
        {tasks.length === 0 && goal.status !== "completed" && (
          <div className="mt-4 space-y-2">
            <p className="text-xs text-muted-foreground">Ajustar progresso manualmente:</p>
            <Slider
              value={[progress]}
              onValueChange={(value) => onUpdateProgress(value[0])}
              max={100}
              step={5}
              className="w-full"
            />
          </div>
        )}

        {/* Expand/Collapse for tasks and description */}
        {(goal.description || tasks.length > 0) && (
          <button
            onClick={onToggleExpand}
            className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            {expanded ? "Menos detalhes" : "Mais detalhes"}
          </button>
        )}

        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 pt-3 border-t space-y-3"
          >
            {goal.description && (
              <p className="text-sm text-muted-foreground">{goal.description}</p>
            )}
            {tasks.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs font-medium">Tarefas vinculadas:</p>
                {tasks.map(task => (
                  <div key={task.id} className="flex items-center gap-2 text-xs">
                    {task.completed ? (
                      <CheckCircle2 className="w-3 h-3 text-success" />
                    ) : (
                      <div className="w-3 h-3 rounded-full border" />
                    )}
                    <span className={cn(task.completed && "line-through text-muted-foreground")}>
                      {task.title}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </Card>
    </motion.div>
  );
}

// Financial Goal Card Component
interface FinancialGoalCardProps {
  goal: FinancialGoal;
  index: number;
  expanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onAddContribution: () => void;
  onWithdraw: () => void;
  onViewHistory: () => void;
  accounts: any[];
}

function FinancialGoalCard({
  goal,
  index,
  expanded,
  onToggleExpand,
  onEdit,
  onDelete,
  onAddContribution,
  onWithdraw,
  onViewHistory,
}: FinancialGoalCardProps) {
  const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
  const remaining = goal.target_amount - goal.current_amount;
  const isCompleted = progress >= 100;
  const isOverdue = goal.deadline && isPast(parseISO(goal.deadline)) && !isCompleted;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.05 }}
    >
      <Card className={cn(
        "relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-warning/[0.035] p-4 shadow-sm transition-all before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-warning hover:-translate-y-0.5 hover:shadow-md sm:p-5",
        isCompleted && "border-success/50 bg-success/5",
        isOverdue && "border-destructive/50"
      )}>
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h4 className="font-semibold text-sm sm:text-base">{goal.name}</h4>
              {isCompleted && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success">
                  Atingida! 🎉
                </span>
              )}
            </div>
            {goal.deadline && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                <span className={cn(isOverdue && "text-destructive")}>
                  Prazo: {format(parseISO(goal.deadline), "dd MMM yyyy", { locale: ptBR })}
                </span>
              </div>
            )}
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onEdit}>
                <Pencil className="w-4 h-4 mr-2" />
                Editar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onViewHistory}>
                <History className="w-4 h-4 mr-2" />
                Ver Histórico
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Amounts */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-medium">{progress.toFixed(0)}%</span>
          </div>
          <Progress value={progress} className="h-2.5" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>R$ {goal.current_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
            <span>R$ {goal.target_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
          </div>
          {remaining > 0 && (
            <p className="text-xs text-center text-muted-foreground">
              Faltam R$ {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 border-t border-border/60 pt-4">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={onAddContribution}
          >
            <Plus className="w-4 h-4 mr-1" />
            Aportar
          </Button>
          {goal.current_amount > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={onWithdraw}
            >
              Resgatar
            </Button>
          )}
        </div>

        {/* Notes expand */}
        {goal.notes && (
          <>
            <button
              onClick={onToggleExpand}
              className="flex items-center gap-1 text-xs text-muted-foreground mt-3 hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              {expanded ? "Ocultar notas" : "Ver notas"}
            </button>

            {expanded && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-3 bg-muted rounded-lg"
              >
                <p className="text-sm text-muted-foreground">{goal.notes}</p>
              </motion.div>
            )}
          </>
        )}
      </Card>
    </motion.div>
  );
}
