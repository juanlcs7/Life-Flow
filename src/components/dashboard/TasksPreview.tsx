import { motion } from "framer-motion";
import { Check, Circle, Clock, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";
import { useTasks } from "@/hooks/useTasks";

const priorityColors = {
  high: "bg-destructive/10 text-destructive",
  medium: "bg-warning/10 text-warning",
  low: "bg-muted text-muted-foreground",
};

export function TasksPreview() {
  const { tasks, isLoading, toggleTask } = useTasks();

  const todayStr = new Date().toISOString().split("T")[0];
  const todayTasks = tasks
    .filter(t => t.due_date === todayStr)
    .slice(0, 5);

  const handleToggle = async (id: string, completed: boolean) => {
    await toggleTask({ id, completed: !completed });
  };

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
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
      transition={{ duration: 0.4, delay: 0.4 }}
      className="bg-card rounded-xl p-5 shadow-card border border-border"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-foreground">Tarefas de Hoje</h3>
        <Link to="/agenda" className="text-sm text-primary hover:underline flex items-center gap-1">
          Ver todas <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
      {todayTasks.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>Nenhuma tarefa para hoje</p>
          <Link to="/agenda" className="text-sm text-primary hover:underline mt-2 inline-block">
            Adicionar tarefa
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {todayTasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg transition-colors hover:bg-muted/50",
                task.completed && "opacity-60"
              )}
            >
              <button 
                className="flex-shrink-0"
                onClick={() => handleToggle(task.id, task.completed)}
              >
                {task.completed ? (
                  <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center">
                    <Check className="w-3 h-3 text-success-foreground" />
                  </div>
                ) : (
                  <Circle className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
              </button>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  "text-sm font-medium truncate",
                  task.completed && "line-through text-muted-foreground"
                )}>
                  {task.title}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  priorityColors[task.priority as keyof typeof priorityColors]
                )}>
                  {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                </span>
                {task.due_time && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    {task.due_time.substring(0, 5)}
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
