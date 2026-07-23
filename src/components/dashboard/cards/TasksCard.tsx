import { CheckSquare, Clock, AlertCircle } from "lucide-react";
import { DashboardCard } from "../DashboardCard";
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface TasksCardProps {
  size?: CardSize;
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}

export function TasksCard({ size = "medium", delay = 0, isCustomizing, dragHandleProps }: TasksCardProps) {
  const { tasks } = useTasks();

  const today = new Date().toISOString().split("T")[0];
  const todayTasks = tasks.filter((t) => t.due_date === today);
  const completedToday = todayTasks.filter((t) => t.completed).length;
  const pendingToday = todayTasks.length - completedToday;
  const progressPercent = todayTasks.length > 0 ? Math.round((completedToday / todayTasks.length) * 100) : 0;

  const nextTask = tasks
    .filter((t) => !t.completed && t.due_date >= today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))[0];

  const priorityColors = {
    high: "bg-destructive/10 text-destructive",
    medium: "bg-warning/10 text-warning",
    low: "bg-muted text-muted-foreground",
  };

  return (
    <DashboardCard
      title="Tarefas"
      icon={CheckSquare}
      href="/agenda"
      variant="tasks"
      size={size}
      delay={delay}
      isCustomizing={isCustomizing}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Hoje</span>
          <span className="text-lg font-bold">{completedToday}/{todayTasks.length}</span>
        </div>
        
        {size !== "small" && todayTasks.length > 0 && (
          <div className="space-y-1">
            <Progress value={progressPercent} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progressPercent}% concluído</p>
          </div>
        )}
        
        {size !== "small" && pendingToday > 0 && (
          <div className="flex items-center gap-2 text-sm text-warning">
            <AlertCircle className="w-3 h-3" />
            <span>{pendingToday} pendente{pendingToday > 1 ? "s" : ""}</span>
          </div>
        )}
        
        {size === "large" && nextTask && (
          <div className="pt-2 border-t space-y-1">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Próxima tarefa
            </span>
            <p className="text-sm font-medium truncate">{nextTask.title}</p>
            <Badge variant="secondary" className={priorityColors[nextTask.priority as keyof typeof priorityColors]}>
              {nextTask.priority === "high" ? "Alta" : nextTask.priority === "medium" ? "Média" : "Baixa"}
            </Badge>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
