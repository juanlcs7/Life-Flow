import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { Plus, Wallet, PiggyBank, CreditCard, Banknote, ArrowRightLeft, Loader2 } from "lucide-react";
import { Account } from "@/hooks/useAccounts";

interface AccountsSectionProps {
  accounts: Account[];
  totalBalance: number;
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (account: Account) => void;
  onDelete: (id: string) => void;
  onTransfer: () => void;
}

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  checking: Banknote,
  savings: PiggyBank,
  wallet: Wallet,
  credit_card: CreditCard,
};

export function AccountsSection({
  accounts,
  totalBalance,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onTransfer,
}: AccountsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="group relative h-full overflow-hidden rounded-[1.6rem] border-finance/15 bg-gradient-to-br from-card via-card to-finance/[0.055] p-4 shadow-sm transition-all hover:shadow-xl sm:p-5">
        <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-finance/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm sm:text-base flex items-center gap-2">
            <Wallet className="w-4 h-4 text-primary" />
            Contas e Carteiras
          </h3>
          <div className="flex gap-1">
            {accounts.length >= 2 && (
              <Button size="sm" variant="ghost" onClick={onTransfer} className="h-8 px-2 active:scale-95">
                <ArrowRightLeft className="w-4 h-4" />
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={onAdd} className="h-8 active:scale-95">
              <Plus className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Nova Conta</span>
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Wallet className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma conta cadastrada</p>
            <Button variant="link" className="mt-2" onClick={onAdd}>
              Adicionar primeira conta
            </Button>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {accounts.map((account) => {
                const IconComponent = iconMap[account.type] || Wallet;
                return (
                  <div
                    key={account.id}
                    className="group/item flex items-center justify-between rounded-2xl border border-border/45 bg-background/60 p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-finance/20 hover:bg-finance/[0.04] hover:shadow-md motion-reduce:hover:translate-y-0"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl ${account.color} flex items-center justify-center shadow-sm`}>
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {account.type === "checking" && "Conta Corrente"}
                          {account.type === "savings" && "Poupança"}
                          {account.type === "wallet" && "Carteira"}
                          {account.type === "credit_card" && "Cartão de Crédito"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className={`font-semibold text-sm ${account.balance >= 0 ? "text-success" : "text-destructive"}`}>
                        R$ {account.balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </p>
                      <ContextActionMenu
                        onEdit={() => onEdit(account)}
                        onDelete={() => onDelete(account.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="mt-4 rounded-2xl border border-success/15 bg-gradient-to-r from-success/[0.1] to-finance/[0.04] px-4 py-3.5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Saldo Total</span>
                <span className={`font-bold ${totalBalance >= 0 ? "text-success" : "text-destructive"}`}>
                  R$ {totalBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
