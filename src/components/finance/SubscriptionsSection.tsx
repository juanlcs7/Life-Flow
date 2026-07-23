import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { Plus, RefreshCw, Loader2, AlertCircle, Zap, CheckCircle2 } from "lucide-react";
import { Subscription } from "@/hooks/useSubscriptions";
import { format, parseISO, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SubscriptionsSectionProps {
  subscriptions: Subscription[];
  monthlyCost: number;
  upcomingRenewals: Subscription[];
  isLoading: boolean;
  onAdd: () => void;
  onEdit: (subscription: Subscription) => void;
  onDelete: (id: string) => void;
  onPay?: (id: string) => void;
  payingId?: string | null;
}

const frequencyLabels: Record<string, string> = {
  weekly: "Semanal",
  monthly: "Mensal",
  yearly: "Anual",
};

export function SubscriptionsSection({
  subscriptions,
  monthlyCost,
  upcomingRenewals,
  isLoading,
  onAdd,
  onEdit,
  onDelete,
  onPay,
  payingId,
}: SubscriptionsSectionProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm sm:text-base flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-primary" />
            Assinaturas
          </h3>
          <Button size="sm" variant="outline" onClick={onAdd} className="h-8 active:scale-95">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Nova</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <RefreshCw className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma assinatura ativa</p>
            <Button variant="link" className="mt-2" onClick={onAdd}>
              Cadastrar assinatura
            </Button>
          </div>
        ) : (
          <>
            {/* Monthly cost */}
            <div className="p-3 bg-info/10 rounded-lg mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Custo mensal estimado</span>
                <span className="font-bold text-info">
                  R$ {monthlyCost.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Upcoming renewals alert */}
            {upcomingRenewals.length > 0 && (
              <div className="p-3 bg-warning/10 rounded-lg mb-4 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-warning mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-warning">Renovações próximas</p>
                  <div className="text-xs text-muted-foreground mt-1">
                    {upcomingRenewals.map(sub => (
                      <p key={sub.id}>
                        {sub.name} - {format(parseISO(sub.next_billing_date), "dd/MM")} (R$ {sub.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })})
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subscriptions list */}
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {subscriptions.map((sub) => {
                const daysUntil = differenceInDays(parseISO(sub.next_billing_date), new Date());
                
                return (
                  <div
                    key={sub.id}
                    className={`flex items-center justify-between p-3 rounded-lg ${sub.active ? "bg-muted/50" : "bg-muted/30 opacity-60"} hover:bg-muted transition-colors group`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{sub.name}</p>
                        {!sub.active && (
                          <span className="text-xs bg-muted px-1.5 py-0.5 rounded">Inativa</span>
                        )}
                        {(sub as any).auto_debit && sub.account_id && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5" /> Auto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {frequencyLabels[sub.frequency]} • {sub.category}
                        {daysUntil >= 0 && ` • Próx: ${format(parseISO(sub.next_billing_date), "dd/MM")}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        R$ {sub.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      {onPay && sub.active && sub.account_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-[11px] active:scale-95"
                          disabled={payingId === sub.id}
                          onClick={() => onPay(sub.id)}
                        >
                          {payingId === sub.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <CheckCircle2 className="w-3 h-3 mr-1" />
                              Pagar
                            </>
                          )}
                        </Button>
                      )}
                      <ContextActionMenu
                        onEdit={() => onEdit(sub)}
                        onDelete={() => onDelete(sub.id)}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </motion.div>
  );
}
