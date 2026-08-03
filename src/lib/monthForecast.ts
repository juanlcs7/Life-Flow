import { getDate, getDaysInMonth, isAfter, isSameMonth, parseISO, startOfMonth } from "date-fns";
import type { Transaction } from "@/hooks/useTransactions";

export type ForecastConfidence = "low" | "medium" | "high";

export interface MonthForecastData {
  incomeSoFar: number;
  expensesSoFar: number;
  currentBalance: number;
  averageDailyExpense: number;
  fixedExpensesSoFar: number;
  variableExpensesSoFar: number;
  upcomingFixedExpenses: number;
  projectedExpenses: number;
  projectedBalance: number;
  expectedAdditionalExpenses: number;
  elapsedDays: number;
  totalDays: number;
  expenseDays: number;
  confidence: ForecastConfidence;
}

export interface FixedExpensePattern {
  description: string;
  amount: number;
}

export interface MonthForecastOptions {
  fixedExpensePatterns?: FixedExpensePattern[];
  upcomingFixedExpenses?: number;
}

const normalizeDescription = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

export function calculateMonthForecast(
  transactions: Transaction[],
  now = new Date(),
  options: MonthForecastOptions = {},
): MonthForecastData {
  const monthStart = startOfMonth(now);
  const elapsedDays = getDate(now);
  const totalDays = getDaysInMonth(now);
  const monthTransactions = transactions.filter((transaction) => {
    const date = parseISO(transaction.date);
    return isSameMonth(date, now) && !isAfter(date, now) && date >= monthStart;
  });
  const incomeSoFar = monthTransactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = monthTransactions.filter((transaction) => transaction.type === "expense");
  const expensesSoFar = expenses.reduce((total, transaction) => total + transaction.amount, 0);
  const fixedPatterns = options.fixedExpensePatterns ?? [];
  const isFixedExpense = (transaction: Transaction) => fixedPatterns.some((pattern) =>
    normalizeDescription(pattern.description) === normalizeDescription(transaction.description)
    && Math.abs(pattern.amount - transaction.amount) < 0.01,
  );
  const fixedExpenses = expenses.filter(isFixedExpense);
  const variableExpenses = expenses.filter((transaction) => !isFixedExpense(transaction));
  const fixedExpensesSoFar = fixedExpenses.reduce((total, transaction) => total + transaction.amount, 0);
  const variableExpensesSoFar = variableExpenses.reduce((total, transaction) => total + transaction.amount, 0);
  const upcomingFixedExpenses = Math.max(0, options.upcomingFixedExpenses ?? 0);
  const expenseDays = new Set(variableExpenses.map((transaction) => transaction.date)).size;
  const averageDailyExpense = variableExpensesSoFar / elapsedDays;
  const projectedVariableExpenses = averageDailyExpense * totalDays;
  const projectedExpenses = fixedExpensesSoFar + upcomingFixedExpenses + projectedVariableExpenses;
  const expectedAdditionalExpenses = upcomingFixedExpenses + Math.max(0, projectedVariableExpenses - variableExpensesSoFar);
  const confidence: ForecastConfidence = expenseDays >= 7 ? "high" : expenseDays >= 3 ? "medium" : "low";

  return {
    incomeSoFar,
    expensesSoFar,
    currentBalance: incomeSoFar - expensesSoFar,
    averageDailyExpense,
    fixedExpensesSoFar,
    variableExpensesSoFar,
    upcomingFixedExpenses,
    projectedExpenses,
    projectedBalance: incomeSoFar - projectedExpenses,
    expectedAdditionalExpenses,
    elapsedDays,
    totalDays,
    expenseDays,
    confidence,
  };
}
