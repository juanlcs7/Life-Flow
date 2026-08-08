import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CalendarDays,
  Check,
  Clock3,
  CircleDollarSign,
  Crown,
  FileText,
  HeartPulse,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  WalletCards,
  Zap,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePlan, PLAN_LIMITS, PREMIUM_PRICE } from "@/hooks/usePlan";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Context such as "Você atingiu o limite de transações". */
  reason?: string | null;
  /** Ready for the future Asaas checkout integration. */
  onSubscribe?: () => void;
  isSubscribing?: boolean;
}

const premiumHighlights = [
  {
    icon: InfinityIcon,
    title: "Liberdade para organizar",
    description: "Registre transações, investimentos e metas sem se preocupar com limites.",
    tone: "from-violet-500/15 to-primary/5 text-violet-600 dark:text-violet-300",
  },
  {
    icon: BrainCircuit,
    title: "Inteligência financeira",
    description: "Receba resumo semanal, previsão de saldo e uma leitura prática dos seus gastos.",
    tone: "from-cyan-500/15 to-info/5 text-cyan-700 dark:text-cyan-300",
  },
  {
    icon: CircleDollarSign,
    title: "Decisões antes da compra",
    description: "Simule compras e organize dívidas com estratégias de avalanche ou bola de neve.",
    tone: "from-emerald-500/15 to-success/5 text-emerald-700 dark:text-emerald-300",
  },
];

const connectedModules = [
  { icon: WalletCards, label: "Finanças" },
  { icon: CalendarDays, label: "Agenda" },
  { icon: Target, label: "Metas" },
  { icon: HeartPulse, label: "Hábitos" },
  { icon: FileText, label: "Documentos" },
  { icon: Users, label: "Contatos" },
];

const comparison = [
  { label: "Transações mensais", free: `${PLAN_LIMITS.free.transactionsPerMonth}`, premium: "Ilimitadas" },
  { label: "Investimentos", free: `${PLAN_LIMITS.free.investments}`, premium: "Ilimitados" },
  { label: "Metas ativas", free: `${PLAN_LIMITS.free.goals}`, premium: "Ilimitadas" },
  { label: "Relatórios avançados", free: false, premium: true },
  { label: "Exportações e análises", free: false, premium: true },
  { label: "Previsão financeira de 90 dias", free: false, premium: true },
  { label: "Simulador de compras e dívidas", free: false, premium: true },
];

function Availability({ value }: { value: string | boolean }) {
  if (typeof value === "string") return <span>{value}</span>;
  return value
    ? <Check className="mx-auto h-4 w-4 text-success" aria-label="Incluído" />
    : <span className="text-muted-foreground/55" aria-label="Não incluído">—</span>;
}

