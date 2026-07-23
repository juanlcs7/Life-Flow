import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useGoalContributions, GoalContribution } from "@/hooks/useGoalContributions";
import { FinancialGoal } from "@/hooks/useFinancialGoals";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface ContributionHistoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  goal: FinancialGoal | null;
}

export function ContributionHistoryModal({ open, onOpenChange, goal }: ContributionHistoryModalProps) {
  const { contributions, isLoading } = useGoalContributions(goal?.id);

  if (!goal) return null;

  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Histórico de Aportes</DialogTitle>
        </DialogHeader>

        {/* Goal summary */}
        <div className="p-4 bg-muted rounded-lg space-y-3">
          <h4 className="font-medium">{goal.name}</h4>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Progresso</span>
              <span className="font-medium">
                R$ {goal.current_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R$ {goal.target_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <Progress value={Math.min(progress, 100)} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">
              {remaining > 0 ? `Faltam R$ ${remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "Meta atingida! 🎉"}
            </p>
          </div>
        </div>

        {/* Contributions list */}
        <div className="flex-1 overflow-y-auto mt-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : contributions.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Nenhum aporte registrado</p>
              <p className="text-xs mt-1">Adicione valores à meta para ver o histórico aqui</p>
            </div>
          ) : (
            <div className="space-y-2">
              {contributions.map((contribution) => (
                <ContributionItem key={contribution.id} contribution={contribution} />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ContributionItem({ contribution }: { contribution: GoalContribution }) {
  const isDeposit = contribution.type === "deposit";

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
      <div className={cn(
        "w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0",
        isDeposit ? "bg-success/10" : "bg-warning/10"
      )}>
        {isDeposit ? (
          <TrendingUp className="w-4 h-4 text-success" />
        ) : (
          <TrendingDown className="w-4 h-4 text-warning" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          {isDeposit ? "Aporte" : "Resgate"}
        </p>
        {contribution.note && (
          <p className="text-xs text-muted-foreground truncate">{contribution.note}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(parseISO(contribution.created_at), "dd MMM yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>
      <p className={cn(
        "font-semibold text-sm",
        isDeposit ? "text-success" : "text-warning"
      )}>
        {isDeposit ? "+" : "-"}R$ {contribution.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
