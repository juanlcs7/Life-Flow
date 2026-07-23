import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, TrendingUp, TrendingDown, Loader2, PiggyBank, Building2, LineChart, Briefcase, Coins, Sparkles, ArrowDownUp } from "lucide-react";
import { Investment, useInvestments } from "@/hooks/useInvestments";
import { Account } from "@/hooks/useAccounts";
import { InvestmentModal } from "./InvestmentModal";
import { InvestmentTransactionModal } from "./InvestmentTransactionModal";
import { ContextActionMenu } from "@/components/ui/context-action-menu";
import { toast } from "sonner";
import { usePlan } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";

const typeMeta: Record<string, { label: string; icon: any; color: string }> = {
  poupanca: { label: "Poupança", icon: PiggyBank, color: "text-info" },
  renda_fixa: { label: "Renda Fixa", icon: Building2, color: "text-success" },
  renda_variavel: { label: "Renda Variável", icon: LineChart, color: "text-warning" },
  fundos: { label: "Fundos", icon: Briefcase, color: "text-primary" },
  cripto: { label: "Cripto", icon: Sparkles, color: "text-accent" },
  outros: { label: "Outros", icon: Coins, color: "text-muted-foreground" },
};

interface Props {
  accounts: Account[];
}

export function InvestmentsSection({ accounts }: Props) {
  const { investments, isLoading, addInvestment, updateInvestment, deleteInvestment, addTransaction } = useInvestments();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Investment | null>(null);
  const [txOpen, setTxOpen] = useState(false);
  const [txInvestment, setTxInvestment] = useState<Investment | null>(null);
  const { isPremium, canAddInvestment, limits, usage } = usePlan();
  const [premiumOpen, setPremiumOpen] = useState(false);

  const handleNew = () => {
    if (!canAddInvestment) { setPremiumOpen(true); return; }
    setEditing(null); setModalOpen(true);
  };

  const fmt = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const periodLabel = (p: string) => p === "daily" ? "a.d." : p === "monthly" ? "a.m." : "a.a.";

  const handleSubmit = async (data: any) => {
    try {
      if (editing) {
        await updateInvestment({ id: editing.id, ...data });
        toast.success("Investimento atualizado!");
      } else {
        await addInvestment(data);
        toast.success("Investimento criado!");
      }
      setEditing(null);
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  const handleTx = async (data: any) => {
    try {
      await addTransaction(data);
      toast.success(data.type === "deposit" ? "Aporte realizado!" : "Resgate realizado!");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    }
  };

  return (
    <Card className="h-full overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-success/[0.025] p-4 shadow-sm sm:p-5">
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen}
        reason={`Plano gratuito permite ${limits.investments} investimentos. Você já tem ${usage.investmentsCount}.`} />
      <InvestmentModal open={modalOpen} onOpenChange={(o) => { setModalOpen(o); if (!o) setEditing(null); }} onSubmit={handleSubmit} editData={editing} accounts={accounts} />
      <InvestmentTransactionModal open={txOpen} onOpenChange={setTxOpen} onSubmit={handleTx} investment={txInvestment} accounts={accounts} />

      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-semibold text-sm sm:text-base">Investimentos</h3>
        <Button size="sm" onClick={handleNew}>
          <Plus className="w-4 h-4 mr-1" />Novo
        </Button>
      </div>

      {!isPremium && (
        <p className="text-[11px] text-muted-foreground mb-2">
          Plano Gratuito: {usage.investmentsCount} / {limits.investments} investimentos.
        </p>
      )}

      {isLoading ? (
        <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : investments.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">
          <Briefcase className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Nenhum investimento cadastrado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {investments.map((inv, i) => {
            const meta = typeMeta[inv.type] || typeMeta.outros;
            const Icon = meta.icon;
            const profit = Number(inv.current_value) - Number(inv.initial_value);
            const pct = inv.initial_value > 0 ? (profit / Number(inv.initial_value)) * 100 : 0;
            return (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="rounded-xl border border-border/60 bg-muted/20 p-3.5 transition-all hover:border-success/20 hover:bg-success/[0.035]">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 ${meta.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm truncate">{inv.name}</p>
                      <ContextActionMenu
                        onEdit={() => { setEditing(inv); setModalOpen(true); }}
                        onDelete={() => { deleteInvestment(inv.id); toast.success("Excluído!"); }}
                      />
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{meta.label}</Badge>
                      {inv.yield_rate > 0 && (
                        <span className="text-[10px] text-muted-foreground">
                          {Number(inv.yield_rate).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}% {periodLabel(inv.yield_period)}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-2 text-[11px]">
                      <div>
                        <p className="text-muted-foreground">Investido</p>
                        <p className="font-medium">{fmt(Number(inv.initial_value))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Atual</p>
                        <p className="font-medium">{fmt(Number(inv.current_value))}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Lucro</p>
                        <p className={`font-semibold flex items-center gap-0.5 ${profit >= 0 ? "text-success" : "text-destructive"}`}>
                          {profit >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {pct.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant="ghost" className="h-7 text-xs mt-1.5 px-2"
                      onClick={() => { setTxInvestment(inv); setTxOpen(true); }}>
                      <ArrowDownUp className="w-3 h-3 mr-1" />Aporte / Resgate
                    </Button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
