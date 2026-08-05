import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
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

const navItems = [
  {
    label: "Dashboard",
    icon: HomeFlowIcon,
    href: "/",
    color: "text-primary",
  },
  {
    label: "Finanças",
    icon: MoneyFlowIcon,
    href: "/financas",
    color: "text-finance",
  },
  {
    label: "Agenda",
    icon: AgendaFlowIcon,
    href: "/agenda",
    color: "text-tasks",
  },
  {
    label: "Planejamento",
    icon: WeekFlowIcon,
    href: "/planejamento",
    color: "text-info",
  },
  {
    label: "Saúde",
    icon: HealthFlowIcon,
    href: "/saude",
    color: "text-health",
  },
  {
    label: "Metas",
    icon: GoalFlowIcon,
    href: "/metas",
    color: "text-warning",
  },
  {
    label: "Histórico",
    icon: HistoryFlowIcon,
    href: "/historico",
    color: "text-primary",
  },
  {
    label: "Documentos",
    icon: FilesFlowIcon,
    href: "/documentos",
    color: "text-documents",
  },
  {
    label: "Contatos",
    icon: PeopleFlowIcon,
    href: "/contatos",
    color: "text-contacts",
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <motion.aside
      initial={{ x: -20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={cn(
        "sticky top-0 hidden h-screen flex-col overflow-hidden border-r border-border/70 bg-card/95 text-foreground shadow-[8px_0_30px_-24px_rgba(15,23,42,.25)] backdrop-blur-xl transition-all duration-200 dark:border-slate-800 dark:bg-slate-900 dark:text-white lg:flex",
        collapsed ? "w-[72px]" : "w-[240px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-border/70 px-4 dark:border-slate-800">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-border/60 bg-muted/60 shadow-sm dark:border-transparent dark:bg-slate-800">
          <img src="/lifeflow-logo.png" alt="" className="h-7 w-7 object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-display text-lg font-bold tracking-tight text-foreground dark:text-white">
                LifeFlow
              </h1>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Info */}
      <div className="border-b border-border/70 p-3 dark:border-slate-800">
        <div className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/45 px-3 py-2.5 dark:border-transparent dark:bg-slate-800/60">
          <Avatar className="h-8 w-8 flex-shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" />
            <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary dark:bg-slate-700 dark:text-slate-200">
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
                <p className="truncate text-sm font-semibold text-foreground dark:text-slate-100">
                  {displayName}
                </p>
                <p className="truncate text-xs text-muted-foreground dark:text-slate-500">
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="space-y-1 border-b border-border/70 p-3 dark:border-white/10">
        <GlobalSearchButton compact={collapsed} />
        <NotificationCenterButton compact={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && (
          <p className="mb-2 px-3 pt-2 text-xs font-medium text-muted-foreground dark:text-slate-500">
            Menu
          </p>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors",
                isActive
                  ? "bg-primary/10 text-foreground shadow-sm dark:bg-slate-800 dark:text-white"
                  : "text-muted-foreground hover:bg-muted/70 hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-800/70 dark:hover:text-slate-100"
              )}
              aria-label={collapsed ? item.label : undefined}
              title={collapsed ? item.label : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
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
        })}
      </nav>

      {/* Settings & Logout */}
      <div className="border-t border-border/70 p-3 dark:border-slate-800">
        <div className="flex items-center justify-between px-3 py-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs font-medium text-muted-foreground dark:text-slate-500"
              >
                Tema
              </motion.span>
            )}
          </AnimatePresence>
          <ThemeToggle />
        </div>

        <Link
          to="/configuracoes"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
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
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive dark:text-slate-400 dark:hover:bg-red-400/10 dark:hover:text-red-300"
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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-200"
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
  );
}
