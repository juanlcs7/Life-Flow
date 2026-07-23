import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface MonthSelectorProps {
  selectedMonth: Date;
  onMonthChange: (date: Date) => void;
}

export function MonthSelector({ selectedMonth, onMonthChange }: MonthSelectorProps) {
  const isCurrentMonth = format(selectedMonth, "yyyy-MM") === format(new Date(), "yyyy-MM");

  return (
    <div className="flex items-center gap-1 rounded-xl border border-border/70 bg-card/80 p-1 shadow-sm backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
        onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex min-w-[148px] items-center justify-center gap-2 px-3">
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10">
          <Calendar className="w-3.5 h-3.5 text-primary" />
        </span>
        <span className="text-sm font-semibold capitalize tracking-tight">
          {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary"
        onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
