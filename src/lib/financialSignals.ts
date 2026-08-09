import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import type { Transaction } from "@/hooks/useTransactions";

export interface FinancialSignal {
  id: string;
  type: "pace" | "unusual" | "cashflow" | "saving";
  severity: "positive" | "attention" | "danger";
  title: string;
  description: string;
  category?: string;
  value: number;
  changePercent?: number;
}

const localDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

const sumByType = (items: Transaction[], type: Transaction["type"]) => items.filter((item) => item.type === type).reduce((total, item) => total + Number(item.amount), 0);

export function buildFinancialSignals(transactions: Transaction[], now = new Date()): FinancialSignal[] {
  const currentStart = startOfMonth(now);
  const currentEnd = endOfMonth(now);
  const previousDate = subMonths(now, 1);
  const previousStart = startOfMonth(previousDate);
  const previousEnd = endOfMonth(previousDate);
  const elapsedDays = Math.max(1, now.getDate());
  const daysInMonth = currentEnd.getDate();
  const current = transactions.filter((item) => {
    const date = localDate(item.date);
    return date >= currentStart && date <= currentEnd;
  });
  const previous = transactions.filter((item) => {
    const date = localDate(item.date);
    return date >= previousStart && date <= previousEnd;
  });
  const signals: FinancialSignal[] = [];

  const currentExpenses = sumByType(current, "expense");
  const currentIncome = sumByType(current, "income");
  const projectedExpenses = (currentExpenses / elapsedDays) * daysInMonth;
  if (currentIncome > 0 && projectedExpenses > currentIncome * 1.05) {
    signals.push({ id: "cashflow-risk", type: "cashflow", severity: "danger", title: "O mês pode fechar no negativo", description: `No ritmo atual, as despesas podem superar sua renda em ${Math.round(((projectedExpenses - currentIncome) / currentIncome) * 100)}%.`, value: projectedExpenses - currentIncome });
  } else if (currentIncome > 0 && projectedExpenses <= currentIncome * 0.75) {
    signals.push({ id: "saving-room", type: "saving", severity: "positive", title: "Existe espaço para guardar dinheiro", description: `Mantendo o ritmo atual, cerca de ${Math.round((1 - projectedExpenses / currentIncome) * 100)}% da renda pode permanecer livre.`, value: currentIncome - projectedExpenses });
  }

  const categoryTotals = (items: Transaction[]) => {
    const totals = new Map<string, number>();
    items.filter((item) => item.type === "expense").forEach((item) => totals.set(item.category, (totals.get(item.category) ?? 0) + Number(item.amount)));
    return totals;
  };
  const currentCategories = categoryTotals(current);
  const previousCategories = categoryTotals(previous);
  currentCategories.forEach((spent, category) => {
    const previousSpent = previousCategories.get(category) ?? 0;
    if (previousSpent < 30 || spent < 30) return;
    const projected = (spent / elapsedDays) * daysInMonth;
    const change = ((projected - previousSpent) / previousSpent) * 100;
    if (change >= 30) signals.push({ id: `pace-${category}`, type: "pace", severity: change >= 70 ? "danger" : "attention", title: `${category} acelerou`, description: `Mantendo este ritmo, a categoria pode terminar ${Math.round(change)}% acima do mês anterior.`, category, value: projected, changePercent: change });
    if (change <= -25 && spent >= 20) signals.push({ id: `saving-${category}`, type: "saving", severity: "positive", title: `Você reduziu em ${category}`, description: `A projeção está ${Math.abs(Math.round(change))}% abaixo do mês anterior.`, category, value: previousSpent - projected, changePercent: change });
  });

  const recentStart = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - 6));
  current.filter((item) => item.type === "expense" && localDate(item.date) >= recentStart).forEach((item) => {
    const history = transactions.filter((candidate) => candidate.type === "expense" && candidate.category === item.category && candidate.id !== item.id).map((candidate) => Number(candidate.amount)).sort((a, b) => a - b);
    if (history.length < 3) return;
    const median = history[Math.floor(history.length / 2)];
    if (Number(item.amount) >= Math.max(100, median * 2.5)) signals.push({ id: `unusual-${item.id}`, type: "unusual", severity: "attention", title: "Despesa fora do padrão", description: `${item.description} foi bem maior que o valor habitual em ${item.category}.`, category: item.category, value: Number(item.amount), changePercent: median > 0 ? ((Number(item.amount) - median) / median) * 100 : undefined });
  });

  const priority = { danger: 0, attention: 1, positive: 2 } as const;
  return signals.sort((a, b) => priority[a.severity] - priority[b.severity]).slice(0, 6);
}
