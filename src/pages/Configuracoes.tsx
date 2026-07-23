import { useState } from "react";
import { motion } from "framer-motion";
import {
  Settings, LogOut, Moon, Sun, Crown, Check, Loader2, Pencil, Mail,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { useTheme } from "next-themes";
import { usePlan, PLAN_LIMITS, PREMIUM_PRICE } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";

export default function Configuracoes() {
  const { signOut, user } = useAuth();
  const { profile, updateProfile, isUpdating } = useProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isPremium, plan, limits, usage, premiumUntil } = usePlan();

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [name, setName] = useState(profile?.name || "");

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name });
      toast.success("Perfil atualizado!");
      setEditProfileOpen(false);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Erro");
    }
  };

  const limitRows = isPremium
    ? []
    : [
        { label: "Transações neste mês", used: usage.transactionsThisMonth, max: limits.transactionsPerMonth },
        { label: "Investimentos cadastrados", used: usage.investmentsCount, max: limits.investments },
        { label: "Metas ativas", used: usage.goalsCount, max: limits.goals },
      ];

  return (
    <div className="mx-auto max-w-5xl space-y-4 sm:space-y-6">
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} />

      {/* Edit profile dialog */}
      <Dialog open={editProfileOpen} onOpenChange={(o) => { setEditProfileOpen(o); if (o) setName(profile?.name || ""); }}>
        <DialogContent className="overflow-hidden border-border/70 p-0 sm:max-w-md">
          <div className="border-b border-border/60 bg-gradient-to-r from-primary/[0.09] to-accent/[0.06] p-6">
            <DialogHeader><DialogTitle className="text-xl">Editar perfil</DialogTitle></DialogHeader>
            <p className="mt-1 text-sm text-muted-foreground">Atualize como seu nome aparece no LifeFlow.</p>
          </div>
          <div className="space-y-4 p-6">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} className="h-11 bg-muted/30" />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={user?.email || ""} disabled className="h-11 bg-muted/30" />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditProfileOpen(false)}>Cancelar</Button>
              <Button className="flex-1" disabled={isUpdating} onClick={handleSaveProfile}>
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PageHeader
        title="Configurações"
        description="Personalize sua conta, aparência e a forma como o LifeFlow acompanha sua rotina."
        eyebrow="Sua experiência"
        icon={Settings}
        variant="neutral"
      />

      <div className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
        {/* Profile */}
        <Card className="relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.07] p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-primary sm:p-6">
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-background shadow-lg sm:h-20 sm:w-20">
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xl font-bold text-primary-foreground sm:text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <span className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-card bg-success" />
            </div>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Meu perfil</p>
              <h3 className="mt-1 truncate font-display text-lg font-semibold sm:text-xl">{displayName}</h3>
              <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground sm:text-sm">
                <Mail className="h-3.5 w-3.5" />{user?.email}
              </p>
              <span className={cn(
                "mt-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium",
                isPremium ? "bg-gradient-to-r from-warning to-accent text-white shadow-sm" : "border border-border/70 bg-background/60 text-muted-foreground",
              )}>
                {isPremium && <Crown className="w-3 h-3" />}
                {isPremium ? "LifeFlow Premium" : "Plano Gratuito"}
              </span>
            </div>
            <Button variant="outline" size="sm" className="h-9 rounded-lg bg-background/50" onClick={() => setEditProfileOpen(true)}>
              <Pencil className="mr-1.5 h-3.5 w-3.5" /><span className="hidden sm:inline">Editar</span>
            </Button>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2 border-t border-border/60 pt-4">
            <div className="rounded-xl bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Conta</p>
              <p className="mt-0.5 text-sm font-semibold">Ativa</p>
            </div>
            <div className="rounded-xl bg-muted/30 px-3 py-2.5">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tema atual</p>
              <p className="mt-0.5 text-sm font-semibold">{theme === "dark" ? "Escuro" : "Claro"}</p>
            </div>
          </div>
        </Card>

        {/* Premium plan card */}
        <Card className={cn(
          "relative overflow-hidden border p-5 shadow-sm before:absolute before:inset-x-0 before:top-0 before:h-0.5 sm:p-6",
          isPremium ? "border-warning/30 bg-gradient-to-br from-warning/[0.09] via-card to-accent/[0.06] before:bg-warning" : "border-primary/20 bg-gradient-to-br from-primary/[0.07] via-card to-accent/[0.045] before:bg-accent",
        )}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm",
              isPremium ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
            )}>
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">Seu plano</p>
              <h3 className="mt-0.5 font-display text-lg font-semibold">LifeFlow Premium</h3>
              <p className="text-xs text-muted-foreground">
                {isPremium
                  ? `Ativo${premiumUntil ? ` até ${new Date(premiumUntil).toLocaleDateString("pt-BR")}` : ""}`
                  : `R$ ${PREMIUM_PRICE.toFixed(2).replace(".", ",")}/mês — desbloqueie todos os recursos`}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setPremiumOpen(true)}
            className={cn("rounded-lg", !isPremium && "bg-gradient-to-r from-primary to-accent text-primary-foreground")}>
            {isPremium ? "Gerenciar" : "Ativar"}
          </Button>
        </div>

        {!isPremium && (
          <div className="space-y-3 mt-3">
            {limitRows.map((row) => {
              const pct = row.max === Infinity ? 0 : Math.min(100, (row.used / row.max) * 100);
              const danger = row.used >= row.max;
              return (
                <div key={row.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{row.label}</span>
                    <span className={cn("font-medium", danger ? "text-destructive" : "")}>
                      {row.used} / {row.max}
                    </span>
                  </div>
                  <Progress value={pct} className={cn("h-2", danger && "[&>div]:bg-destructive")} />
                </div>
              );
            })}
            <p className="text-[11px] text-muted-foreground italic">
              Atinja Premium para transações, investimentos e metas ilimitados e relatórios avançados.
            </p>
          </div>
        )}

        {isPremium && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {["Transações ilimitadas", "Investimentos ilimitados", "Metas ilimitadas", "Relatórios avançados"].map((f) => (
              <div key={f} className="flex items-center gap-1.5 text-xs">
                <Check className="w-3.5 h-3.5 text-success" />
                <span className="truncate">{f}</span>
              </div>
            ))}
          </div>
        )}
        </Card>
      </div>

      {/* Quick Settings */}
      <Card className="overflow-hidden border-border/70 bg-card/80 p-5 shadow-sm sm:p-6">
        <div className="mb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Personalização</p>
          <h3 className="mt-1 font-display text-lg font-semibold">Aparência</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">Escolha o tema mais confortável para sua rotina.</p>
        </div>
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/25 p-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              {theme === "dark" ? <Moon className="h-5 w-5 text-primary" /> : <Sun className="h-5 w-5 text-warning" />}
            </div>
            <div>
              <p className="text-sm font-medium">Modo escuro</p>
              <p className="text-xs text-muted-foreground">{theme === "dark" ? "Ativado" : "Desativado"}</p>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
        </div>
      </Card>

      {/* Notifications */}
      <NotificationSettings />

      {/* Logout */}
      <Card className="flex flex-col gap-3 border-destructive/15 bg-destructive/[0.035] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Encerrar sessão</p>
          <p className="text-xs text-muted-foreground">Você precisará entrar novamente para acessar seus dados.</p>
        </div>
        <Button
          variant="outline"
          className="border-destructive/25 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Sair da conta
        </Button>
      </Card>
    </div>
  );
}
