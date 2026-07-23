import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wallet, Banknote, PiggyBank, CreditCard } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { FinancialGoal } from "@/hooks/useFinancialGoals";
import { Account } from "@/hooks/useAccounts";

interface AddToGoalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: { id: string; amount: number; accountId?: string }) => Promise<void>;
  goal: FinancialGoal | null;
  accounts: Account[];
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Banknote,
  savings: PiggyBank,
  wallet: Wallet,
  credit_card: CreditCard,
};

export function AddToGoalModal({ open, onOpenChange, onSubmit, goal, accounts }: AddToGoalModalProps) {
  const [amount, setAmount] = useState("");
  const [accountId, setAccountId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      setAmount("");
      setAccountId("");
    }
  }, [open]);

  if (!goal) return null;

  const currentProgress = (goal.current_amount / goal.target_amount) * 100;
  const newAmount = goal.current_amount + parseFloat(amount || "0");
  const newProgress = Math.min((newAmount / goal.target_amount) * 100, 100);
  const remaining = goal.target_amount - goal.current_amount;
  const selectedAccount = accounts.find(a => a.id === accountId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    // Validate that selected account has enough balance
    if (selectedAccount && parseFloat(amount) > selectedAccount.balance) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        id: goal.id,
        amount: parseFloat(amount),
        accountId: accountId || undefined,
      });
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Meta</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="p-4 bg-muted rounded-lg space-y-3">
            <h4 className="font-medium">{goal.name}</h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progresso atual</span>
                <span className="font-medium">
                  R$ {goal.current_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R$ {goal.target_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <Progress value={currentProgress} className="h-2" />
              <p className="text-xs text-muted-foreground text-right">
                Faltam R$ {remaining.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Conta de origem</Label>
            <Select value={accountId} onValueChange={setAccountId}>
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
            {selectedAccount && (
              <p className="text-xs text-muted-foreground">
                Disponível: R$ {selectedAccount.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor a adicionar</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={selectedAccount?.balance || undefined}
              placeholder="100,00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            {selectedAccount && amount && parseFloat(amount) > selectedAccount.balance && (
              <p className="text-xs text-destructive">Saldo insuficiente na conta selecionada</p>
            )}
          </div>

          {amount && parseFloat(amount) > 0 && (
            <div className="p-3 bg-success/10 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Novo progresso</span>
                <span className="font-medium text-success">{newProgress.toFixed(1)}%</span>
              </div>
              <Progress value={newProgress} className="h-2 mt-2" />
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || !accountId || (selectedAccount && parseFloat(amount || "0") > selectedAccount.balance)} 
              className="flex-1"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}