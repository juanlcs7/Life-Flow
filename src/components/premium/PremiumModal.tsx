import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Check, Clock3 } from "lucide-react";
import { usePlan, PLAN_LIMITS, PREMIUM_PRICE } from "@/hooks/usePlan";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Optional context message displayed at top, e.g. "Você atingiu o limite de transações". */
  reason?: string | null;
}

const features = [
  "Transações ilimitadas por mês",
  "Investimentos ilimitados",
  "Metas ilimitadas (pessoais e financeiras)",
  "Relatórios avançados e exportações",
  "Dicas de investimento personalizadas",
  "Suporte prioritário",
];

export function PremiumModal({ open, onOpenChange, reason }: Props) {
  const { isPremium, premiumUntil } = usePlan();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-warning" />
            LifeFlow Premium
          </DialogTitle>
        </DialogHeader>

        {reason && (
          <div className="text-sm bg-warning/10 text-warning-foreground border border-warning/30 rounded-lg p-3">
            {reason}
          </div>
        )}

        <div className="rounded-xl border bg-gradient-to-br from-primary/10 to-accent/10 p-4 text-center">
          <p className="text-3xl font-bold">
            R$ {PREMIUM_PRICE.toFixed(2).replace(".", ",")}
            <span className="text-sm font-normal text-muted-foreground"> /mês</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Pagamentos reais estarão disponíveis em breve.
          </p>
        </div>

        <ul className="space-y-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2 text-sm">
              <Check className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
              <span>{f}</span>
            </li>
          ))}
        </ul>

        <div className="text-xs text-muted-foreground rounded-lg bg-muted/50 p-3">
          <p className="font-medium mb-1">Plano Gratuito inclui:</p>
          <ul className="space-y-0.5 pl-3 list-disc">
            <li>{PLAN_LIMITS.free.transactionsPerMonth} transações por mês</li>
            <li>até {PLAN_LIMITS.free.investments} investimentos cadastrados</li>
            <li>até {PLAN_LIMITS.free.goals} metas ativas</li>
            <li>relatórios avançados bloqueados</li>
          </ul>
        </div>

        {isPremium ? (
          <div className="space-y-2">
            <p className="text-xs text-center text-success">
              ✓ Você já é Premium{premiumUntil ? ` até ${new Date(premiumUntil).toLocaleDateString("pt-BR")}` : ""}
            </p>
            <Button variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </div>
        ) : (
          <Button
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
            disabled
          >
            <Clock3 className="mr-2 h-4 w-4" />
            Pagamentos em breve
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
