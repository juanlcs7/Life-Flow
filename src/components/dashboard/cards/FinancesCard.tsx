import { Wallet, TrendingUp, TrendingDown, PiggyBank } from "lucide-react";
import { DashboardCard } from "../DashboardCard";
import { useTransactions } from "@/hooks/useTransactions";
import { useAccounts } from "@/hooks/useAccounts";
import { useFinancialGoals } from "@/hooks/useFinancialGoals";
import type { CardSize } from "@/hooks/useDashboardPreferences";

interface FinancesCardProps {
  size?: CardSize;
  delay?: number;
  isCustomizing?: boolean;
  dragHandleProps?: object;
}

export function FinancesCard({ size = "medium", delay = 0, isCustomizing, dragHandleProps }: FinancesCardProps) {
  const { transactions } = useTransactions();
  const { accounts } = useAccounts();
  const { totalSavings } = useFinancialGoals();

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];

  const monthlyIncome = transactions
    .filter((t) => t.type === "income" && t.date >= monthStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyExpenses = transactions
    .filter((t) => t.type === "expense" && t.date >= monthStart)
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalBalance = accounts.reduce((sum, acc) => sum + Number(acc.balance), 0);

  const formatCurrency = (value: number) =>
    value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  return (
    <DashboardCard
      title="Finanças"
      icon={Wallet}
      href="/financas"
      variant="finance"
      size={size}
      delay={delay}
      isCustomizing={isCustomizing}
      dragHandleProps={dragHandleProps}
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Saldo Total</span>
          <span className="text-lg font-bold text-foreground">{formatCurrency(totalBalance)}</span>
        </div>
        
        {size !== "small" && (
          <>
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-health">
                <TrendingUp className="w-3 h-3" />
                <span>Receitas</span>
              </div>
              <span className="font-medium">{formatCurrency(monthlyIncome)}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-1 text-destructive">
                <TrendingDown className="w-3 h-3" />
                <span>Despesas</span>
              </div>
              <span className="font-medium">{formatCurrency(monthlyExpenses)}</span>
            </div>
          </>
        )}
        
        {size === "large" && (
          <div className="flex items-center justify-between text-sm pt-2 border-t">
            <div className="flex items-center gap-1 text-primary">
              <PiggyBank className="w-3 h-3" />
              <span>Poupança</span>
            </div>
            <span className="font-medium">{formatCurrency(totalSavings)}</span>
          </div>
        )}
      </div>
    </DashboardCard>
  );
}
