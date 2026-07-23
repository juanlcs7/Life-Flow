import { CalendarDays, Clock } from "lucide-react";
import { format, isToday, isTomorrow, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardCard } from "../DashboardCard";
import { useTasks } from "@/hooks/useTasks";
import { Badge } from "@/components/ui/badge";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface AgendaCardProps {
  size?: CardSize;
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}

export function AgendaCard({ size = "medium", delay = 0, isCustomizing, dragHandleProps }: AgendaCardProps) {
  const { tasks } = useTasks();

  const today = new Date().toISOString().split("T")[0];
  
  // Get upcoming tasks as events
  const upcomingTasks = tasks
    .filter((t) => !t.completed && t.due_date >= today)
    .sort((a, b) => {
      const dateCompare = a.due_date.localeCompare(b.due_date);
      if (dateCompare !== 0) return dateCompare;
      if (a.due_time && b.due_time) return a.due_time.localeCompare(b.due_time);
      if (a.due_time) return -1;
      if (b.due_time) return 1;
      return 0;
    })
    .slice(0, size === "large" ? 4 : 2);

  const formatEventDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return "Hoje";
    if (isTomorrow(date)) return "Amanhã";
    return format(date, "dd/MM", { locale: ptBR });
  };

  const nextEvent = upcomingTasks[0];

  return (
    <DashboardCard
      title="Agenda"
      icon={CalendarDays}
      href="/agenda"
      variant="agenda"
      size={size}
      delay={delay}
      isCustomizing={isCustomizing}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        {nextEvent ? (
          <>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Próximo evento
              </span>
              <p className="text-sm font-medium truncate">{nextEvent.title}</p>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatEventDate(nextEvent.due_date)}
                </Badge>
                {nextEvent.due_time && (
                  <span className="text-xs text-muted-foreground">
                    {nextEvent.due_time.slice(0, 5)}
                  </span>
                )}
              </div>
            </div>
            
            {size !== "small" && upcomingTasks.length > 1 && (
              <div className="pt-2 border-t space-y-2">
                {upcomingTasks.slice(1).map((task) => (
                  <div key={task.id} className="flex items-center justify-between text-sm">
                    <span className="truncate flex-1">{task.title}</span>
                    <Badge variant="outline" className="text-xs ml-2">
                      {formatEventDate(task.due_date)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Nenhum evento próximo</p>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
