import { useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Settings, LogOut, Moon, Sun, Crown, Check, Loader2, Pencil, Mail, ListChecks, Camera, Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useNavigate } from "react-router-dom";
import { NotificationSettings } from "@/components/settings/NotificationSettings";
import { DataExport } from "@/components/settings/DataExport";
import { InstallApp } from "@/components/settings/InstallApp";
import { AccountSecurity } from "@/components/settings/AccountSecurity";
import { CategoryRulesSettings } from "@/components/settings/CategoryRulesSettings";
import { TransactionCategoriesSettings } from "@/components/settings/TransactionCategoriesSettings";
import { useTheme } from "next-themes";
import { usePlan, PLAN_LIMITS, PREMIUM_PRICE } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { SlidersFlowIcon } from "@/components/icons/LifeFlowIcons";

export default function Configuracoes() {
  const { signOut, user } = useAuth();
  const { profile, updateProfile, isUpdating, restartOnboarding, uploadAvatar, removeAvatar, isUploadingAvatar } = useProfile();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { isPremium, plan, limits, usage, premiumUntil } = usePlan();
  const reduceMotion = useReducedMotion();

  const [premiumOpen, setPremiumOpen] = useState(false);
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [name, setName] = useState(profile?.name || "");
  const avatarInputRef = useRef<HTMLInputElement>(null);

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

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      await uploadAvatar(file);
      toast.success("Foto de perfil atualizada!");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível enviar a foto");
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      await removeAvatar();
      toast.success("Foto removida");
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : "Não foi possível remover a foto");
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
            <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-gradient-to-br from-primary/[0.07] to-accent/[0.05] p-5 text-center">
              <div className="relative">
                <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-2xl font-bold text-primary-foreground">{initials}</AvatarFallback>
                </Avatar>
                {isUploadingAvatar && <span className="absolute inset-0 grid place-items-center rounded-full bg-background/70"><Loader2 className="h-6 w-6 animate-spin text-primary" /></span>}
              </div>
              <p className="mt-3 text-sm font-medium">Sua foto no LifeFlow</p>
              <p className="mt-1 text-xs text-muted-foreground">JPG, PNG ou WebP de até 5 MB.</p>
              <input ref={avatarInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleAvatarChange} />
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Button type="button" size="sm" onClick={() => avatarInputRef.current?.click()} disabled={isUploadingAvatar}>
                  <Camera className="mr-2 h-4 w-4" />{profile?.avatar_url ? "Trocar foto" : "Adicionar foto"}
                </Button>
                {profile?.avatar_url && (
                  <Button type="button" size="sm" variant="outline" onClick={handleRemoveAvatar} disabled={isUploadingAvatar} className="text-destructive hover:text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />Remover
                  </Button>
                )}
              </div>
            </div>
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
        description="Atualize seus dados, preferências e notificações."
        eyebrow="Conta"
        icon={SlidersFlowIcon}
        variant="neutral"
      />

      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="grid gap-4 lg:grid-cols-[1.05fr_1fr]"
      >
        {/* Profile */}
        <Card className="group relative overflow-hidden border-border/70 bg-gradient-to-br from-card via-card to-primary/[0.09] p-5 shadow-sm transition-all duration-300 before:absolute before:inset-x-0 before:top-0 before:h-0.5 before:bg-gradient-to-r before:from-primary before:to-accent hover:-translate-y-0.5 hover:shadow-xl sm:p-6">
          <div className="pointer-events-none absolute -right-12 -top-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl transition-transform duration-700 group-hover:scale-125" />
          <div className="flex items-start gap-4">
            <div className="relative">
              <Avatar className="h-16 w-16 border-4 border-background shadow-lg sm:h-20 sm:w-20">
                <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-xl font-bold text-primary-foreground sm:text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <button type="button" onClick={() => setEditProfileOpen(true)} className="absolute -bottom-1 -right-1 grid h-7 w-7 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow-md transition hover:scale-110" aria-label="Alterar foto de perfil">
                <Camera className="h-3.5 w-3.5" />
              </button>
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
      </motion.div>

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
        <div className="mt-3 flex flex-col gap-3 rounded-xl border border-border/60 bg-muted/25 p-3.5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"><ListChecks className="h-5 w-5" /></span>
            <div><p className="text-sm font-medium">Primeiros passos</p><p className="text-xs text-muted-foreground">Reabra o guia inicial no dashboard.</p></div>
          </div>
          <Button variant="outline" onClick={async () => {
            await restartOnboarding();
            if (user) localStorage.removeItem(`lifeflow:getting-started:hidden:${user.id}`);
            toast.success("Guia inicial reativado");
            navigate("/");
          }}>Refazer guia</Button>
        </div>
      </Card>

      {/* Notifications */}
      <NotificationSettings />

      {/* Account security */}
      <AccountSecurity />

      {/* Installable app */}
      <InstallApp />

      {/* Data portability */}
      <DataExport />

      {/* CSV category preferences */}
      <TransactionCategoriesSettings />

      <CategoryRulesSettings />

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
