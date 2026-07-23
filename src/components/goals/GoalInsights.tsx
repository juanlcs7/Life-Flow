import { motion } from "framer-motion";
import { Target, CheckCircle2, AlertTriangle, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PersonalGoal } from "@/hooks/usePersonalGoals";
import { FinancialGoal } from "@/hooks/useFinancialGoals";

interface GoalInsightsProps {
  personalGoals: PersonalGoal[];
  financialGoals: FinancialGoal[];
}

export function GoalInsights({ personalGoals, financialGoals }: GoalInsightsProps) {
  const now = new Date();

  // Personal goals stats
  const personalStats = {
    total: personalGoals.length,
    completed: personalGoals.filter(g => g.status === "completed").length,
    overdue: personalGoals.filter(g => {
      if (g.status === "completed") return false;
      return new Date(g.deadline) < now;
    }).length,
    nearCompletion: personalGoals.filter(g => g.progress >= 80 && g.status !== "completed").length,
  };

  // Financial goals stats
  const financialStats = {
    total: financialGoals.length,
    completed: financialGoals.filter(g => g.current_amount >= g.target_amount).length,
    overdue: financialGoals.filter(g => {
      if (g.current_amount >= g.target_amount) return false;
      if (!g.deadline) return false;
      return new Date(g.deadline) < now;
    }).length,
    nearCompletion: financialGoals.filter(g => {
      const progress = (g.current_amount / g.target_amount) * 100;
      return progress >= 80 && progress < 100;
    }).length,
  };

  const totalGoals = personalStats.total + financialStats.total;
  const totalCompleted = personalStats.completed + financialStats.completed;
  const totalOverdue = personalStats.overdue + financialStats.overdue;
  const totalNearCompletion = personalStats.nearCompletion + financialStats.nearCompletion;

  const insights = [
    {
      icon: Target,
      label: "Total de Metas",
      value: totalGoals,
      color: "text-primary",
      bgColor: "bg-primary/10",
      accent: "before:bg-primary",
      glow: "from-primary/[0.08]",
    },
    {
      icon: CheckCircle2,
      label: "Concluídas",
      value: totalCompleted,
      color: "text-success",
      bgColor: "bg-success/10",
      accent: "before:bg-success",
      glow: "from-success/[0.07]",
    },
    {
      icon: TrendingUp,
      label: "Próximas de Concluir",
      value: totalNearCompletion,
      color: "text-info",
      bgColor: "bg-info/10",
      accent: "before:bg-info",
      glow: "from-info/[0.07]",
    },
    {
      icon: AlertTriangle,
      label: "Atrasadas",
      value: totalOverdue,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
      accent: "before:bg-destructive",
      glow: "from-destructive/[0.06]",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {insights.map((insight, idx) => (
        <motion.div
          key={insight.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 + idx * 0.05 }}
        >
          <Card className={`relative h-full min-h-[96px] overflow-hidden border-border/70 bg-gradient-to-br ${insight.glow} via-card to-card p-3 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 ${insight.accent} transition-all hover:-translate-y-0.5 hover:shadow-md sm:p-4`}>
            <div className="flex items-center gap-3">
              <div className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl ${insight.bgColor}`}>
                <insight.icon className={`w-5 h-5 ${insight.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{insight.label}</p>
                <p className={`mt-0.5 text-2xl font-bold tracking-tight ${insight.color}`}>{insight.value}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
