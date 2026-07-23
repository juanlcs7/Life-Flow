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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4"
      >
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-display font-bold text-foreground">
            Saúde & Bem-Estar
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Acompanhe seus hábitos e cuide de você
          </p>
        </div>
        <Button
          className="gradient-health text-health-foreground h-10 sm:h-9 active:scale-95 transition-transform w-full sm:w-auto"
          size="sm"
          onClick={handleOpenModal}
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Hábito
        </Button>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="p-3 sm:p-4 text-center">
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
          <Card className="p-3 sm:p-4 text-center">
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
          <Card className="p-3 sm:p-4 text-center">
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
          <Card className="p-3 sm:p-4 text-center">
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
            <Card className="p-4 sm:p-5">
              <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Hábitos do Dia</h3>
              
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
                        className="p-3 sm:p-4 rounded-xl border border-border hover:shadow-md transition-shadow group"
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
                          <Progress value={Math.min(percentage, 100)} className="h-1.5 sm:h-2" />
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
          <Card className="p-4 sm:p-5">
            <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Dicas de Saúde</h3>
            <div className="space-y-2 sm:space-y-3">
              <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm font-medium">💧 Hidratação</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  Beba água regularmente ao longo do dia
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
                <p className="text-xs sm:text-sm font-medium">🧘 Pausas</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5 sm:mt-1">
                  Faça pausas para alongamento a cada hora
                </p>
              </div>
              <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50">
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
        <Card className="p-4 sm:p-5">
          <h3 className="font-display font-semibold text-sm sm:text-base mb-4">Progresso Semanal</h3>
          {habits.length === 0 ? (
            <div className="h-32 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
              <p>Adicione hábitos para ver o progresso</p>
            </div>
          ) : (
            <div className="h-32 sm:h-64 flex items-center justify-center text-muted-foreground text-sm">
              <p>Gráfico de progresso em desenvolvimento</p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
