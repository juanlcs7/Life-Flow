import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LogOut,
  Menu,
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
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
    label: "Metas",
    icon: GoalFlowIcon,
    href: "/metas",
    color: "text-primary",
  },
  {
    label: "Saúde",
    icon: HealthFlowIcon,
    href: "/saude",
    color: "text-health",
  },
  {
    label: "Histórico",
    icon: HistoryFlowIcon,
    href: "/historico",
    color: "text-muted-foreground",
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

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setOpen(false);
  };

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b bg-background lg:hidden">
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md border bg-card">
            <img src="/lifeflow-logo.png" alt="" className="h-8 w-8 object-contain" />
          </div>
          <div>
            <h1 className="font-display font-bold tracking-tight text-foreground">LifeFlow</h1>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <GlobalSearchButton mobile />
          <NotificationCenterButton mobile />
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-md text-foreground hover:bg-muted"
                aria-label="Abrir menu principal"
              >
                <Menu className="w-6 h-6" />
              </Button>
            </SheetTrigger>
          <SheetContent
            side="right"
            className="w-[300px] border-border bg-card p-0 text-foreground dark:border-slate-800 dark:bg-slate-900 dark:text-white"
          >
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="border-b border-border p-5 dark:border-white/10">
                <div className="mb-5 flex items-center gap-3">
                  <img src="/lifeflow-logo.png" alt="" className="h-9 w-9 object-contain" />
                  <span className="font-display text-lg font-bold text-foreground dark:text-white">LifeFlow</span>
                </div>
                <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/50 p-3 dark:border-transparent dark:bg-slate-800">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" />
                    <AvatarFallback className="bg-primary/10 text-sm font-semibold text-primary dark:bg-cyan-300/10 dark:text-cyan-200">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground dark:text-white">
                      {displayName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground dark:text-slate-500">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 space-y-1 overflow-auto p-3">
                <p className="mb-2 px-4 pt-2 text-xs font-medium text-muted-foreground dark:text-slate-500">
                  Menu
                </p>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-4 py-3 transition-colors",
                        isActive
                          ? "bg-primary/10 text-foreground dark:bg-white/[0.09] dark:text-white"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground dark:text-slate-400 dark:hover:bg-white/[0.055] dark:hover:text-white"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-5 h-5",
                          isActive ? item.color : "text-current"
                        )}
                      />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              {/* Settings & Logout */}
              <div className="space-y-1 border-t border-border p-3 dark:border-white/10">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm font-medium text-muted-foreground dark:text-slate-500">Tema</span>
                  <ThemeToggle />
                </div>

                <Link
                  to="/configuracoes"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground active:scale-95 dark:text-slate-400 dark:hover:bg-white/[0.055] dark:hover:text-white"
                >
                  <SlidersFlowIcon className="h-5 w-5" />
                  <span className="font-medium">Configurações</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-muted-foreground transition-all duration-200 hover:bg-destructive/10 hover:text-destructive active:scale-95 dark:text-slate-400 dark:hover:bg-red-400/10 dark:hover:text-red-300"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
