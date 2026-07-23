import { History, ArrowRight } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { DashboardCard } from "../DashboardCard";
import { useHistoryEvents } from "@/hooks/useHistoryEvents";
import { Badge } from "@/components/ui/badge";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface HistoryCardProps {
  size?: CardSize;
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}

const eventTypeLabels = {
  finance: "Finanças",
  task: "Tarefa",
  health: "Saúde",
};

const eventTypeColors = {
  finance: "bg-finance/10 text-finance",
  task: "bg-tasks/10 text-tasks",
  health: "bg-health/10 text-health",
};

export function HistoryCard({ size = "medium", delay = 0, isCustomizing, dragHandleProps }: HistoryCardProps) {
  const { events, todaySummary } = useHistoryEvents();

  const recentEvents = events.slice(0, size === "large" ? 4 : 2);
  const lastEvent = events[0];

  return (
    <DashboardCard
      title="Histórico"
      icon={History}
      href="/historico"
      variant="history"
      size={size}
      delay={delay}
      isCustomizing={isCustomizing}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        {lastEvent ? (
          <>
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Última atividade</span>
              <p className="text-sm font-medium truncate">{lastEvent.title}</p>
              <div className="flex items-center gap-2">
                <Badge 
                  variant="secondary" 
                  className={eventTypeColors[lastEvent.event_type as keyof typeof eventTypeColors]}
                >
                  {eventTypeLabels[lastEvent.event_type as keyof typeof eventTypeLabels]}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {format(parseISO(lastEvent.created_at), "HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
            
            {size !== "small" && (
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Hoje</span>
                  <div className="flex items-center gap-3">
                    <span>{todaySummary.tasksCompleted} tarefas</span>
                    <span>{todaySummary.habitsCompleted} hábitos</span>
                  </div>
                </div>
              </div>
            )}
            
            {size === "large" && recentEvents.length > 1 && (
              <div className="space-y-2">
                {recentEvents.slice(1).map((event) => (
                  <div key={event.id} className="flex items-center gap-2 text-sm">
                    <ArrowRight className="w-3 h-3 text-muted-foreground" />
                    <span className="truncate">{event.title}</span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">Nenhuma atividade ainda</p>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
