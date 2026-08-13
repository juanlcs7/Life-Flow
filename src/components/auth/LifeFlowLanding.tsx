import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  HeartPulse,
  LayoutDashboard,
  Menu,
  Orbit,
  PieChart,
  ShieldCheck,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  WalletCards,
  Zap,
} from "lucide-react";

interface Props {
  onLogin: () => void;
  onSignup: () => void;
}

const flowAreas = [
  { icon: WalletCards, label: "Finanças", description: "Saiba quanto entrou, saiu e ainda pode ser usado.", tone: "text-emerald-300 bg-emerald-400/10" },
  { icon: CalendarDays, label: "Rotina", description: "Compromissos, tarefas e hábitos em um único ritmo.", tone: "text-violet-300 bg-violet-400/10" },
  { icon: HeartPulse, label: "Bem-estar", description: "Acompanhe hábitos que sustentam seus melhores dias.", tone: "text-rose-300 bg-rose-400/10" },
  { icon: Target, label: "Metas", description: "Transforme planos distantes em próximos passos claros.", tone: "text-amber-300 bg-amber-400/10" },
];

const featureCards = [
  { icon: Zap, eyebrow: "Decisão diária", title: "Quanto posso gastar hoje?", description: "O LifeFlow considera renda, compromissos, metas e dias restantes para sugerir um valor seguro." },
  { icon: PieChart, eyebrow: "Leitura simples", title: "Relatórios que explicam", description: "Veja onde o dinheiro foi usado, o que mudou e quais categorias merecem atenção." },
  { icon: Orbit, eyebrow: "Tudo conectado", title: "Sua vida em um fluxo", description: "Dinheiro, agenda, saúde e objetivos deixam de disputar espaço e começam a trabalhar juntos." },
];

