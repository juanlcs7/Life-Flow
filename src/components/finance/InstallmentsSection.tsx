import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { Plus, CreditCard, Loader2, Zap } from "lucide-react";
import { Installment, InstallmentPayment } from "@/hooks/useInstallments";
import { format, parseISO, isBefore, isAfter, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";

interface InstallmentsSectionProps {
  installments: Installment[];
  payments: InstallmentPayment[];
  monthlyImpact: number;
  isLoading: boolean;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onMarkPaid: (paymentId: string, paid: boolean) => void;
}

export function InstallmentsSection({
  installments,
  payments,
  monthlyImpact,
  isLoading,
  onAdd,
  onDelete,
  onMarkPaid,
}: InstallmentsSectionProps) {
  const currentMonth = new Date();
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Get this month's payments
  const thisMonthPayments = payments.filter(p => {
    const date = parseISO(p.due_date);
    return date >= monthStart && date <= monthEnd;
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className="h-full overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-warning/[0.025] p-4 shadow-sm sm:p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-sm sm:text-base flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-primary" />
            Parcelamentos
          </h3>
          <Button size="sm" variant="outline" onClick={onAdd} className="h-8 active:scale-95">
            <Plus className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Novo</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : installments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CreditCard className="w-10 h-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhum parcelamento ativo</p>
            <Button variant="link" className="mt-2" onClick={onAdd}>
              Registrar parcelamento
            </Button>
          </div>
        ) : (
          <>
            {/* Monthly Impact */}
            <div className="mb-4 rounded-xl border border-warning/15 bg-warning/[0.08] p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-sm">Impacto mensal</span>
                <span className="font-bold text-warning">
                  R$ {monthlyImpact.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* This month's payments */}
            {thisMonthPayments.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2">Parcelas deste mês</p>
                <div className="space-y-2">
                  {thisMonthPayments.map(payment => {
                    const installment = installments.find(i => i.id === payment.installment_id);
                    if (!installment) return null;
                    
                    return (
                      <div
                        key={payment.id}
                        className={`flex items-center justify-between rounded-xl border p-3 ${payment.paid ? "border-success/15 bg-success/[0.07]" : "border-border/50 bg-muted/30"}`}
                      >
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={payment.paid}
                            onCheckedChange={(checked) => onMarkPaid(payment.id, !!checked)}
                          />
                          <div>
                            <p className={`text-sm ${payment.paid ? "line-through text-muted-foreground" : ""}`}>
                              {installment.description} ({payment.payment_number}/{installment.installment_count})
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Vence {format(parseISO(payment.due_date), "dd/MM")}
                            </p>
                          </div>
                        </div>
                        <span className={`text-sm font-medium ${payment.paid ? "text-success" : ""}`}>
                          R$ {payment.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Installments list */}
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {installments.map((inst) => {
                const paidCount = payments.filter(p => p.installment_id === inst.id && p.paid).length;
                
                return (
                  <div
                    key={inst.id}
                    className="group flex items-center justify-between rounded-lg px-2 py-2.5 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium truncate">{inst.description}</p>
                        {(inst as any).auto_debit && inst.account_id && (
                          <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded flex items-center gap-0.5 flex-shrink-0">
                            <Zap className="w-2.5 h-2.5" /> Auto
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {paidCount}/{inst.installment_count} pagas • R$ {inst.installment_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}/mês
                      </p>
                    </div>
                    <ContextActionMenu
                      onDelete={() => onDelete(inst.id)}
                    />
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
