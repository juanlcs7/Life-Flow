import { Heart, Flame, Check } from "lucide-react";
import { DashboardCard } from "../DashboardCard";
import { useHabits } from "@/hooks/useHabits";
import { Progress } from "@/components/ui/progress";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface HealthCardProps {
  size?: CardSize;
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}

export function HealthCard({ size = "medium", delay = 0, isCustomizing, dragHandleProps }: HealthCardProps) {
  const { habits } = useHabits();

  const completedHabits = habits.filter((h) => h.current_progress >= h.daily_goal).length;
  const totalHabits = habits.length;
  const progressPercent = totalHabits > 0 ? Math.round((completedHabits / totalHabits) * 100) : 0;
  
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return (
    <DashboardCard
      title="Saúde"
      icon={Heart}
      href="/saude"
      variant="health"
      size={size}
      delay={delay}
      isCustomizing={isCustomizing}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Hábitos Hoje</span>
          <span className="text-lg font-bold">{completedHabits}/{totalHabits}</span>
        </div>
        
        {size !== "small" && totalHabits > 0 && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progressPercent}% concluído</p>
          </div>
        )}
        
        {size !== "small" && bestStreak > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Flame className="w-3 h-3 text-warning" />
            <span className="text-muted-foreground">Melhor sequência:</span>
            <span className="font-medium">{bestStreak} dias</span>
          </div>
        )}
        
        {size === "large" && habits.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <span className="text-xs text-muted-foreground">Concluídos hoje</span>
            <div className="space-y-1">
              {habits
                .filter((h) => h.current_progress >= h.daily_goal)
                .slice(0, 3)
                .map((habit) => (
                  <div key={habit.id} className="flex items-center gap-2 text-sm">
                    <Check className="w-3 h-3 text-health" />
                    <span className="truncate">{habit.name}</span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