export function LifeFlowLanding({ onLogin, onSignup }: Props) {
  const reduceMotion = useReducedMotion();
  const reveal = reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 };

  return <main className="min-h-screen overflow-hidden bg-[#050b18] text-white selection:bg-cyan-300 selection:text-slate-950">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_8%,rgba(14,165,233,.18),transparent_28%),radial-gradient(circle_at_15%_48%,rgba(20,184,166,.08),transparent_24%),radial-gradient(circle_at_90%_72%,rgba(139,92,246,.09),transparent_24%)]" />
    <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.08)_1px,transparent_1px)] [background-size:52px_52px] [mask-image:linear-gradient(to_bottom,black,transparent_75%)]" />

    <header className="relative z-40 mx-auto flex h-20 max-w-[1380px] items-center justify-between px-5 sm:px-8 lg:px-12">
      <a href="#inicio" className="flex items-center gap-3"><span className="relative grid h-11 w-11 place-items-center rounded-[1rem] border border-white/15 bg-gradient-to-br from-cyan-400 via-teal-400 to-violet-500 shadow-[0_12px_30px_-12px_rgba(34,211,238,.8)]"><img src="/lifeflow-logo.png" alt="" className="h-8 w-8 object-contain" /><span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#050b18] bg-emerald-400" /></span><span><span className="block font-display text-base font-black tracking-[-.04em]">LifeFlow</span><span className="block text-[7px] font-black uppercase tracking-[.22em] text-cyan-300">Seu ritmo. Seu fluxo.</span></span></a>
      <nav className="hidden items-center gap-7 text-[11px] font-semibold text-slate-400 md:flex"><a href="#como-funciona" className="transition hover:text-white">Como funciona</a><a href="#recursos" className="transition hover:text-white">Recursos</a><a href="#experiencia" className="transition hover:text-white">Experiência</a></nav>
      <div className="flex items-center gap-2"><button type="button" onClick={onLogin} className="hidden rounded-full px-4 py-2.5 text-[11px] font-bold text-slate-300 transition hover:bg-white/5 hover:text-white sm:block">Entrar</button><button type="button" onClick={onSignup} className="rounded-full bg-white px-4 py-2.5 text-[11px] font-black text-slate-950 shadow-lg transition hover:-translate-y-0.5 hover:bg-cyan-50 sm:px-5">Começar grátis</button><Menu className="ml-1 h-5 w-5 text-slate-400 md:hidden" /></div>
    </header>

    <section id="inicio" className="relative mx-auto max-w-[1380px] px-5 pb-24 pt-14 text-center sm:px-8 sm:pt-20 lg:px-12 lg:pt-24">
      <HeroFinancePhone reduceMotion={Boolean(reduceMotion)} />
      <HeroParticles reduceMotion={Boolean(reduceMotion)} />
      <motion.div initial={reveal} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-20 mx-auto max-w-4xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/[0.07] px-4 py-2 text-[10px] font-bold text-cyan-100 backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-cyan-300" />Uma central para o que realmente importa</div>
        <h1 className="mt-7 font-display text-[clamp(2.8rem,7vw,6.5rem)] font-medium leading-[.92] tracking-[-.07em] text-white">Administre menos.<br /><span className="bg-gradient-to-r from-cyan-300 via-teal-300 to-emerald-300 bg-clip-text text-transparent">Viva com mais clareza.</span></h1>
        <p className="mx-auto mt-7 max-w-2xl text-sm leading-7 text-slate-400 sm:text-base">O LifeFlow conecta dinheiro, rotina, saúde e metas para mostrar o que merece sua atenção agora — e o que vem depois.</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row"><button type="button" onClick={onSignup} className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-white px-6 text-xs font-black text-slate-950 shadow-[0_15px_45px_-14px_rgba(255,255,255,.55)] transition hover:-translate-y-1">Criar minha conta <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button><button type="button" onClick={onLogin} className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-6 text-xs font-bold text-white backdrop-blur transition hover:border-cyan-300/30 hover:bg-white/[0.07]">Já uso o LifeFlow</button></div>
      </motion.div>

      <HeroProduct reduceMotion={Boolean(reduceMotion)} />
      <div className="pointer-events-none absolute inset-x-[-20%] bottom-[-1px] h-56 bg-gradient-to-t from-cyan-400/20 via-blue-500/5 to-transparent blur-2xl" />
    </section>

    <section id="como-funciona" className="relative border-t border-white/[0.06] bg-[#07101e]/85 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionTitle eyebrow="Uma visão, quatro fluxos" title={<>Tudo que você precisa.<br /><span className="text-slate-500">Sem viver pulando entre aplicativos.</span></>} description="O LifeFlow organiza áreas diferentes da vida com uma linguagem única e simples." />
        <div className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{flowAreas.map(({ icon: Icon, label, description, tone }, index) => <motion.article key={label} initial={reveal} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .25 }} transition={{ delay: index * .06 }} className="group relative min-h-56 overflow-hidden rounded-[1.7rem] border border-white/[0.08] bg-white/[0.035] p-5 backdrop-blur transition hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.055]"><span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}><Icon className="h-5 w-5" /></span><p className="mt-9 font-display text-xl font-black tracking-[-.035em]">{label}</p><p className="mt-2 text-[11px] leading-5 text-slate-500">{description}</p><span className="absolute bottom-4 right-5 text-5xl font-black text-white/[0.025]">0{index + 1}</span></motion.article>)}</div>
        <div className="mt-16 grid grid-cols-3 gap-3"><Metric value="4 áreas" label="conectadas" /><Metric value="1 visão" label="para decidir" /><Metric value="0 planilhas" label="para manter" /></div>
      </div>
    </section>

    <section id="recursos" className="relative px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionTitle eyebrow="Clareza em ação" title={<>Não é só registrar.<br /><span className="text-slate-500">É saber o que fazer depois.</span></>} description="Recursos desenhados para transformar informação em decisões pequenas e possíveis." />
        <div className="mt-14 grid gap-4 lg:grid-cols-12">
          <article className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-cyan-400/[0.025] p-6 lg:col-span-5 lg:row-span-2"><FeatureCopy {...featureCards[0]} /><SafeSpendMockup /></article>
          <article className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-violet-400/[0.025] p-6 lg:col-span-7"><FeatureCopy {...featureCards[1]} /><ReportMockup /></article>
          <article className="relative overflow-hidden rounded-[2rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.055] to-emerald-400/[0.025] p-6 lg:col-span-7"><FeatureCopy {...featureCards[2]} /><FlowStrip /></article>
        </div>
      </div>
    </section>

    <section id="experiencia" className="relative border-y border-white/[0.06] bg-[#07101e]/75 px-5 py-24 sm:px-8 lg:py-32">
      <div className="mx-auto max-w-[1240px]">
        <SectionTitle eyebrow="Feito para acompanhar você" title={<>Bonito por intenção.<br /><span className="text-slate-500">Útil por padrão.</span></>} description="Uma experiência consistente no computador e no celular, com cada ação importante ao alcance." />
        <div className="relative mt-16 flex min-h-[540px] items-end justify-center overflow-hidden rounded-[2.5rem] border border-white/[0.07] bg-[radial-gradient(circle_at_50%_65%,rgba(6,182,212,.22),transparent_35%)] px-4 pt-12">
          <PhoneMockup className="relative z-10 translate-y-16 -rotate-6 scale-[.88] opacity-65 sm:translate-x-[-20%]" variant="plan" />
          <PhoneMockup className="relative z-20 -translate-y-2 shadow-[0_35px_100px_-25px_rgba(6,182,212,.45)]" variant="home" />
          <PhoneMockup className="relative z-10 translate-y-16 rotate-6 scale-[.88] opacity-65 sm:translate-x-[20%]" variant="money" />
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-3"><Promise icon={Clock3} title="Comece em minutos" text="Um primeiro passo de cada vez, sem configuração cansativa." /><Promise icon={ShieldCheck} title="Dados protegidos" text="Sua conta e suas informações ficam isoladas e seguras." /><Promise icon={CheckCircle2} title="Funciona no seu ritmo" text="Use apenas o que precisa e evolua conforme sua rotina." /></div>
      </div>
    </section>

    <section className="relative overflow-hidden px-5 py-28 text-center sm:px-8 lg:py-40"><div className="pointer-events-none absolute inset-x-0 bottom-[-14rem] mx-auto h-[30rem] max-w-5xl rounded-[50%] border-t-2 border-cyan-300/50 bg-cyan-400/10 shadow-[0_-35px_100px_rgba(6,182,212,.25)] blur-[1px]" /><div className="relative mx-auto max-w-3xl"><p className="text-[9px] font-black uppercase tracking-[.25em] text-cyan-300">Seu próximo passo</p><h2 className="mt-5 font-display text-4xl font-medium leading-tight tracking-[-.055em] sm:text-6xl">Coloque sua vida<br />em um fluxo mais leve.</h2><p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-slate-400">Crie sua conta e comece organizando apenas o que mais importa hoje.</p><button type="button" onClick={onSignup} className="group mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-white px-7 text-xs font-black text-slate-950 transition hover:-translate-y-1">Começar agora <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-1" /></button></div></section>

    <footer className="relative border-t border-white/[0.07] px-5 py-10 sm:px-8"><div className="mx-auto flex max-w-[1240px] flex-col gap-6 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><img src="/lifeflow-logo.png" alt="" className="h-9 w-9" /><div><p className="font-display text-sm font-black">LifeFlow</p><p className="text-[8px] uppercase tracking-[.18em] text-slate-600">Seu ritmo. Seu fluxo.</p></div></div><p className="text-[9px] text-slate-600">© 2026 LifeFlow. Organização para viver com mais clareza.</p><button type="button" onClick={onLogin} className="text-left text-[10px] font-bold text-slate-400 transition hover:text-white sm:text-right">Entrar na minha conta</button></div></footer>
  </main>;
}

