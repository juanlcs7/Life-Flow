import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  FileStack,
  FolderClock,
  HeartPulse,
  House,
  LayoutGrid,
  LayoutTemplate,
  LogOut,
  Orbit,
  Plus,
  Settings2,
  Target,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearchButton } from "@/components/search/GlobalSearch";
import { NotificationCenterButton } from "@/components/notifications/NotificationCenter";

interface MobileFlowItem {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

const mobileFlows = [
  { id: "today", label: "Seu agora", short: "Hoje", description: "O que merece sua atenção.", icon: Orbit, glow: "from-cyan-400 to-emerald-400", paths: ["/"], items: [{ label: "Visão do dia", description: "Seu ritmo em um só lugar", href: "/", icon: House, accent: "text-cyan-300" }] },
  { id: "money", label: "Fluxo financeiro", short: "Dinheiro", description: "Planeje antes de gastar.", icon: CircleDollarSign, glow: "from-emerald-400 to-cyan-400", paths: ["/financas", "/planejamento", "/metas"], items: [
    { label: "Meu dinheiro", description: "Saldo, gastos e decisões", href: "/financas", icon: WalletCards, accent: "text-emerald-300" },
    { label: "Plano de voo", description: "Organize o que vem depois", href: "/planejamento", icon: LayoutTemplate, accent: "text-sky-300" },
    { label: "Conquistas", description: "Planos transformados em progresso", href: "/metas", icon: Target, accent: "text-amber-300" },
  ] },
  { id: "routine", label: "Ritmo pessoal", short: "Rotina", description: "Tempo e energia em equilíbrio.", icon: CalendarDays, glow: "from-violet-400 to-fuchsia-400", paths: ["/agenda", "/saude"], items: [
    { label: "Minha agenda", description: "Compromissos sem ruído", href: "/agenda", icon: CalendarDays, accent: "text-violet-300" },
    { label: "Meu bem-estar", description: "Hábitos, saúde e constância", href: "/saude", icon: HeartPulse, accent: "text-rose-300" },
  ] },
  { id: "archive", label: "Memória da vida", short: "Arquivo", description: "Tudo importante, fácil de encontrar.", icon: Archive, glow: "from-amber-300 to-orange-400", paths: ["/historico", "/documentos", "/contatos"], items: [
    { label: "Linha do tempo", description: "O que aconteceu e quando", href: "/historico", icon: FolderClock, accent: "text-amber-300" },
    { label: "Cofre digital", description: "Seus documentos importantes", href: "/documentos", icon: FileStack, accent: "text-blue-300" },
    { label: "Minha rede", description: "Pessoas que fazem parte", href: "/contatos", icon: ContactRound, accent: "text-pink-300" },
  ] },
] satisfies Array<{ id: string; label: string; short: string; description: string; icon: ComponentType<{ className?: string }>; glow: string; paths: string[]; items: MobileFlowItem[] }>;

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const routeFlow = useMemo(() => mobileFlows.find((flow) => flow.paths.includes(location.pathname)) ?? mobileFlows[0], [location.pathname]);
  const [activeFlowId, setActiveFlowId] = useState(routeFlow.id);
  const activeFlow = mobileFlows.find((flow) => flow.id === activeFlowId) ?? routeFlow;

