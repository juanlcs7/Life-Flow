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
    <div className="relative flex items-center gap-1 rounded-2xl border border-finance/15 bg-background/75 p-1.5 shadow-sm backdrop-blur">
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl hover:bg-finance/10 hover:text-finance"
        onClick={() => onMonthChange(subMonths(selectedMonth, 1))}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>
      
      <div className="flex min-w-[148px] items-center justify-center gap-2 px-3">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-finance/10 shadow-sm">
          <Calendar className="w-3.5 h-3.5 text-primary" />
        </span>
        <span className="text-sm font-semibold capitalize tracking-tight">
          {format(selectedMonth, "MMMM yyyy", { locale: ptBR })}
        </span>
      </div>
      
      <Button
        variant="ghost"
        size="icon"
        className="h-9 w-9 rounded-xl hover:bg-finance/10 hover:text-finance"
        onClick={() => onMonthChange(addMonths(selectedMonth, 1))}
        disabled={isCurrentMonth}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