function HeroProduct({ reduceMotion }: { reduceMotion: boolean }) {
  return <motion.div initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 45, scale: .96 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: .8, delay: .2 }} className="relative z-10 mx-auto mt-16 max-w-5xl sm:mt-20">
    <FloatingCard className="left-0 top-16 hidden -rotate-6 lg:block" icon={TrendingUp} label="Receitas do mês" value="R$ 4.850" tone="text-emerald-300" />
    <FloatingCard className="right-0 top-28 hidden rotate-6 lg:block" icon={Target} label="Meta em movimento" value="68% concluída" tone="text-amber-300" />
    <div className="relative mx-auto w-full max-w-[780px] overflow-hidden rounded-[2.3rem] border border-white/15 bg-[#081423]/95 p-3 text-left shadow-[0_45px_130px_-35px_rgba(6,182,212,.55)] backdrop-blur-xl sm:p-5">
      <div className="flex items-center justify-between border-b border-white/[0.07] pb-4"><div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-rose-400/70" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300/70" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" /></div><span className="text-[8px] font-black uppercase tracking-[.2em] text-slate-600">LifeFlow central</span><span className="h-7 w-7 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" /></div>
      <div className="grid gap-3 pt-4 md:grid-cols-[1fr_.72fr]"><div className="rounded-[1.6rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.065] to-cyan-400/[0.035] p-5"><p className="text-[9px] font-black uppercase tracking-[.16em] text-cyan-300">Boa noite, Juan.</p><h3 className="mt-2 font-display text-2xl font-black tracking-[-.045em]">Seu dia está em movimento.</h3><p className="mt-1 text-[10px] text-slate-500">Veja o que merece sua atenção agora.</p><div className="mt-6 grid grid-cols-2 gap-2"><MiniStat label="Saldo disponível" value="R$ 2.640" icon={WalletCards} /><MiniStat label="Gasto seguro hoje" value="R$ 86,40" icon={CircleDollarSign} /></div></div><div className="space-y-3"><div className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.04] p-4"><div className="flex items-center justify-between"><span className="text-[9px] font-bold text-slate-400">Seu ritmo</span><span className="text-xs font-black text-emerald-300">72%</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.06]"><span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div></div><div className="rounded-[1.6rem] border border-white/[0.08] bg-white/[0.04] p-4"><p className="text-[9px] font-bold text-slate-400">Próximo passo</p><div className="mt-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-violet-400/10 text-violet-300"><CalendarDays className="h-4 w-4" /></span><div><p className="text-[10px] font-bold">Revisar orçamento</p><p className="text-[8px] text-slate-600">Leva menos de 2 minutos</p></div></div></div></div></div>
    </div>
  </motion.div>;
}

