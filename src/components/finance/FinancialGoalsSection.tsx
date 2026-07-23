import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { Plus, Target, Loader2, Minus, Wallet, Banknote, PiggyBank, CreditCard } from "lucide-react";
import { FinancialGoal } from "@/hooks/useFinancialGoals";
import { Account } from "@/hooks/useAccounts";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface FinancialGoalsSectionProps {
  goals: FinancialGoal[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (goal: FinancialGoal) => void;
  onDelete: (id: string) => void;
  onAddToGoal: (goal: FinancialGoal) => void;
  onWithdraw: (id: string, amount: number, accountId?: string) => Promise<void>;
  accounts: Account[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Banknote,
  savings: PiggyBank,
  wallet: Wallet,
  credit_card: CreditCard,
};

export function FinancialGoalsSection({
  goals,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onAddToGoal,
  onWithdraw,
  accounts,
}: FinancialGoalsSectionProps) {
  const [withdrawModalOpen, setWithdrawModalOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<FinancialGoal | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawAccountId, setWithdrawAccountId] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdraw = async () => {
    if (!selectedGoal || !withdrawAmount || !withdrawAccountId) return;
    setIsWithdrawing(true);
    try {
      await onWithdraw(selectedGoal.id, parseFloat(withdrawAmount), withdrawAccountId);
      setWithdrawModalOpen(false);
      setWithdrawAmount("");
      setWithdrawAccountId("");
      setSelectedGoal(null);
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Withdraw Modal */}
      <Dialog open={withdrawModalOpen} onOpenChange={setWithdrawModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Resgatar da Meta</DialogTitle>
          </DialogHeader>
          {selectedGoal && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium">{selectedGoal.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">
                  Disponível: R$ {selectedGoal.current_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Conta de destino</Label>
                <Select value={withdrawAccountId} onValueChange={setWithdrawAccountId}>
                  <SelectTrigger className="h-12 text-base">
                    <SelectValue placeholder="Selecione uma conta" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover">
                    {accounts.map((acc) => {
                      const IconComponent = iconMap[acc.type] || Wallet;
                      return (
                        <SelectItem key={acc.id} value={acc.id} className="py-3">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4" />
                            <span>{acc.name}</span>
                            <span className="text-muted-foreground text-xs ml-1">
                              (R$ {acc.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                            </span>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="withdraw-amount">Valor a resgatar</Label>
                <Input
                  id="withdraw-amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={selectedGoal.current_amount}
                  placeholder="100,00"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setWithdrawModalOpen(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawAmount || !withdrawAccountId || parseFloat(withdrawAmount) <= 0 || parseFloat(withdrawAmount) > selectedGoal.current_amount}
                  className="flex-1"
                >
                  {isWithdrawing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Resgatar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm sm:text-base flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" />
            Metas Financeiras
          </h3>
          <Button size="sm" variant="outline" onClick={onAdd} className="h-8 active:scale-95">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Nova Meta</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Target className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma meta criada</p>
            <Button variant="link" className="mt-2" onClick={onAdd}>
              Criar primeira meta
            </Button>
          </div>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {goals.map((goal) => {
              const progress = Math.min((goal.current_amount / goal.target_amount) * 100, 100);
              const daysLeft = goal.deadline 
                ? differenceInDays(parseISO(goal.deadline), new Date())
                : null;

              return (
                <div
                  key={goal.id}
                  className="p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{goal.name}</p>
                        {progress >= 100 && (
                          <span className="text-xs bg-success/20 text-success px-2 py-0.5 rounded-full">
                            Concluída!
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-muted-foreground">
                          R$ {goal.current_amount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })} / R$ {goal.target_amount.toLocaleString("pt-BR", { minimumFractionDigits: 0 })}
                        </span>
                        {daysLeft !== null && daysLeft > 0 && (
                          <span className="text-xs text-muted-foreground">
                            • {daysLeft} dias restantes
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onAddToGoal(goal)}
                        className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Aportar
                      </Button>
                      {goal.current_amount > 0 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSelectedGoal(goal);
                            setWithdrawModalOpen(true);
                          }}
                          className="h-7 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                        >
                          <Minus className="w-3 h-3 mr-1" />
                          Resgatar
                        </Button>
                      )}
                      <ContextActionMenu
                        onEdit={() => onEdit(goal)}
                        onDelete={() => onDelete(goal.id)}
                      />
                    </div>
                  </div>
                  <Progress value={progress} className="h-2 mt-2" />
                  <p className="text-xs text-right mt-1 text-muted-foreground">
                    {progress.toFixed(0)}%
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </motion.div>
  );
}