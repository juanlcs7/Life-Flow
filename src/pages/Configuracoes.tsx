import { useState } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Palette, Shield, HelpCircle, LogOut, Moon, Crown, Check, Loader2, Pencil,
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
    } catch (e: any) {
      toast.error(e.message || "Erro");
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
    <div className="space-y-6 max-w-3xl">
      <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} />

      {/* Edit profile dialog */}
      <Dialog open={editProfileOpen} onOpenChange={(o) => { setEditProfileOpen(o); if (o) setName(profile?.name || ""); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Editar perfil</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Nome</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input value={user?.email || ""} disabled />
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

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl lg:text-3xl font-display font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">Personalize sua experiência no LifeFlow</p>
      </motion.div>

      {/* Profile */}
      <Card className="p-5">
        <div className="flex items-center gap-4">
          <Avatar className="w-16 h-16">
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-bold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-semibold truncate">{displayName}</h3>
            <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
            <span className={cn(
              "inline-flex items-center gap-1 mt-2 text-xs px-2 py-0.5 rounded-full",
              isPremium ? "bg-gradient-to-r from-warning to-accent text-white" : "bg-muted text-muted-foreground",
            )}>
              {isPremium && <Crown className="w-3 h-3" />}
              {isPremium ? "Premium" : "Plano Gratuito"}
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={() => setEditProfileOpen(true)}>
            <Pencil className="w-3 h-3 mr-1" />Editar
          </Button>
        </div>
      </Card>

      {/* Premium plan card */}
      <Card className={cn(
        "p-5 border",
        isPremium ? "bg-gradient-to-br from-warning/5 to-accent/5 border-warning/30" : "bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20",
      )}>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn(
              "w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0",
              isPremium ? "bg-warning/15 text-warning" : "bg-primary/10 text-primary",
            )}>
              <Crown className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="font-display font-semibold">LifeFlow Premium</h3>
              <p className="text-xs text-muted-foreground">
                {isPremium
                  ? `Ativo${premiumUntil ? ` até ${new Date(premiumUntil).toLocaleDateString("pt-BR")}` : ""}`
                  : `R$ ${PREMIUM_PRICE.toFixed(2).replace(".", ",")}/mês — desbloqueie todos os recursos`}
              </p>
            </div>
          </div>
          <Button size="sm" onClick={() => setPremiumOpen(true)}
            className={isPremium ? "" : "bg-gradient-to-r from-primary to-accent text-primary-foreground"}>
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
                  <Progress value={pct} className={cn("h-1.5", danger && "[&>div]:bg-destructive")} />
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

      {/* Quick Settings */}
      <Card className="p-5">
        <h3 className="font-display font-semibold mb-4">Aparência</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <p className="font-medium text-sm">Modo Escuro</p>
              <p className="text-xs text-muted-foreground">Ativar tema escuro</p>
            </div>
          </div>
          <Switch checked={theme === "dark"} onCheckedChange={(c) => setTheme(c ? "dark" : "light")} />
        </div>
      </Card>

      {/* Notifications */}
      <NotificationSettings />

      {/* Logout */}
      <Button
        variant="ghost"
        className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={handleSignOut}
      >
        <LogOut className="w-4 h-4 mr-2" />
        Sair da conta
      </Button>
    </div>
  );
}