function HeroFinancePhone({ reduceMotion }: { reduceMotion: boolean }) {
  const bars = [42, 58, 48, 76, 64, 88, 72];
  return <motion.div
    aria-hidden="true"
    initial={reduceMotion ? { opacity: .2 } : { opacity: 0, y: 36, rotate: 8, scale: .9 }}
    animate={reduceMotion ? { opacity: .2 } : { opacity: [.16, .24, .16], y: [0, -12, 0], rotate: [8, 5.5, 8], scale: 1 }}
    transition={reduceMotion ? { duration: 0 } : { opacity: { duration: 7, repeat: Infinity, ease: "easeInOut" }, y: { duration: 7, repeat: Infinity, ease: "easeInOut" }, rotate: { duration: 9, repeat: Infinity, ease: "easeInOut" }, scale: { duration: .9 } }}
    className="pointer-events-none absolute left-1/2 top-[-1.5rem] z-0 h-[460px] w-[230px] -translate-x-1/2 overflow-hidden rounded-[3rem] border-[6px] border-slate-700/60 bg-[#081423] p-3 shadow-[0_0_100px_20px_rgba(6,182,212,.2)] blur-[.2px] sm:top-[-3rem] sm:h-[560px] sm:w-[278px] lg:left-[73%] lg:top-[-2rem] lg:h-[610px] lg:w-[302px] lg:opacity-30"
  >
    <div className="absolute inset-0 bg-gradient-to-b from-cyan-400/[0.06] via-transparent to-violet-500/[0.08]" />
    <div className="relative mx-auto h-5 w-24 rounded-full bg-black/90" />
    <div className="relative mt-5 flex items-center justify-between"><div className="flex items-center gap-2"><img src="/lifeflow-logo.png" alt="" className="h-7 w-7" /><div className="text-left"><p className="text-[7px] font-black uppercase tracking-[.16em] text-cyan-300">Dinheiro</p><p className="text-[10px] font-black">Finanças</p></div></div><span className="grid h-7 w-7 place-items-center rounded-full bg-white/[0.06]"><Sparkles className="h-3 w-3 text-cyan-300" /></span></div>
    <div className="relative mt-5 rounded-[1.4rem] border border-white/[0.08] bg-white/[0.045] p-4 text-left"><p className="text-[7px] uppercase tracking-[.14em] text-slate-500">Saldo disponível</p><p className="mt-1 font-display text-xl font-black tracking-[-.04em]">R$ 2.640,00</p><div className="mt-3 flex items-center gap-1.5 text-[7px] font-bold text-emerald-300"><TrendingUp className="h-3 w-3" />12% melhor que o mês anterior</div></div>
    <div className="relative mt-3 grid grid-cols-2 gap-2"><div className="rounded-2xl border border-white/[0.07] bg-emerald-400/[0.06] p-3 text-left"><TrendingUp className="h-3.5 w-3.5 text-emerald-300" /><p className="mt-3 text-[6px] text-slate-500">Receitas</p><p className="mt-1 text-[10px] font-black text-emerald-300">R$ 4.850</p></div><div className="rounded-2xl border border-white/[0.07] bg-rose-400/[0.05] p-3 text-left"><TrendingDown className="h-3.5 w-3.5 text-rose-300" /><p className="mt-3 text-[6px] text-slate-500">Despesas</p><p className="mt-1 text-[10px] font-black text-rose-300">R$ 2.210</p></div></div>
    <div className="relative mt-3 rounded-[1.4rem] border border-white/[0.07] bg-black/15 p-3 text-left"><div className="flex items-center justify-between"><p className="text-[7px] font-bold text-slate-400">Fluxo do mês</p><BarChart3 className="h-3 w-3 text-violet-300" /></div><div className="mt-4 flex h-20 items-end gap-1.5">{bars.map((height, index) => <span key={index} className="flex-1 rounded-t bg-gradient-to-t from-cyan-500/40 to-emerald-300/80" style={{ height: `${height}%` }} />)}</div></div>
    <div className="relative mt-3 rounded-[1.4rem] border border-cyan-300/10 bg-cyan-300/[0.045] p-3 text-left"><p className="text-[6px] font-black uppercase tracking-[.14em] text-cyan-300">Pode gastar hoje</p><div className="mt-1 flex items-end justify-between"><p className="font-display text-lg font-black">R$ 86,40</p><span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[6px] font-bold text-emerald-300">Seguro</span></div></div>
    <div className="absolute inset-x-4 bottom-4 flex justify-around rounded-2xl border border-white/[0.07] bg-black/35 py-3"><LayoutDashboard className="h-3.5 w-3.5 text-slate-600" /><WalletCards className="h-3.5 w-3.5 text-cyan-300" /><Target className="h-3.5 w-3.5 text-slate-600" /></div>
  </motion.div>;
}

