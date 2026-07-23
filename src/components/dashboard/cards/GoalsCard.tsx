import { Target, TrendingUp } from "lucide-react";
import { DashboardCard } from "../DashboardCard";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import { usePersonalGoals } from "@/hooks/usePersonalGoals";
import { Progress } from "@/components/ui/progress";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface GoalsCardProps {
  size?: CardSize;
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}

export function GoalsCard({ size = "medium", delay = 0, isCustomizing, dragHandleProps }: GoalsCardProps) {
  const { goals: financialGoals } = useFinancialGoals();
  const { goals: personalGoals, getGoalProgress } = usePersonalGoals();

  // Find the goal closest to completion (but not completed)
  const allGoals = [
    ...financialGoals.map((g) => ({
      id: g.id,
      name: g.name,
      progress: g.target_amount > 0 ? Math.round((g.current_amount / g.target_amount) * 100) : 0,
      type: "financial" as const,
    })),
    ...personalGoals
      .filter((g) => g.status !== "completed")
      .map((g) => {
        const taskProgress = getGoalProgress(g.id);
        return {
          id: g.id,
          name: g.title,
          progress: taskProgress !== null ? taskProgress : g.progress,
          type: "personal" as const,
        };
      }),
  ].filter((g) => g.progress < 100);

  const nearestGoal = allGoals.sort((a, b) => b.progress - a.progress)[0];
  const totalGoals = financialGoals.length + personalGoals.length;
  const completedGoals = personalGoals.filter((g) => g.status === "completed").length +
    financialGoals.filter((g) => g.current_amount >= g.target_amount).length;

  return (
    <DashboardCard
      title="Metas"
      icon={Target}
      href="/metas"
      variant="goals"
      size={size}
      delay={delay}
      isCustomizing={isCustomizing}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Ativas</span>
          <span className="text-lg font-bold">{totalGoals - completedGoals}</span>
        </div>
        
        {size !== "small" && nearestGoal && (
          <div className="space-y-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="w-3 h-3" />
              <span>Mais próxima</span>
            </div>
            <p className="text-sm font-medium truncate">{nearestGoal.name}</p>
            <div className="space-y-1">
              <Progress value={nearestGoal.progress} className="h-2" />
              <p className="text-xs text-right text-muted-foreground">{nearestGoal.progress}%</p>
            </div>
          </div>
        )}
        
        {size === "large" && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Concluídas</span>
              <span className="font-medium text-health">{completedGoals}</span>
            </div>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