export function PremiumModal({ open, onOpenChange, reason, onSubscribe, isSubscribing = false }: Props) {
  const { isPremium, premiumUntil } = usePlan();
  const reduceMotion = useReducedMotion();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[94vh] overflow-y-auto border-primary/15 bg-card p-0 sm:max-w-4xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Conheça o LifeFlow Premium</DialogTitle>
          <DialogDescription>Compare os planos e veja tudo que o Premium desbloqueia.</DialogDescription>
        </DialogHeader>

        <section className="relative overflow-hidden border-b border-border/60 bg-gradient-to-br from-slate-950 via-indigo-950 to-cyan-950 px-5 pb-7 pt-8 text-white sm:px-8 sm:pb-9 sm:pt-10">
          <motion.div
            className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-violet-500/30 blur-3xl"
            animate={reduceMotion ? undefined : { scale: [1, 1.14, 1], opacity: [0.55, 0.9, 0.55] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -bottom-28 left-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"
            animate={reduceMotion ? undefined : { x: [0, 38, 0], y: [0, -15, 0] }}
            transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_75%_20%,rgba(255,255,255,.09),transparent_25%)]" />

          <div className="relative grid gap-7 md:grid-cols-[1.25fr_.75fr] md:items-center">
            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45 }}
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1.5 text-xs font-semibold text-amber-100">
                <Crown className="h-4 w-4" />LifeFlow Premium
              </div>
              <h2 className="mt-5 max-w-xl font-display text-3xl font-bold leading-tight tracking-[-0.035em] sm:text-4xl">
                Decida melhor. Organize mais rápido.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Tenha uma visão inteligente do seu dinheiro e liberdade para administrar toda a sua rotina sem limites no caminho.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                {["Sem anúncios", "Dados protegidos", "Cancele quando quiser"].map((item) => (
                  <span key={item} className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-[11px] text-slate-200">
                    <Check className="h-3 w-3 text-emerald-300" />{item}
                  </span>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={reduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.45, delay: 0.08 }}
              className="relative rounded-[1.6rem] border border-white/15 bg-white/[0.09] p-5 shadow-2xl backdrop-blur-xl"
            >
              <div className="absolute -right-2 -top-3 rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-950 shadow-lg">
                Plano completo
              </div>
              <p className="text-xs font-medium text-cyan-100">Assinatura mensal</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                <span className="mr-1 text-base font-medium text-slate-300">R$</span>
                {PREMIUM_PRICE.toFixed(2).replace(".", ",")}
                <span className="ml-1 text-sm font-normal text-slate-300">/mês</span>
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300">Menos que R$ 0,67 por dia para organizar sua vida inteira.</p>
              <div className="my-4 h-px bg-white/10" />
              <div className="space-y-2 text-xs text-slate-200">
                <p className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-emerald-300" />Pagamento seguro</p>
                <p className="flex items-center gap-2"><Zap className="h-4 w-4 text-amber-300" />Ativação automática após confirmação</p>
              </div>
            </motion.div>
          </div>
        </section>

        <div className="space-y-7 p-5 sm:p-8">
          {reason && (
            <div className="flex items-start gap-3 rounded-2xl border border-warning/25 bg-gradient-to-r from-warning/10 to-transparent p-4 text-sm">
              <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
              <div><p className="font-semibold">Você está crescendo no LifeFlow</p><p className="mt-1 text-muted-foreground">{reason}</p></div>
            </div>
          )}

          <section>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">O que você desbloqueia</p>
              <h3 className="mt-2 font-display text-2xl font-bold">Seu LifeFlow, sem barreiras</h3>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {premiumHighlights.map(({ icon: Icon, title, description, tone }, index) => (
                <motion.article
                  key={title}
                  initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.12 + index * 0.07 }}
                  className={cn("rounded-2xl border border-border/60 bg-gradient-to-br p-4 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg motion-reduce:hover:translate-y-0", tone)}
                >
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-background/75 shadow-sm"><Icon className="h-5 w-5" /></span>
                  <h4 className="mt-4 text-sm font-bold text-foreground">{title}</h4>
                  <p className="mt-1.5 text-xs leading-5 text-muted-foreground">{description}</p>
                </motion.article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.6rem] border border-primary/15 bg-gradient-to-r from-primary/[0.06] via-card to-accent/[0.055] p-5 sm:p-6">
            <div className="grid gap-5 md:grid-cols-[.8fr_1.2fr] md:items-center">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Tudo conectado</p>
                <h3 className="mt-2 font-display text-xl font-bold">Uma assinatura. Sua vida no mesmo lugar.</h3>
                <p className="mt-2 text-xs leading-5 text-muted-foreground">O valor do LifeFlow está na conexão entre as áreas que fazem parte do seu dia.</p>
              </div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {connectedModules.map(({ icon: Icon, label }) => (
                  <div key={label} className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/65 px-3 py-2.5 text-xs font-medium shadow-sm">
                    <Icon className="h-4 w-4 text-primary" />{label}
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <div className="mb-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Compare os planos</p>
              <h3 className="mt-1 font-display text-xl font-bold">Escolha o ritmo que combina com você</h3>
            </div>
            <div className="overflow-hidden rounded-2xl border border-border/70">
              <div className="grid grid-cols-[1.35fr_.65fr_.65fr] bg-muted/45 px-4 py-3 text-xs font-semibold sm:px-5">
                <span>Recurso</span><span className="text-center">Gratuito</span><span className="text-center text-primary">Premium</span>
              </div>
              {comparison.map((item) => (
                <div key={item.label} className="grid grid-cols-[1.35fr_.65fr_.65fr] items-center border-t border-border/60 px-4 py-3 text-xs sm:px-5">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-center text-muted-foreground"><Availability value={item.free} /></span>
                  <span className="text-center font-semibold text-primary"><Availability value={item.premium} /></span>
                </div>
              ))}
            </div>
          </section>

          {isPremium ? (
            <div className="rounded-2xl border border-success/20 bg-success/[0.07] p-4 text-center">
              <p className="text-sm font-semibold text-success">Você já aproveita o LifeFlow Premium</p>
              <p className="mt-1 text-xs text-muted-foreground">{premiumUntil ? `Seu acesso está ativo até ${new Date(premiumUntil).toLocaleDateString("pt-BR")}.` : "Seu acesso está ativo."}</p>
              <Button variant="outline" className="mt-4 w-full sm:w-auto" onClick={() => onOpenChange(false)}>Continuar no LifeFlow</Button>
            </div>
          ) : (
            <div className="sticky bottom-0 -mx-5 -mb-5 border-t border-border/70 bg-card/95 px-5 py-4 shadow-[0_-16px_35px_-28px_rgba(15,23,42,.45)] backdrop-blur-xl sm:-mx-8 sm:-mb-8 sm:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold">Menos esforço para administrar. Mais clareza para viver.</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">R$ {PREMIUM_PRICE.toFixed(2).replace(".", ",")} por mês • cancele quando quiser</p>
                </div>
                <Button
                  size="lg"
                  onClick={onSubscribe}
                  disabled={!onSubscribe || isSubscribing}
                  className="min-w-56 bg-gradient-to-r from-violet-600 via-primary to-cyan-500 text-white shadow-lg shadow-primary/20 hover:brightness-110"
                >
                  {onSubscribe ? "Quero simplificar minha rotina" : "Pagamento disponível em breve"}
                  {onSubscribe ? <ArrowRight className="ml-2 h-4 w-4" /> : <Clock3 className="ml-2 h-4 w-4" />}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