function HeroParticles({ reduceMotion }: { reduceMotion: boolean }) {
  const particles = [
    { left: "8%", top: "20%", color: "bg-cyan-300", delay: 0 },
    { left: "18%", top: "52%", color: "bg-lime-300", delay: .8 },
    { left: "84%", top: "18%", color: "bg-violet-300", delay: 1.4 },
    { left: "92%", top: "48%", color: "bg-cyan-300", delay: .3 },
    { left: "72%", top: "63%", color: "bg-emerald-300", delay: 1.8 },
  ];
  return <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-10 hidden sm:block">{particles.map((particle, index) => <motion.span key={index} className={`absolute h-1.5 w-1.5 rounded-full ${particle.color} shadow-[0_0_14px_currentColor]`} style={{ left: particle.left, top: particle.top }} animate={reduceMotion ? undefined : { y: [0, -14, 0], opacity: [.25, .9, .25], scale: [.8, 1.35, .8] }} transition={{ duration: 4 + index * .45, delay: particle.delay, repeat: Infinity, ease: "easeInOut" }} />)}</div>;
}

function FloatingCard({ className, icon: Icon, label, value, tone }: { className: string; icon: typeof TrendingUp; label: string; value: string; tone: string }) { return <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }} className={`absolute z-20 w-44 rounded-2xl border border-white/10 bg-[#0a1728]/90 p-4 text-left shadow-2xl backdrop-blur ${className}`}><Icon className={`h-4 w-4 ${tone}`} /><p className="mt-4 text-[8px] text-slate-500">{label}</p><p className={`mt-1 text-sm font-black ${tone}`}>{value}</p></motion.div>; }
function MiniStat({ label, value, icon: Icon }: { label: string; value: string; icon: typeof WalletCards }) { return <div className="rounded-2xl border border-white/[0.07] bg-black/15 p-3"><Icon className="h-4 w-4 text-cyan-300" /><p className="mt-3 text-[8px] text-slate-500">{label}</p><p className="mt-1 text-xs font-black">{value}</p></div>; }
function SectionTitle({ eyebrow, title, description }: { eyebrow: string; title: React.ReactNode; description: string }) { return <div className="mx-auto max-w-3xl text-center"><p className="text-[9px] font-black uppercase tracking-[.25em] text-cyan-300">{eyebrow}</p><h2 className="mt-5 font-display text-3xl font-medium leading-tight tracking-[-.05em] sm:text-5xl">{title}</h2><p className="mx-auto mt-5 max-w-xl text-xs leading-6 text-slate-500 sm:text-sm">{description}</p></div>; }
function Metric({ value, label }: { value: string; label: string }) { return <div className="rounded-[1.5rem] border border-white/[0.07] bg-white/[0.025] px-3 py-5 text-center sm:px-5"><p className="font-display text-xl font-black tracking-[-.04em] text-lime-300 sm:text-3xl">{value}</p><p className="mt-1 text-[8px] uppercase tracking-[.15em] text-slate-600">{label}</p></div>; }
function FeatureCopy({ icon: Icon, eyebrow, title, description }: typeof featureCards[number]) { return <div className="relative z-10"><span className="grid h-10 w-10 place-items-center rounded-2xl border border-white/[0.08] bg-white/[0.05] text-cyan-300"><Icon className="h-4 w-4" /></span><p className="mt-5 text-[8px] font-black uppercase tracking-[.2em] text-cyan-300">{eyebrow}</p><h3 className="mt-2 font-display text-xl font-black tracking-[-.035em]">{title}</h3><p className="mt-2 max-w-md text-[10px] leading-5 text-slate-500">{description}</p></div>; }
function SafeSpendMockup() { return <div className="mt-9 rounded-[1.5rem] border border-cyan-300/10 bg-[#07111f] p-5"><div className="flex items-center justify-between"><span className="text-[8px] font-bold text-slate-500">Disponível hoje</span><GaugeBadge /></div><p className="mt-2 font-display text-3xl font-black tracking-[-.05em]">R$ 86,40</p><div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.06]"><span className="block h-full w-[64%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div><p className="mt-3 text-[8px] leading-4 text-slate-600">Sem comprometer contas, metas e o restante do mês.</p></div>; }
function GaugeBadge() { return <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[8px] font-bold text-emerald-300">Dentro do plano</span>; }
function ReportMockup() { const bars = [48, 72, 54, 86, 62, 92]; return <div className="mt-7 flex h-36 items-end gap-3 rounded-[1.5rem] border border-white/[0.07] bg-black/15 p-4">{bars.map((height, index) => <div key={index} className="flex flex-1 items-end gap-1"><span className="w-1/2 rounded-t-md bg-emerald-400/70" style={{ height: `${height}%` }} /><span className="w-1/2 rounded-t-md bg-rose-400/60" style={{ height: `${Math.max(25, height - 22)}%` }} /></div>)}</div>; }
function FlowStrip() { return <div className="mt-7 grid grid-cols-4 gap-2">{flowAreas.map(({ icon: Icon, label, tone }) => <div key={label} className="rounded-2xl border border-white/[0.07] bg-black/15 p-3 text-center"><span className={`mx-auto grid h-8 w-8 place-items-center rounded-xl ${tone}`}><Icon className="h-4 w-4" /></span><p className="mt-2 truncate text-[8px] font-bold text-slate-400">{label}</p></div>)}</div>; }
function PhoneMockup({ className, variant }: { className: string; variant: "home" | "plan" | "money" }) { const content = variant === "home" ? ["Seu dia", "3 prioridades", "Ritmo 72%"] : variant === "plan" ? ["Plano do mês", "R$ 2.640 livres", "4 metas"] : ["Finanças", "R$ 86 hoje", "Saldo positivo"]; return <div className={`w-[220px] shrink-0 rounded-[2.5rem] border-[5px] border-slate-800 bg-[#081423] p-3 ${className}`}><div className="mx-auto h-4 w-20 rounded-full bg-black" /><div className="mt-5 flex items-center justify-between"><img src="/lifeflow-logo.png" alt="" className="h-7 w-7" /><span className="h-6 w-6 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500" /></div><p className="mt-8 text-[8px] font-black uppercase tracking-[.15em] text-cyan-300">LifeFlow</p><p className="mt-2 font-display text-xl font-black">{content[0]}</p><div className="mt-5 rounded-2xl border border-white/[0.08] bg-white/[0.05] p-4"><BarChart3 className="h-4 w-4 text-emerald-300" /><p className="mt-5 text-sm font-black">{content[1]}</p><p className="mt-1 text-[8px] text-slate-500">{content[2]}</p><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><span className="block h-full w-[72%] rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400" /></div></div><div className="mt-3 grid grid-cols-2 gap-2"><span className="h-20 rounded-2xl bg-white/[0.04]" /><span className="h-20 rounded-2xl bg-white/[0.04]" /></div><div className="mt-5 flex justify-around rounded-2xl border border-white/[0.07] bg-black/20 py-3"><LayoutDashboard className="h-4 w-4 text-cyan-300" /><WalletCards className="h-4 w-4 text-slate-600" /><Target className="h-4 w-4 text-slate-600" /></div></div>; }
function Promise({ icon: Icon, title, text }: { icon: typeof Clock3; title: string; text: string }) { return <div className="flex items-start gap-3 rounded-2xl border border-white/[0.07] bg-white/[0.025] p-4"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300"><Icon className="h-4 w-4" /></span><div><p className="text-[11px] font-bold">{title}</p><p className="mt-1 text-[9px] leading-4 text-slate-500">{text}</p></div></div>; }
