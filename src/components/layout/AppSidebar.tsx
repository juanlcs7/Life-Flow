import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Archive,
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  CircleDollarSign,
  ContactRound,
  Crown,
  FileStack,
  FolderClock,
  HeartPulse,
  House,
  LayoutTemplate,
  LogOut,
  Orbit,
  PanelLeftClose,
  Settings2,
  Sparkles,
  Target,
  WalletCards,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { usePlan } from "@/hooks/usePlan";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearchButton } from "@/components/search/GlobalSearch";
import { NotificationCenterButton } from "@/components/notifications/NotificationCenter";
import { PremiumModal } from "@/components/premium/PremiumModal";

interface FlowItem {
  label: string;
  description: string;
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}

interface FlowSpace {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  glow: string;
  paths: string[];
  items: FlowItem[];
}

const flowSpaces: FlowSpace[] = [
  {
    id: "today",
    label: "Seu agora",
    shortLabel: "Hoje",
    description: "O que merece sua atenção.",
    icon: Orbit,
    glow: "from-cyan-400 to-emerald-400",
    paths: ["/"],
    items: [{ label: "Visão do dia", description: "Seu ritmo em um só lugar", href: "/", icon: House, accent: "text-cyan-300" }],
  },
  {
    id: "money",
    label: "Fluxo financeiro",
    shortLabel: "Dinheiro",
    description: "Planeje antes de gastar.",
    icon: CircleDollarSign,
    glow: "from-emerald-400 to-cyan-400",
    paths: ["/financas", "/planejamento", "/metas"],
    items: [
      { label: "Meu dinheiro", description: "Saldo, gastos e decisões", href: "/financas", icon: WalletCards, accent: "text-emerald-300" },
      { label: "Plano de voo", description: "Organize o que vem depois", href: "/planejamento", icon: LayoutTemplate, accent: "text-sky-300" },
      { label: "Conquistas", description: "Transforme planos em progresso", href: "/metas", icon: Target, accent: "text-amber-300" },
    ],
  },
  {
    id: "routine",
    label: "Ritmo pessoal",
    shortLabel: "Rotina",
    description: "Tempo e energia em equilíbrio.",
    icon: CalendarDays,
    glow: "from-violet-400 to-fuchsia-400",
    paths: ["/agenda", "/saude"],
    items: [
      { label: "Minha agenda", description: "Compromissos sem ruído", href: "/agenda", icon: CalendarDays, accent: "text-violet-300" },
      { label: "Meu bem-estar", description: "Hábitos, saúde e constância", href: "/saude", icon: HeartPulse, accent: "text-rose-300" },
    ],
  },
  {
    id: "archive",
    label: "Memória da vida",
    shortLabel: "Arquivo",
    description: "Tudo importante, fácil de encontrar.",
    icon: Archive,
    glow: "from-amber-300 to-orange-400",
    paths: ["/historico", "/documentos", "/contatos"],
    items: [
      { label: "Linha do tempo", description: "O que aconteceu e quando", href: "/historico", icon: FolderClock, accent: "text-amber-300" },
      { label: "Cofre digital", description: "Seus documentos importantes", href: "/documentos", icon: FileStack, accent: "text-blue-300" },
      { label: "Minha rede", description: "Pessoas que fazem parte", href: "/contatos", icon: ContactRound, accent: "text-pink-300" },
    ],
  },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [premiumOpen, setPremiumOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const reduceMotion = useReducedMotion();
  const { signOut, user } = useAuth();
  const { profile } = useProfile();
  const { isPremium, usage, limits } = usePlan();

  const routeSpace = useMemo(() => flowSpaces.find((space) => space.paths.includes(location.pathname)) ?? flowSpaces[0], [location.pathname]);
  const [activeSpaceId, setActiveSpaceId] = useState(routeSpace.id);
  const activeSpace = flowSpaces.find((space) => space.id === activeSpaceId) ?? routeSpace;

  useEffect(() => setActiveSpaceId(routeSpace.id), [routeSpace.id]);

  const displayName = profile?.name || user?.email?.split("@")[0] || "Usuário";
  const initials = displayName.substring(0, 2).toUpperCase();
  const transactionProgress = isPremium ? 100 : Math.min(100, (usage.transactionsThisMonth / limits.transactionsPerMonth) * 100);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return <>
    <PremiumModal open={premiumOpen} onOpenChange={setPremiumOpen} />
    <motion.aside
      initial={{ x: -18, opacity: 0 }}
      animate={{ x: 0, opacity: 1, width: collapsed ? 78 : 326 }}
      transition={{ duration: reduceMotion ? 0 : 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-4 ml-4 hidden h-[calc(100vh-2rem)] shrink-0 overflow-hidden rounded-[2.25rem] border border-white/10 bg-[#07111f] text-white shadow-[0_35px_100px_-45px_rgba(2,8,23,.95)] lg:flex"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_8%_12%,rgba(6,182,212,.13),transparent_24%),radial-gradient(circle_at_100%_52%,rgba(139,92,246,.1),transparent_30%)]" />

      <div className="relative z-10 flex w-[77px] shrink-0 flex-col items-center border-r border-white/[0.07] bg-black/15 py-4">
        <div className="relative grid h-12 w-12 place-items-center rounded-[1.15rem] bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 shadow-[0_12px_32px_-12px_rgba(34,211,238,.8)] ring-1 ring-white/25">
          <img src="/lifeflow-logo.png" alt="LifeFlow" className="h-9 w-9 object-contain" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#07111f] bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.9)]" />
        </div>

        <div className="mt-8 flex flex-1 flex-col gap-3" aria-label="Filtros da central">
          {flowSpaces.map((space) => {
            const SpaceIcon = space.icon;
            const isSelected = activeSpace.id === space.id;
            return <button key={space.id} type="button" onClick={() => setActiveSpaceId(space.id)} title={space.shortLabel} aria-label={`Abrir ${space.shortLabel}`} className={cn("group relative grid h-12 w-12 place-items-center rounded-2xl text-slate-500 transition-all", isSelected ? "text-white" : "hover:bg-white/[0.06] hover:text-slate-200")}>
              {isSelected && <motion.span layoutId="flow-filter" className={cn("absolute inset-0 rounded-2xl bg-gradient-to-br opacity-90 shadow-[0_12px_25px_-14px_currentColor]", space.glow)} transition={{ type: "spring", stiffness: 420, damping: 32 }} />}
              <SpaceIcon className="relative h-5 w-5" />
              {routeSpace.id === space.id && <span className="absolute -right-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-white shadow-[0_0_8px_white]" />}
            </button>;
          })}
        </div>

        <div className="space-y-2">
          <Link to="/configuracoes" title="Configurações" className={cn("grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white", location.pathname === "/configuracoes" && "bg-white/10 text-white")}><Settings2 className="h-4.5 w-4.5" /></Link>
          <button type="button" onClick={() => setCollapsed((value) => !value)} title={collapsed ? "Expandir central" : "Recolher central"} className="grid h-10 w-10 place-items-center rounded-xl text-slate-500 transition-colors hover:bg-white/[0.06] hover:text-white">{collapsed ? <ChevronRight className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}</button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.2 }} className="relative z-10 flex min-w-0 flex-1 flex-col">
          <div className="border-b border-white/[0.07] px-5 pb-4 pt-5">
            <div className="flex items-center justify-between"><div><p className="text-[9px] font-black uppercase tracking-[.24em] text-cyan-300">LifeFlow central</p><h1 className="mt-1 font-display text-lg font-black tracking-[-.04em]">{activeSpace.label}</h1></div><div className="flex items-center gap-1"><GlobalSearchButton compact /><NotificationCenterButton compact /></div></div>
            <p className="mt-1 text-[10px] leading-4 text-slate-500">{activeSpace.description}</p>
            <div className="mt-4 flex gap-1.5">{flowSpaces.map((space) => <button key={space.id} type="button" onClick={() => setActiveSpaceId(space.id)} className={cn("h-1 rounded-full transition-all", space.id === activeSpace.id ? "w-9 bg-gradient-to-r " + space.glow : "w-3 bg-white/10 hover:bg-white/25")} aria-label={`Filtrar por ${space.shortLabel}`} />)}</div>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 [scrollbar-width:none]">
            <AnimatePresence mode="wait">
              <motion.div key={activeSpace.id} initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: 14, filter: "blur(4px)" }} animate={{ opacity: 1, x: 0, filter: "blur(0px)" }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.22 }} className="space-y-2">
                {activeSpace.items.map((item, index) => {
                  const ItemIcon = item.icon;
                  const isActive = location.pathname === item.href;
                  return <Link key={item.href} to={item.href} className={cn("group relative flex items-center gap-3 overflow-hidden rounded-[1.15rem] border px-3 py-3 transition-all", isActive ? "border-white/15 bg-white/[0.09] shadow-[0_16px_36px_-24px_rgba(34,211,238,.65)]" : "border-transparent hover:border-white/[0.08] hover:bg-white/[0.045]")}>
                    {isActive && <motion.span layoutId="active-flow-page" className={cn("absolute inset-y-2 left-0 w-0.5 rounded-r-full bg-gradient-to-b", activeSpace.glow)} />}
                    <span className={cn("relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.045] transition-transform group-hover:scale-105", item.accent)}><ItemIcon className="h-4.5 w-4.5" />{isActive && <span className="absolute inset-0 rounded-2xl bg-current opacity-[0.07]" />}</span>
                    <span className="min-w-0 flex-1"><span className={cn("block text-xs font-extrabold", isActive ? "text-white" : "text-slate-300")}>{item.label}</span><span className="mt-0.5 block truncate text-[9px] text-slate-500">{item.description}</span></span>
                    <ArrowUpRight className={cn("h-4 w-4 transition-all", isActive ? "text-cyan-300" : "-translate-x-1 text-slate-700 opacity-0 group-hover:translate-x-0 group-hover:opacity-100")} />
                    <span className="absolute right-3 top-2 text-[8px] font-black text-white/[0.04]">0{index + 1}</span>
                  </Link>;
                })}
              </motion.div>
            </AnimatePresence>

            {activeSpace.id === "money" && !isPremium && <div className="mt-4 rounded-[1.25rem] border border-emerald-400/10 bg-emerald-400/[0.045] p-3.5"><div className="flex items-center justify-between text-[9px]"><span className="font-bold text-emerald-200">Pulso financeiro</span><span className="text-slate-500">{usage.transactionsThisMonth}/{limits.transactionsPerMonth}</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/30"><motion.span initial={{ width: 0 }} animate={{ width: `${transactionProgress}%` }} className="block h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" /></div><p className="mt-2 text-[9px] leading-4 text-slate-500">Movimentos registrados neste mês.</p></div>}
          </div>

          <div className="space-y-2 border-t border-white/[0.07] p-3">
            {!isPremium && <button type="button" onClick={() => setPremiumOpen(true)} className="group relative w-full overflow-hidden rounded-[1.2rem] border border-violet-400/15 bg-gradient-to-r from-violet-500/15 via-cyan-400/[0.07] to-transparent p-3 text-left"><div className="absolute -right-4 -top-8 h-20 w-20 rounded-full bg-cyan-300/15 blur-2xl transition-transform group-hover:scale-150" /><div className="relative flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-400 text-slate-950 shadow-lg shadow-amber-400/10"><Crown className="h-4 w-4" /></span><span className="flex-1"><span className="flex items-center gap-1 text-[9px] font-black uppercase tracking-[.12em] text-cyan-200">Fluxo sem limites <Sparkles className="h-3 w-3" /></span><span className="mt-0.5 block text-[9px] text-slate-500">Conheça a inteligência Premium</span></span><ArrowUpRight className="h-4 w-4 text-slate-500" /></div></button>}

            <div className="flex items-center gap-2 rounded-[1.2rem] border border-white/[0.07] bg-white/[0.035] p-2">
              <Avatar className="h-9 w-9 ring-1 ring-white/10"><AvatarImage src={profile?.avatar_url || undefined} alt={displayName} className="object-cover" /><AvatarFallback className="bg-gradient-to-br from-cyan-500 to-violet-600 text-[10px] font-black text-white">{initials}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1"><p className="truncate text-[10px] font-extrabold text-white">{displayName}</p><p className="mt-0.5 text-[8px] font-bold uppercase tracking-[.1em] text-slate-500">{isPremium ? "Premium ativo" : "Plano essencial"}</p></div>
              <ThemeToggle />
              <button type="button" onClick={handleSignOut} title="Sair" className="grid h-8 w-8 place-items-center rounded-xl text-slate-600 transition-colors hover:bg-rose-400/10 hover:text-rose-300"><LogOut className="h-4 w-4" /></button>
            </div>
          </div>
        </motion.div>}
      </AnimatePresence>
    </motion.aside>
  </>;
}
