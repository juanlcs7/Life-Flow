import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import type { Transaction } from "@/hooks/useTransactions";

export interface SmartBudgetSuggestion {
  category: string;
  average: number;
  suggestedAmount: number;
  variability: number;
  confidence: "high" | "medium";
  monthsWithData: number;
}

const localDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function buildSmartBudgetSuggestions(transactions: Transaction[], now = new Date()): SmartBudgetSuggestion[] {
  const months = [1, 2, 3].map((offset) => {
    const date = subMonths(now, offset);
    return { key: `${date.getFullYear()}-${date.getMonth()}`, start: startOfMonth(date), end: endOfMonth(date) };
  });
  const categories = new Map<string, Map<string, number>>();
  transactions.filter((item) => item.type === "expense").forEach((item) => {
    const date = localDate(item.date);
    const month = months.find((candidate) => date >= candidate.start && date <= candidate.end);
    if (!month) return;
    const totals = categories.get(item.category) ?? new Map<string, number>();
    totals.set(month.key, (totals.get(month.key) ?? 0) + Number(item.amount));
    categories.set(item.category, totals);
  });

  return [...categories.entries()].flatMap(([category, totals]) => {
    if (totals.size < 2) return [];
    const values = months.map((month) => totals.get(month.key) ?? 0);
    const average = values.reduce((total, value) => total + value, 0) / values.length;
    if (average < 20) return [];
    const variance = values.reduce((total, value) => total + (value - average) ** 2, 0) / values.length;
    const variability = average > 0 ? Math.sqrt(variance) / average : 0;
    const buffer = variability <= 0.2 ? 1.05 : variability <= 0.45 ? 1.1 : 1.15;
    const suggestedAmount = Math.ceil((average * buffer) / 10) * 10;
    return [{ category, average, suggestedAmount, variability, confidence: variability <= 0.35 && totals.size === 3 ? "high" : "medium", monthsWithData: totals.size } as SmartBudgetSuggestion];
  }).sort((a, b) => b.average - a.average);
}
