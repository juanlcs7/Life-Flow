import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Wallet,
  CalendarDays,
  Heart,
  FolderOpen,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  History,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";

const navItems = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/",
    color: "text-primary",
  },
  {
    label: "Finanças",
    icon: Wallet,
    href: "/financas",
    color: "text-finance",
  },
  {
    label: "Agenda",
    icon: CalendarDays,
    href: "/agenda",
    color: "text-tasks",
  },
  {
    label: "Saúde",
    icon: Heart,
    href: "/saude",
    color: "text-health",
  },
  {
    label: "Metas",
    icon: Target,
    href: "/metas",
    color: "text-warning",
  },
  {
    label: "Histórico",
    icon: History,
    href: "/historico",
    color: "text-primary",
  },
  {
    label: "Documentos",
    icon: FolderOpen,
    href: "/documentos",
    color: "text-documents",
  },
  {
    label: "Contatos",
    icon: Users,
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
        "sticky top-0 hidden h-screen flex-col overflow-hidden border-r border-white/10 bg-[linear-gradient(180deg,#07111f_0%,#091827_55%,#07111f_100%)] shadow-2xl shadow-slate-950/10 transition-all duration-300 lg:flex",
        collapsed ? "w-[84px]" : "w-[272px]"
      )}
    >
      <div className="pointer-events-none absolute -left-24 top-0 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      {/* Logo */}
      <div className="relative flex h-[78px] items-center gap-3 border-b border-white/10 px-5">
        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06]">
          <img src="/lifeflow-logo.png" alt="" className="h-8 w-8 object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              <h1 className="font-display text-lg font-bold tracking-tight text-white">
                LifeFlow
              </h1>
              <p className="text-xs text-slate-400">Seu ritmo, seu progresso</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* User Info */}
      <div className="relative border-b border-white/10 p-3">
        <div className="flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.045] px-3 py-3">
          <Avatar className="h-9 w-9 flex-shrink-0 ring-2 ring-cyan-300/10">
            <AvatarFallback className="bg-gradient-to-br from-cyan-400/20 to-emerald-400/20 text-xs font-semibold text-cyan-200">
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
                <p className="truncate text-sm font-semibold text-slate-100">
                  {displayName}
                </p>
                <p className="truncate text-xs text-slate-500">
                  {user?.email}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Navigation */}
      <nav className="relative flex-1 space-y-1 overflow-y-auto p-3">
        {!collapsed && (
          <p className="mb-2 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-600">
            Navegação
          </p>
        )}
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200",
                isActive
                  ? "bg-white/[0.09] text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/[0.055] hover:text-slate-100"
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNav"
                  className="absolute left-0 top-1/2 h-6 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-cyan-300 to-emerald-300"
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
      <div className="relative border-t border-white/10 p-3">
        <div className="flex items-center justify-between px-3 py-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="text-xs font-medium text-slate-500"
              >
                Tema
              </motion.span>
            )}
          </AnimatePresence>
          <ThemeToggle />
        </div>

        <Link
          to="/configuracoes"
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-all duration-200 hover:bg-white/[0.055] hover:text-white"
        >
          <Settings className="w-5 h-5" />
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
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-slate-400 transition-all duration-200 hover:bg-red-400/10 hover:text-red-300"
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
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-slate-500 transition-all duration-200 hover:bg-white/[0.055] hover:text-slate-200"
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
