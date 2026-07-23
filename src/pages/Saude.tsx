import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Droplets,
  Apple,
  Moon,
  Footprints,
  Heart,
  Dumbbell,
  Brain,
  TrendingUp,
  Check,
  Book,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useHabits, Habit } from "@/hooks/useHabits";
import { HabitModal } from "@/components/modals/HabitModal";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/PageHeader";

const iconMap: Record<string, React.ElementType> = {
  Droplets,
  Apple,
  Moon,
  Footprints,
  Heart,
  Dumbbell,
  Brain,
  Book,
};

export default function Saude() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const { habits, isLoading, addHabit, incrementHabit, updateHabit, deleteHabit } = useHabits();

  // Calculate stats from real data
  const stats = useMemo(() => {
    if (habits.length === 0) {
      return { healthScore: 0, maxStreak: 0 };
    }
    
    const totalProgress = habits.reduce((acc, h) => {
      return acc + Math.min((h.current_progress / h.daily_goal) * 100, 100);
    }, 0);
    const healthScore = Math.round(totalProgress / habits.length);
    const maxStreak = Math.max(...habits.map((h) => h.streak), 0);
    
    return { healthScore, maxStreak };
  }, [habits]);

  const handleAddHabit = async (data: {
    name: string;
    daily_goal: number;
    unit: string;
    icon: string;
    color: string;
  }) => {
    if (editingHabit) {
      await updateHabit({ id: editingHabit.id, ...data });
      toast.success("Hábito atualizado!");
    } else {
      await addHabit(data);
      toast.success("Hábito adicionado!");
    }
    setEditingHabit(null);
  };

  const handleEditHabit = (habit: Habit) => {
    setEditingHabit(habit);
    setModalOpen(true);
  };

  const handleDeleteHabit = async (id: string) => {
    await deleteHabit(id);
    toast.success("Hábito excluído!");
  };

  const handleOpenModal = () => {
    setEditingHabit(null);
    setModalOpen(true);
  };

  const handleIncrement = async (habit: Habit) => {
    await incrementHabit({
      id: habit.id,
      current_progress: habit.current_progress,
      daily_goal: habit.daily_goal,
      streak: habit.streak,
      last_updated: habit.last_updated,
    });
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <HabitModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onSubmit={handleAddHabit}
        editData={editingHabit}
      />

      <PageHeader
        title="Saúde & Bem-Estar"
        description="Construa hábitos consistentes e acompanhe sua evolução diária com clareza."
        eyebrow="Seu equilíbrio"
        icon={Heart}
        variant="health"
        actions={
          <Button className="gradient-health h-10 text-health-foreground active:scale-95" size="sm" onClick={handleOpenModal}>
            <Plus className="mr-2 h-4 w-4" />Novo Hábito
          </Button>
        }
      />

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative h-full overflow-hidden border-border/70 bg-gradient-to-br from-health/[0.08] via-card to-card p-3 text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-health transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl gradient-health flex items-center justify-center mb-2">
              <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-health-foreground" />
            </div>
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold">{habits.length > 0 ? `${stats.healthScore}%` : "—"}</p>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground">Score de Saúde</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="relative h-full overflow-hidden border-border/70 bg-gradient-to-br from-info/[0.07] via-card to-card p-3 text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-info transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-info/10 flex items-center justify-center mb-2">
              <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-info" />
            </div>
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold">{habits.length}</p>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground">Hábitos Ativos</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative h-full overflow-hidden border-border/70 bg-gradient-to-br from-accent/[0.07] via-card to-card p-3 text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-accent transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-accent/10 flex items-center justify-center mb-2">
              <Dumbbell className="w-5 h-5 sm:w-6 sm:h-6 text-accent" />
            </div>
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold">
                {habits.filter((h) => h.current_progress >= h.daily_goal).length}
              </p>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground">Metas Atingidas</p>
          </Card>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Card className="relative h-full overflow-hidden border-border/70 bg-gradient-to-br from-tasks/[0.07] via-card to-card p-3 text-center shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-tasks transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4">
            <div className="w-10 h-10 sm:w-12 sm:h-12 mx-auto rounded-xl bg-tasks/10 flex items-center justify-center mb-2">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-tasks" />
            </div>
            {isLoading ? (
              <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin mx-auto text-muted-foreground" />
            ) : (
              <p className="text-lg sm:text-2xl font-bold">{stats.maxStreak > 0 ? `${stats.maxStreak}d` : "—"}</p>
            )}
            <p className="text-[10px] sm:text-xs text-muted-foreground">Maior Sequência</p>
          </Card>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Habits Grid */}
        <div className="lg:col-span-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-health/[0.035] p-4 shadow-sm sm:p-5">
              <div className="mb-4">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-health">Rotina de hoje</p>
                <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">Hábitos do Dia</h3>
              </div>
              
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : habits.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">Nenhum hábito cadastrado</p>
                  <Button
                    variant="link"
                    className="mt-2"
                    onClick={handleOpenModal}
                  >
                    Criar primeiro hábito
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {habits.map((habit, index) => {
                    const percentage = Math.round((habit.current_progress / habit.daily_goal) * 100);
                    const IconComponent = iconMap[habit.icon] || Heart;
                    
                    return (
                      <motion.div
                        key={habit.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.35 + index * 0.05 }}
                        className="group rounded-xl border border-border/60 bg-muted/20 p-3 transition-all hover:-translate-y-0.5 hover:border-health/20 hover:bg-health/[0.035] hover:shadow-md sm:p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            <div
                              className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{ backgroundColor: `${habit.color}20` }}
                            >
                              <IconComponent
                                className="w-4 h-4 sm:w-5 sm:h-5"
                                style={{ color: habit.color }}
                              />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-xs sm:text-sm truncate">{habit.name}</p>
                              <p className="text-[10px] sm:text-xs text-muted-foreground">
                                🔥 {habit.streak} dias
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 w-7 sm:h-8 sm:w-8 p-0 text-xs active:scale-90 transition-transform"
                              onClick={() => handleIncrement(habit)}
                              disabled={habit.current_progress >= habit.daily_goal}
                            >
                              {habit.current_progress >= habit.daily_goal ? (
                                <Check className="w-3 h-3" />
                              ) : (
                                "+1"
                              )}
                            </Button>
                            <ContextActionMenu
                              onEdit={() => handleEditHabit(habit)}
                              onDelete={() => handleDeleteHabit(habit.id)}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5 sm:space-y-2">
                          <div className="flex items-center justify-between text-[10px] sm:text-xs">
                            <span className="text-muted-foreground">Progresso</span>
                            <span className="font-medium">
                              {habit.current_progress}/{habit.daily_goal} {habit.unit}
                            </span>
                          </div>
                          <Progress value={Math.min(percentage, 100)} className="h-2 sm:h-2.5" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        {/* Reminders */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="h-full overflow-hidden border-health/15 bg-gradient-to-br from-card via-card to-health/[0.06] p-4 shadow-sm sm:p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-health">Bem-estar</p>
            <h3 className="mb-4 mt-1 font-display text-base font-semibold sm:text-lg">Dicas de Saúde</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="rounded-xl border border-border/50 bg-background/45 p-3">
                <p className="text-xs sm:text-sm font-medium">💧 Hidratação</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  Beba água regularmente ao longo do dia
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/45 p-3">
                <p className="text-xs sm:text-sm font-medium">🧘 Pausas</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  Faça pausas para alongamento a cada hora
                </p>
              </div>
              <div className="rounded-xl border border-border/50 bg-background/45 p-3">
                <p className="text-xs sm:text-sm font-medium">😴 Sono</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  Mantenha uma rotina de sono regular
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Weekly Progress Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card className="border-border/70 bg-card/80 p-4 shadow-sm sm:p-5">
          <div className="mb-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-health">Consistência</p>
            <h3 className="mt-1 font-display text-base font-semibold sm:text-lg">Progresso Semanal</h3>
          </div>
          {habits.length === 0 ? (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-border/70 bg-muted/15 text-sm text-muted-foreground sm:h-64">
              <p>Adicione hábitos para ver o progresso</p>
            </div>
          ) : (
            <div className="flex h-40 items-center justify-center rounded-xl border border-dashed border-health/20 bg-health/[0.025] text-sm text-muted-foreground sm:h-64">
              <p>Gráfico de progresso em desenvolvimento</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
