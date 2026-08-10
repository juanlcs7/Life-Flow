import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Activity,
  LogOut,
  Sparkles,
} from "lucide-react";
import {
  AgendaFlowIcon,
  FilesFlowIcon,
  GoalFlowIcon,
  HealthFlowIcon,
  HistoryFlowIcon,
  HomeFlowIcon,
  MoneyFlowIcon,
  PeopleFlowIcon,
  SlidersFlowIcon,
  WeekFlowIcon,
} from "@/components/icons/LifeFlowIcons";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearchButton } from "@/components/search/GlobalSearch";
import { NotificationCenterButton } from "@/components/notifications/NotificationCenter";
import { usePlan } from "@/hooks/usePlan";
import { PremiumModal } from "@/components/premium/PremiumModal";

const navGroups = [
  { label: "Agora", items: [{ label: "Meu dia", icon: HomeFlowIcon, href: "/", color: "text-primary" }] },
  { label: "Seu dinheiro", items: [
    { label: "Finanças", icon: MoneyFlowIcon, href: "/financas", color: "text-finance" },
    { label: "Planejamento", icon: WeekFlowIcon, href: "/planejamento", color: "text-info" },
    { label: "Metas", icon: GoalFlowIcon, href: "/metas", color: "text-warning" },
  ] },
  { label: "Sua rotina", items: [
    { label: "Agenda", icon: AgendaFlowIcon, href: "/agenda", color: "text-tasks" },
    { label: "Saúde", icon: HealthFlowIcon, href: "/saude", color: "text-health" },
  ] },
  { label: "Seu arquivo", items: [
    { label: "Histórico", icon: HistoryFlowIcon, href: "/historico", color: "text-primary" },
    { label: "Documentos", icon: FilesFlowIcon, href: "/documentos", color: "text-documents" },
    { label: "Contatos", icon: PeopleFlowIcon, href: "/contatos", color: "text-contacts" },
  ] },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const { isPremium, usage, limits } = usePlan();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <>
    <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} />
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-4 ml-4 hidden h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-[2.25rem] border border-sidebar-border bg-sidebar/88 text-sidebar-foreground shadow-[0_30px_90px_-45px_rgba(2,8,23,.8)] backdrop-blur-2xl transition-all duration-300 lg:flex before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_15%_0%,hsl(var(--primary)/.12),transparent_28%),radial-gradient(circle_at_100%_48%,hsl(270_80%_60%/.07),transparent_28%)]",
        collapsed ? "w-[88px]" : "w-[284px]"
      )}
    >
      {/* Logo */}
      <div className="relative flex h-[88px] shrink-0 items-center gap-3 border-b border-sidebar-border px-5">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
        <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[1.05rem] bg-gradient-to-br from-primary via-cyan-500 to-violet-600 shadow-lg shadow-primary/20 ring-1 ring-white/20">
          <img src="/lifeflow-logo.png" alt="" className="h-8 w-8 object-contain drop-shadow" />
          <span className="absolute -bottom-1 -right-1 h-3.5 w-3.5 rounded-full border-[3px] border-sidebar bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,.8)]" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-display text-lg font-extrabold tracking-[-0.04em] text-sidebar-foreground">
                LifeFlow
              </h1>
              <p className="mt-0.5 text-[8px] font-bold uppercase tracking-[.16em] text-primary">Seu ritmo. Seu fluxo.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Info */}
      <div className="relative border-b border-sidebar-border p-3">
        <div className={cn("relative overflow-hidden rounded-[1.25rem] border border-sidebar-border bg-gradient-to-br from-sidebar-accent/75 via-sidebar-accent/40 to-primary/[0.08] shadow-sm", collapsed ? "p-2" : "p-3")}>
          <div className="pointer-events-none absolute -right-5 -top-7 h-16 w-16 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex items-center gap-3">
          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-primary/20 ring-offset-2 ring-offset-sidebar">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" />
            <AvatarFallback className="bg-gradient-to-br from-primary to-violet-600 text-xs font-bold text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex-1 min-w-0"
              >
                <p className="truncate text-sm font-bold text-sidebar-foreground">
                  {displayName}
                </p>
                <div className="mt-0.5 flex items-center gap-1.5"><span className={cn("h-1.5 w-1.5 rounded-full", isPremium ? "bg-amber-300" : "bg-emerald-400")} /><p className="text-[9px] font-bold uppercase tracking-[.12em] text-sidebar-muted">{isPremium ? "Premium ativo" : "Plano essencial"}</p></div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          {!collapsed && !isPremium && <div className="relative mt-3 border-t border-sidebar-border/70 pt-2.5"><div className="flex items-center justify-between text-[9px] text-sidebar-muted"><span>Movimentos no mês</span><strong className="text-sidebar-foreground">{usage.transactionsThisMonth}/{limits.transactionsPerMonth}</strong></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-black/20"><span className="block h-full rounded-full bg-gradient-to-r from-primary to-cyan-400" style={{ width: `${Math.min(100, (usage.transactionsThisMonth / limits.transactionsPerMonth) * 100)}%` }} /></div></div>}
        </div>
      </div>

      <div className="space-y-1 border-b border-sidebar-border p-3">
        <GlobalSearchButton compact={collapsed} />
        <NotificationCenterButton compact={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-3 overflow-y-auto p-3 [scrollbar-width:none]">
        {navGroups.map((group) => <div key={group.label} className="space-y-1">
        {!collapsed && <p className="mb-1.5 flex items-center gap-2 px-3 pt-1 text-[8px] font-extrabold uppercase tracking-[.2em] text-sidebar-muted/80"><span className="h-px w-3 bg-gradient-to-r from-primary/80 to-transparent" />{group.label}</p>}
        {group.items.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-3 overflow-hidden rounded-xl px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "bg-gradient-to-r from-primary/20 via-cyan-500/10 to-violet-500/[0.06] text-sidebar-foreground shadow-[inset_0_0_0_1px_hsl(var(--primary)/.12),0_8px_24px_-18px_hsl(var(--primary))]"
                  : "text-sidebar-muted hover:translate-x-0.5 hover:bg-sidebar-accent/65 hover:text-sidebar-foreground"
              )}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <><motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 via-primary to-violet-500 shadow-[0_0_14px_hsl(var(--primary)/.7)]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                /><span className="absolute inset-y-0 right-0 w-12 bg-gradient-to-l from-primary/[0.05] to-transparent" /></>
              )}
              <item.icon
                className={cn(
                  "h-5 w-5 transition-colors",
                  isActive ? item.color : "text-current"
                )}
              />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}</div>)}
      </nav>

      {!isPremium && (
        <div className="px-3 pb-2">
          <button type="button" onClick={() => setPremiumOpen(true)} className={cn("group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 text-left text-white shadow-xl", collapsed ? "p-2.5" : "p-4")}>
            <div className="absolute -right-8 -top-10 h-24 w-24 rounded-full bg-cyan-400/25 blur-2xl transition-transform group-hover:scale-125" />
            {collapsed ? <Crown className="relative mx-auto h-5 w-5 text-amber-300" /> : <div className="relative"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-[.16em] text-cyan-200"><Sparkles className="h-3.5 w-3.5" />Eleve seu fluxo</div><Activity className="h-4 w-4 text-cyan-300" /></div><p className="mt-2 text-xs font-bold">Veja antes. Decida melhor.</p><p className="mt-1 text-[10px] leading-4 text-slate-300">Inteligência para seu dinheiro trabalhar com você.</p></div>}
          </button>
        </div>
      )}

      {/* Settings & Logout */}
      <div className="border-t border-sidebar-border p-3">
        <div className="flex items-center justify-between px-3 py-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs font-medium text-sidebar-muted"
              >
                Tema
              </motion.span>
            )}
          </AnimatePresence>
          <ThemeToggle />
        </div>

        <Link
          to="/configuracoes"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={collapsed ? "Configurações" : undefined}
          title={collapsed ? "Configurações" : undefined}
        >
          <SlidersFlowIcon className="h-5 w-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-medium text-sm"
              >
                Configurações
              </motion.span>
            )}
          </AnimatePresence>
        </Link>

        <button
          onClick={handleSignOut}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sidebar-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
          aria-label={collapsed ? "Sair" : undefined}
          title={collapsed ? "Sair" : undefined}
        >
          <LogOut className="w-5 h-5" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="font-medium text-sm"
              >
                Sair
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
          title={collapsed ? "Expandir menu" : undefined}
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Recolher</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
    </>
  );
}
