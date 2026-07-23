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
  Sparkles,
  LogOut,
  Menu,
  X,
  History,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
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
    label: "Metas",
    icon: Target,
    href: "/metas",
    color: "text-primary",
  },
  {
    label: "Saúde",
    icon: Heart,
    href: "/saude",
    color: "text-health",
  },
  {
    label: "Histórico",
    icon: History,
    href: "/historico",
    color: "text-muted-foreground",
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
    <header className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-sidebar border-b border-sidebar-border">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-glow">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <h1 className="font-display font-bold text-sidebar-foreground">
            LifeFlow
          </h1>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="text-sidebar-foreground hover:bg-sidebar-accent active:scale-95"
            >
              <Menu className="w-6 h-6" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-72 bg-sidebar border-sidebar-border p-0"
          >
            <div className="flex flex-col h-full">
              {/* User Info */}
              <div className="p-4 border-b border-sidebar-border">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-sidebar-foreground truncate">
                      {displayName}
                    </p>
                    <p className="text-xs text-sidebar-muted truncate">
                      {user?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1 overflow-auto">
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 active:scale-95",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground"
                          : "text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
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
              <div className="p-3 border-t border-sidebar-border space-y-1">
                <div className="flex items-center justify-between px-4 py-2">
                  <span className="text-sm text-sidebar-muted font-medium">Tema</span>
                  <ThemeToggle />
                </div>

                <Link
                  to="/configuracoes"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-200 active:scale-95"
                >
                  <Settings className="w-5 h-5" />
                  <span className="font-medium">Configurações</span>
                </Link>

                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sidebar-muted hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-95"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
