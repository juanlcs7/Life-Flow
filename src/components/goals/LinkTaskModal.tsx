import { useState, useMemo } from "react";
import { Check, Search, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  goal_id: string | null;
}

interface LinkTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goalId: string;
  goalTitle: string;
  tasks: Task[];
  onLink: (taskId: string, goalId: string | null) => Promise<void>;
}

export function LinkTaskModal({ open, onOpenChange, goalId, goalTitle, tasks, onLink }: LinkTaskModalProps) {
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => 
      t.title.toLowerCase().includes(search.toLowerCase()) &&
      (t.goal_id === null || t.goal_id === goalId)
    );
  }, [tasks, search, goalId]);

  const linkedTasks = filteredTasks.filter(t => t.goal_id === goalId);
  const availableTasks = filteredTasks.filter(t => t.goal_id === null);

  const handleToggleLink = async (task: Task) => {
    setLoading(task.id);
    try {
      if (task.goal_id === goalId) {
        await onLink(task.id, null);
      } else {
        await onLink(task.id, goalId);
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Vincular Tarefas à Meta</DialogTitle>
          <p className="text-sm text-muted-foreground">{goalTitle}</p>
        </DialogHeader>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar tarefas..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 mt-2">
          {linkedTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Vinculadas ({linkedTasks.length})</p>
              {linkedTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleToggleLink(task)}
                  disabled={loading === task.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    "bg-primary/5 border-primary/20 hover:bg-primary/10"
                  )}
                >
                  <div className="w-5 h-5 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                    <Check className="w-3 h-3 text-primary-foreground" />
                  </div>
                  <span className={cn("text-sm flex-1", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {availableTasks.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase">Disponíveis ({availableTasks.length})</p>
              {availableTasks.map(task => (
                <button
                  key={task.id}
                  onClick={() => handleToggleLink(task)}
                  disabled={loading === task.id}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg border transition-colors text-left",
                    "border-border hover:bg-muted/50"
                  )}
                >
                  <Circle className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                  <span className={cn("text-sm flex-1", task.completed && "line-through text-muted-foreground")}>
                    {task.title}
                  </span>
                </button>
              ))}
            </div>
          )}

          {filteredTasks.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhuma tarefa encontrada</p>
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
