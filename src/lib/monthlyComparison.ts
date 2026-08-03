import { endOfMonth, parseISO, startOfMonth, subMonths } from "date-fns";
import type { Transaction } from "@/hooks/useTransactions";

export interface MonthTotals {
  income: number;
  expenses: number;
  balance: number;
  count: number;
}

export interface CategoryChange {
  category: string;
  current: number;
  previous: number;
  difference: number;
}

export interface MonthlyComparisonData {
  current: MonthTotals;
  previous: MonthTotals;
  incomeChange: number | null;
  expenseChange: number | null;
  balanceChange: number | null;
  largestExpenseIncrease: CategoryChange | null;
}

function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

function transactionsInMonth(transactions: Transaction[], month: Date) {
  const start = startOfMonth(month);
  const end = endOfMonth(month);
  return transactions.filter((transaction) => {
    const date = parseISO(transaction.date);
    return date >= start && date <= end;
  });
}

function totalsFor(transactions: Transaction[]): MonthTotals {
  const income = transactions
    .filter((transaction) => transaction.type === "income")
    .reduce((total, transaction) => total + transaction.amount, 0);
  const expenses = transactions
    .filter((transaction) => transaction.type === "expense")
    .reduce((total, transaction) => total + transaction.amount, 0);
  return { income, expenses, balance: income - expenses, count: transactions.length };
}

function expenseCategories(transactions: Transaction[]) {
  const totals = new Map<string, number>();
  transactions
    .filter((transaction) => transaction.type === "expense")
    .forEach((transaction) => {
      totals.set(transaction.category, (totals.get(transaction.category) ?? 0) + transaction.amount);
    });
  return totals;
}

export function calculateMonthlyComparison(
  transactions: Transaction[],
  selectedMonth: Date,
): MonthlyComparisonData {
  const currentTransactions = transactionsInMonth(transactions, selectedMonth);
  const previousTransactions = transactionsInMonth(transactions, subMonths(selectedMonth, 1));
  const current = totalsFor(currentTransactions);
  const previous = totalsFor(previousTransactions);
  const currentCategories = expenseCategories(currentTransactions);
  const previousCategories = expenseCategories(previousTransactions);

  const largestExpenseIncrease = [...new Set([...currentCategories.keys(), ...previousCategories.keys()])]
    .map((category) => {
      const currentAmount = currentCategories.get(category) ?? 0;
      const previousAmount = previousCategories.get(category) ?? 0;
      return {
        category,
        current: currentAmount,
        previous: previousAmount,
        difference: currentAmount - previousAmount,
      };
    })
    .filter((item) => item.difference > 0)
    .sort((a, b) => b.difference - a.difference)[0] ?? null;

  return {
    current,
    previous,
    incomeChange: percentageChange(current.income, previous.income),
    expenseChange: percentageChange(current.expenses, previous.expenses),
    balanceChange: percentageChange(current.balance, previous.balance),
    largestExpenseIncrease,
  };
}

