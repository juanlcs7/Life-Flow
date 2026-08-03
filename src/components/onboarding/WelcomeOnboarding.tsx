import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, HeartPulse, Loader2, Target, WalletCards } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useDashboardPreferences, type CardId } from "@/hooks/useDashboardPreferences";
import { useProfile } from "@/hooks/useProfile";
import { cn } from "@/lib/utils";

const modules: Array<{ id: CardId; label: string; description: string; icon: typeof WalletCards }> = [
  { id: "finances", label: "Organizar finanças", description: "Contas, transações e orçamento", icon: WalletCards },
  { id: "tasks", label: "Planejar tarefas", description: "Prioridades e rotina", icon: Check },
  { id: "goals", label: "Acompanhar metas", description: "Objetivos pessoais e financeiros", icon: Target },
  { id: "health", label: "Cuidar da saúde", description: "Hábitos e consistência", icon: HeartPulse },
  { id: "agenda", label: "Usar a agenda", description: "Eventos, datas e lembretes", icon: CalendarDays },
];

export function WelcomeOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { savePreferences, isSaving } = useDashboardPreferences();
  const { profile, isLoading, completeOnboarding } = useProfile();
  const [dismissed, setDismissed] = useState(false);
  const [selected, setSelected] = useState<CardId[]>(["finances", "tasks", "goals"]);

  useEffect(() => setDismissed(false), [user?.id, profile?.onboarding_completed_at]);
  const open = Boolean(user && !isLoading && profile && !profile.onboarding_completed_at && !dismissed);

  const visibleCards = useMemo<CardId[]>(
    () => Array.from(new Set([...selected, "history"])),
    [selected],
  );

  const toggle = (id: CardId) => {
    setSelected((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const finish = async () => {
    if (!user || selected.length === 0) return;
    const order: CardId[] = ["finances", "tasks", "goals", "health", "agenda", "history"];
    await savePreferences({
      card_order: order,
      visible_cards: visibleCards,
      card_sizes: { finances: "medium", tasks: "medium", goals: "medium", health: "small", agenda: "small", history: "small" },
    });
    await completeOnboarding();
    setDismissed(true);
    navigate("/");
  };

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) setDismissed(true); }}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl">Vamos montar seu LifeFlow</DialogTitle>
          <p className="text-sm text-muted-foreground">Escolha o que você quer acompanhar primeiro. Você poderá mudar tudo depois.</p>
        </DialogHeader>
        <div className="grid gap-3 py-2 sm:grid-cols-2">
          {modules.map((module) => {
            const Icon = module.icon;
            const active = selected.includes(module.id);
            return (
              <button
                key={module.id}
                type="button"
                aria-pressed={active}
                onClick={() => toggle(module.id)}
                className={cn("flex items-start gap-3 rounded-xl border p-4 text-left transition", active ? "border-primary bg-primary/5" : "border-border hover:bg-muted/40")}
              >
                <span className={cn("grid h-10 w-10 shrink-0 place-items-center rounded-lg", active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>
                  <Icon className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{module.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{module.description}</span>
                </span>
                {active && <Check className="h-4 w-4 text-primary" />}
              </button>
            );
          })}
        </div>
        <div className="rounded-xl bg-muted/40 p-4 text-sm">
          <p className="font-medium">Seus primeiros passos</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            <li>Cadastre uma conta ou carteira.</li>
            <li>Registre sua primeira tarefa ou transação.</li>
            <li>Personalize os cards do dashboard quando quiser.</li>
          </ol>
        </div>
        <Button onClick={finish} disabled={selected.length === 0 || isSaving} className="w-full">
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Preparar meu dashboard
        </Button>
      </DialogContent>
    </Dialog>
  );
}