  useEffect(() => setActiveFlowId(routeFlow.id), [routeFlow.id]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();

  const openCentral = () => {
    setActiveFlowId(routeFlow.id);
    setOpen(true);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    setOpen(false);
  };

  return <>
    <header className="fixed inset-x-0 top-0 z-40 border-b border-border/50 bg-background/78 backdrop-blur-2xl lg:hidden">
      <div className="flex h-[68px] items-center justify-between px-4">
        <button type="button" onClick={openCentral} className="flex min-w-0 items-center gap-3 text-left" aria-label="Abrir Central de Fluxos">
          <span className="relative grid h-10 w-10 shrink-0 place-items-center rounded-[1rem] bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 shadow-[0_10px_24px_-10px_rgba(34,211,238,.75)] ring-1 ring-white/25"><img src="/lifeflow-logo.png" alt="" className="h-8 w-8 object-contain" /><span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-background bg-emerald-400" /></span>
          <span className="min-w-0"><span className="block text-[8px] font-black uppercase tracking-[.2em] text-primary">LifeFlow central</span><span className="mt-0.5 block truncate font-display text-sm font-black tracking-[-.025em] text-foreground">{routeFlow.label}</span></span>
        </button>
        <div className="flex items-center gap-1"><GlobalSearchButton mobile /><NotificationCenterButton mobile /><button type="button" onClick={openCentral} className="grid h-10 w-10 place-items-center rounded-xl text-muted-foreground transition-colors hover:bg-primary/[0.07] hover:text-foreground" aria-label="Abrir Central de Fluxos"><LayoutGrid className="h-5 w-5" /></button></div>
      </div>
    </header>

    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="bottom" className="h-[88dvh] overflow-hidden rounded-t-[2.2rem] border-white/10 bg-[#07111f] p-0 text-white shadow-[0_-30px_90px_-35px_rgba(2,8,23,.95)]">
        <SheetTitle className="sr-only">Central de Fluxos LifeFlow</SheetTitle>
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_5%,rgba(6,182,212,.17),transparent_28%),radial-gradient(circle_at_100%_60%,rgba(139,92,246,.12),transparent_35%)]" />
        <div className="relative flex h-full flex-col pt-3">
          <div className="mx-auto mb-3 h-1 w-12 rounded-full bg-white/15" />
          <div className="px-5 pb-4"><div className="flex items-center gap-3"><Avatar className="h-11 w-11 ring-2 ring-cyan-400/20 ring-offset-2 ring-offset-[#07111f]"><AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" /><AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600 text-xs font-black text-white">{initials}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300">Sua central</p><p className="mt-0.5 truncate font-display text-lg font-black tracking-[-.035em]">{displayName}</p></div><ThemeToggle /></div></div>

          <div className="grid grid-cols-4 gap-2 px-4" aria-label="Filtros da central">
            {mobileFlows.map((flow) => { const FlowIcon = flow.icon; const selected = activeFlow.id === flow.id; return <button key={flow.id} type="button" onClick={() => setActiveFlowId(flow.id)} className={cn("relative flex min-w-0 flex-col items-center gap-1.5 overflow-hidden rounded-2xl border px-1 py-3 text-[8px] font-extrabold transition-all", selected ? "border-white/15 text-white shadow-lg" : "border-white/[0.06] bg-white/[0.025] text-slate-500")}>
              {selected && <motion.span layoutId="mobile-flow-filter" className={cn("absolute inset-0 bg-gradient-to-br opacity-80", flow.glow)} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <FlowIcon className="relative h-5 w-5" /><span className="relative truncate">{flow.short}</span>{routeFlow.id === flow.id && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />}
            </button>; })}
          </div>

          <div className="mt-5 flex min-h-0 flex-1 flex-col rounded-t-[2rem] border-t border-white/[0.07] bg-black/10 px-4 pt-5">
            <div className="px-1"><p className="text-[9px] font-black uppercase tracking-[.2em] text-cyan-300">{activeFlow.label}</p><p className="mt-1 text-[10px] text-slate-500">{activeFlow.description}</p></div>
            <div className="mt-4 flex-1 overflow-y-auto pb-4 [scrollbar-width:none]">
              <AnimatePresence mode="wait">
                <motion.div key={activeFlow.id} initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 18, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -12 }} className="space-y-2">
                  {activeFlow.items.map((item) => { const ItemIcon = item.icon; const selected = location.pathname === item.href; return <Link key={item.href} to={item.href} onClick={() => setOpen(false)} className={cn("group relative flex items-center gap-3 overflow-hidden rounded-[1.25rem] border p-3.5 transition-all active:scale-[.98]", selected ? "border-white/15 bg-white/[0.09]" : "border-white/[0.06] bg-white/[0.025]")}>
                    {selected && <span className={cn("absolute inset-y-3 left-0 w-0.5 rounded-r-full bg-gradient-to-b", activeFlow.glow)} />}<span className={cn("grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.045]", item.accent)}><ItemIcon className="h-5 w-5" /></span><span className="min-w-0 flex-1"><span className="block text-xs font-extrabold text-white">{item.label}</span><span className="mt-1 block truncate text-[9px] text-slate-500">{item.description}</span></span><ArrowUpRight className={cn("h-4 w-4", selected ? "text-cyan-300" : "text-slate-700")} />
                  </Link>; })}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/[0.07] bg-black/15 p-3 pb-[max(.75rem,env(safe-area-inset-bottom))]"><Link to="/configuracoes" onClick={() => setOpen(false)} className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.07] bg-white/[0.035] py-3 text-[10px] font-bold text-slate-300"><Settings2 className="h-4 w-4" />Configurações</Link><button type="button" onClick={handleSignOut} className="flex items-center justify-center gap-2 rounded-2xl border border-rose-400/10 bg-rose-400/[0.04] py-3 text-[10px] font-bold text-rose-300"><LogOut className="h-4 w-4" />Sair</button></div>
        </div>
      </SheetContent>
    </Sheet>

    <nav className="fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-40 grid grid-cols-5 items-end rounded-[1.55rem] border border-white/60 bg-card/88 p-1.5 shadow-[0_20px_55px_-18px_rgba(15,23,42,.5)] backdrop-blur-2xl dark:border-white/10 lg:hidden" aria-label="Atalhos principais">
      <MobileDockLink href="/" label="Hoje" icon={House} active={location.pathname === "/"} />
      <MobileDockLink href="/financas" label="Dinheiro" icon={WalletCards} active={mobileFlows[1].paths.includes(location.pathname)} />
      <button type="button" onClick={() => navigate("/financas?novaTransacao=1")} className="group -mt-6 flex flex-col items-center gap-1 text-[9px] font-black text-primary" aria-label="Adicionar nova transação"><span className="relative grid h-[58px] w-[58px] place-items-center rounded-full bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 text-white shadow-[0_14px_32px_-8px_rgba(6,182,212,.85)] ring-4 ring-background/95 transition-transform group-active:scale-90"><span className="absolute inset-1 rounded-full border border-white/20" /><Plus className="relative h-7 w-7" strokeWidth={2.8} /></span><span>Novo</span></button>
      <MobileDockLink href="/agenda" label="Rotina" icon={CalendarDays} active={mobileFlows[2].paths.includes(location.pathname)} />
      <button type="button" onClick={openCentral} className={cn("flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-bold transition-all", open || routeFlow.id === "archive" ? "bg-gradient-to-br from-violet-500 to-cyan-500 text-white shadow-lg" : "text-muted-foreground")}><LayoutGrid className="h-5 w-5" /><span>Central</span></button>
    </nav>
  </>;
}

function MobileDockLink({ href, label, icon: Icon, active }: { href: string; label: string; icon: ComponentType<{ className?: string }>; active: boolean }) {
  return <Link to={href} className={cn("flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[9px] font-bold transition-all", active ? "bg-gradient-to-br from-primary to-cyan-600 text-white shadow-lg shadow-primary/20" : "text-muted-foreground hover:bg-primary/[0.07] hover:text-foreground")}><Icon className="h-5 w-5" /><span>{label}</span></Link>;
}
