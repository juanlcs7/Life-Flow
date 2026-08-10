import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Bar, CartesianGrid, Cell, ComposedChart, Line, Pie, PieChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, BarChart3, Gauge, Lightbulb, Loader2, PieChartIcon, ReceiptText, Scale, Sparkles, TrendingUp, WalletCards } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Transaction } from "@/hooks/useTransactions";
import { buildFinancialReport } from "@/lib/financialReports";
import { cn } from "@/lib/utils";

interface AdvancedReportsProps {
  transactions: Transaction[];
  isLoading: boolean;
}

const COLORS = ["#14b8a6", "#8b5cf6", "#f59e0b", "#f43f5e", "#38bdf8", "#64748b"];
const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const compactMoney = (value: number) => value >= 1000 ? `R$ ${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil` : money(value);

function DeltaBadge({ value, positiveIsGood = true }: { value: number; positiveIsGood?: boolean }) {
  const improved = value === 0 ? null : positiveIsGood ? value > 0 : value < 0;
  const Icon = value >= 0 ? ArrowUpRight : ArrowDownRight;
  return <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold", improved === null ? "bg-muted text-muted-foreground" : improved ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-600")}><Icon className="h-3 w-3" />{Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%</span>;
}

export function AdvancedReports({ transactions, isLoading }: AdvancedReportsProps) {
  const [period, setPeriod] = useState<6 | 12>(6);
  const reduceMotion = useReducedMotion();
  const report = useMemo(() => buildFinancialReport(transactions, new Date(), period), [period, transactions]);
  const categoryChart = useMemo(() => {
    const top = report.categories.slice(0, 5);
    const others = report.categories.slice(5).reduce((total, item) => total + item.value, 0);
    return others > 0 ? [...top, { name: "Outras", value: others, percent: report.current.expenses > 0 ? (others / report.current.expenses) * 100 : 0 }] : top;
  }, [report]);
  const insights = useMemo(() => {
    const items: Array<{ title: string; text: string; tone: string }> = [];
    if (report.current.income === 0) items.push({ title: "Receita ainda não registrada", text: "Cadastre as entradas do mês para que saldo e taxa de economia representem sua realidade.", tone: "amber" });
    if (report.current.balance < 0) items.push({ title: "O mês está no negativo", text: `As despesas ultrapassaram as receitas em ${money(Math.abs(report.current.balance))}.`, tone: "rose" });
    else if (report.current.savingsRate >= 20) items.push({ title: "Boa capacidade de economia", text: `${report.current.savingsRate.toFixed(0)}% da renda permaneceu livre neste mês.`, tone: "emerald" });
    if (report.changes.expenses > 10) items.push({ title: "Despesas aceleraram", text: `Você gastou ${report.changes.expenses.toFixed(0)}% a mais que no mês anterior.`, tone: "rose" });
    if (report.categories[0]?.percent > 35) items.push({ title: `${report.categories[0].name} concentra seus gastos`, text: `Essa categoria representa ${report.categories[0].percent.toFixed(0)}% das despesas do mês.`, tone: "amber" });
    if (items.length === 0) items.push({ title: "Fluxo sob controle", text: "Não há desvios relevantes em relação ao mês anterior.", tone: "emerald" });
    return items.slice(0, 3);
  }, [report]);

  if (isLoading) return <div className="flex items-center justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-finance" /></div>;
  if (transactions.length === 0) return <Card className="rounded-[1.75rem] border-finance/15 bg-gradient-to-br from-card to-finance/[0.05] p-10 text-center"><span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-finance/10 text-finance"><PieChartIcon className="h-6 w-6" /></span><h3 className="mt-4 font-display text-lg font-bold">Seus relatórios começam com um lançamento</h3><p className="mx-auto mt-2 max-w-md text-xs leading-5 text-muted-foreground">Adicione receitas e despesas para visualizar comparações, categorias e evolução mensal.</p></Card>;

  const summaryCards = [
    { label: "Receitas", value: report.current.income, change: report.changes.income, icon: TrendingUp, tone: "text-emerald-600 bg-emerald-500/10", positive: true },
    { label: "Despesas", value: report.current.expenses, change: report.changes.expenses, icon: ReceiptText, tone: "text-rose-600 bg-rose-500/10", positive: false },
    { label: "Saldo do mês", value: report.current.balance, change: report.changes.balance, icon: WalletCards, tone: report.current.balance >= 0 ? "text-cyan-600 bg-cyan-500/10" : "text-rose-600 bg-rose-500/10", positive: true },
    { label: "Taxa de economia", value: report.current.savingsRate, icon: Gauge, tone: "text-violet-600 bg-violet-500/10", positive: true },
  ];

  return <div className="space-y-4 sm:space-y-6">
    <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-card/55 p-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-finance/10 text-finance"><BarChart3 className="h-4.5 w-4.5" /></span><div><p className="text-xs font-extrabold">Janela de análise</p><p className="text-[10px] text-muted-foreground">O resumo e as categorias sempre representam o mês atual.</p></div></div><div className="grid grid-cols-2 rounded-xl bg-muted/60 p-1">{([6, 12] as const).map((months) => <button key={months} type="button" onClick={() => setPeriod(months)} className={cn("rounded-lg px-4 py-2 text-[10px] font-bold transition-all", period === months ? "bg-background text-foreground shadow-sm" : "text-muted-foreground")}>{months} meses</button>)}</div></div>

    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{summaryCards.map((item, index) => { const Icon = item.icon; const isRate = item.label === "Taxa de economia"; return <motion.div key={item.label} initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}><Card className="h-full rounded-[1.4rem] p-4"><div className="flex items-start justify-between gap-2"><span className={cn("grid h-9 w-9 place-items-center rounded-2xl", item.tone)}><Icon className="h-4 w-4" /></span>{!isRate && <DeltaBadge value={item.change ?? 0} positiveIsGood={item.positive} />}</div><p className="mt-4 text-[10px] text-muted-foreground">{item.label}</p><p className={cn("mt-1 truncate font-display text-lg font-black tracking-tight", item.label === "Saldo do mês" && report.current.balance < 0 && "text-rose-600")}>{isRate ? `${item.value.toFixed(1)}%` : money(item.value)}</p><p className="mt-1 text-[9px] text-muted-foreground">{isRate ? "da receita permaneceu livre" : "comparado ao mês anterior"}</p></Card></motion.div>; })}</div>

    <Card className="overflow-hidden rounded-[1.75rem] border-finance/10 bg-gradient-to-br from-card to-finance/[0.035] p-4 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-finance">Entrou, saiu, sobrou</p><h3 className="mt-1 font-display text-lg font-black">Evolução do fluxo</h3><p className="mt-1 text-[10px] text-muted-foreground">Barras mostram receitas e despesas; a linha mostra o saldo de cada mês.</p></div><div className="flex flex-wrap gap-3 rounded-xl border border-border/50 bg-background/50 px-3 py-2 text-[9px] text-muted-foreground"><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-emerald-500" />Receitas</span><span className="flex items-center gap-1.5"><i className="h-2 w-2 rounded-sm bg-rose-500" />Despesas</span><span className="flex items-center gap-1.5"><i className="h-0.5 w-3 bg-violet-500" />Saldo</span></div></div><div className="mt-5 h-64 sm:h-80"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={report.evolution} margin={{ top: 10, right: 4, left: -18, bottom: 0 }}><CartesianGrid vertical={false} strokeDasharray="4 6" stroke="hsl(var(--border))" opacity={0.65} /><XAxis dataKey="month" axisLine={false} tickLine={false} fontSize={10} stroke="hsl(var(--muted-foreground))" /><YAxis axisLine={false} tickLine={false} fontSize={9} stroke="hsl(var(--muted-foreground))" tickFormatter={(value) => value >= 1000 ? `${Math.round(value / 1000)}k` : value} /><Tooltip contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 14, fontSize: 11, boxShadow: "0 16px 40px hsl(220 30% 5% / .2)" }} formatter={(value: number, name: string) => [money(value), name === "income" ? "Receitas" : name === "expenses" ? "Despesas" : "Saldo"]} labelFormatter={(label) => `Mês: ${label}`} /><ReferenceLine y={0} stroke="hsl(var(--border))" /><Bar dataKey="income" fill="#10b981" radius={[5, 5, 0, 0]} maxBarSize={22} /><Bar dataKey="expenses" fill="#f43f5e" radius={[5, 5, 0, 0]} maxBarSize={22} /><Line type="monotone" dataKey="balance" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3, fill: "#8b5cf6", strokeWidth: 0 }} activeDot={{ r: 5 }} /></ComposedChart></ResponsiveContainer></div></Card>

    <div className="grid gap-4 lg:grid-cols-[.9fr_1.1fr]">
      <Card className="rounded-[1.75rem] border-finance/10 bg-gradient-to-br from-card to-violet-500/[0.035] p-4 sm:p-5"><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-violet-600">Mês atual</p><h3 className="mt-1 font-display text-lg font-black">Destino das despesas</h3><p className="mt-1 text-[10px] text-muted-foreground">Participação de cada categoria no total gasto.</p></div>{categoryChart.length === 0 ? <div className="grid h-56 place-items-center text-xs text-muted-foreground">Nenhuma despesa registrada neste mês.</div> : <div className="mt-4 grid items-center gap-3 sm:grid-cols-[.85fr_1.15fr]"><div className="relative h-48"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryChart} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3} stroke="transparent">{categoryChart.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value: number) => money(value)} contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 11 }} /></PieChart></ResponsiveContainer><div className="pointer-events-none absolute inset-0 grid place-items-center text-center"><div><p className="text-[9px] text-muted-foreground">Total</p><p className="text-xs font-black">{compactMoney(report.current.expenses)}</p></div></div></div><div className="space-y-2.5">{categoryChart.map((category, index) => <div key={category.name}><div className="flex items-center gap-2 text-[10px]"><span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[index % COLORS.length] }} /><span className="min-w-0 flex-1 truncate font-semibold">{category.name}</span><strong>{category.percent.toFixed(0)}%</strong><span className="w-20 text-right text-muted-foreground">{compactMoney(category.value)}</span></div><div className="ml-4 mt-1 h-1 overflow-hidden rounded-full bg-muted"><span className="block h-full rounded-full" style={{ width: `${category.percent}%`, background: COLORS[index % COLORS.length] }} /></div></div>)}</div></div>}</Card>

      <Card className="rounded-[1.75rem] border-finance/10 bg-gradient-to-br from-card to-amber-500/[0.035] p-4 sm:p-5"><div className="flex items-start gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600"><Lightbulb className="h-4.5 w-4.5" /></span><div><p className="text-[9px] font-black uppercase tracking-[.18em] text-amber-600">Leitura do LifeFlow</p><h3 className="mt-1 font-display text-lg font-black">O que estes números dizem</h3><p className="mt-1 text-[10px] text-muted-foreground">Conclusões objetivas baseadas no mês atual.</p></div></div><div className="mt-5 space-y-3">{insights.map((insight, index) => <div key={insight.title} className={cn("flex items-start gap-3 rounded-2xl border p-3.5", insight.tone === "rose" ? "border-rose-500/15 bg-rose-500/[0.05]" : insight.tone === "amber" ? "border-amber-500/15 bg-amber-500/[0.05]" : "border-emerald-500/15 bg-emerald-500/[0.05]")}><span className={cn("mt-1 h-2 w-2 shrink-0 rounded-full", insight.tone === "rose" ? "bg-rose-500" : insight.tone === "amber" ? "bg-amber-500" : "bg-emerald-500")} /><div><p className="text-xs font-extrabold">{insight.title}</p><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{insight.text}</p></div></div>)}</div><div className="mt-4 flex items-center gap-2 rounded-xl border border-border/45 bg-background/45 px-3 py-2.5 text-[9px] text-muted-foreground"><Scale className="h-4 w-4 text-finance" />Saldo anterior: <strong className="text-foreground">{money(report.previous.balance)}</strong><Sparkles className="ml-auto h-3.5 w-3.5 text-violet-500" /></div></Card>
    </div>
  </div>;
}
