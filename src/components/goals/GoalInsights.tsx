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
    },
    {
      icon: CheckCircle2,
      label: "Concluídas",
      value: totalCompleted,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      icon: TrendingUp,
      label: "Próximas de Concluir",
      value: totalNearCompletion,
      color: "text-info",
      bgColor: "bg-info/10",
    },
    {
      icon: AlertTriangle,
      label: "Atrasadas",
      value: totalOverdue,
      color: "text-destructive",
      bgColor: "bg-destructive/10",
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
          <Card className="p-3 sm:p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg ${insight.bgColor} flex items-center justify-center flex-shrink-0`}>
                <insight.icon className={`w-5 h-5 ${insight.color}`} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground truncate">{insight.label}</p>
                <p className={`text-xl font-bold ${insight.color}`}>{insight.value}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </div>
  );
}
