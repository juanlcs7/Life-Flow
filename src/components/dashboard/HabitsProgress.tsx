import { motion } from "framer-motion";
import { Droplets, Apple, Moon, Footprints, Dumbbell, Brain, ArrowRight, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { useHabits } from "@/hooks/useHabits";
import { LucideIcon } from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Droplets,
  Apple,
  Moon,
  Footprints,
  Dumbbell,
  Brain,
};

export function HabitsProgress() {
  const { habits, isLoading } = useHabits();

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
        className="bg-card rounded-xl p-5 shadow-card border border-border flex items-center justify-center h-48"
      >
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.5 }}
      className="bg-card rounded-xl p-5 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Hábitos do Dia</h3>
        <Link to="/saude" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver todos <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {habits.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <p>Nenhum hábito cadastrado</p>
          <Link to="/saude" className="text-sm text-primary hover:underline mt-2 inline-block">
            Adicionar hábito
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {habits.slice(0, 4).map((habit, index) => {
            const percentage = Math.min(100, Math.round((habit.current_progress / habit.daily_goal) * 100));
            const IconComponent = iconMap[habit.icon] || Droplets;
            return (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: 0.6 + index * 0.05 }}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-lg ${habit.color}/10 flex items-center justify-center`}>
                      <IconComponent className={`w-4 h-4 ${habit.color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="text-sm font-medium">{habit.name}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {habit.current_progress}/{habit.daily_goal} {habit.unit}
                  </span>
                </div>
                <div className="relative">
                  <Progress value={percentage} className="h-2" />
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
