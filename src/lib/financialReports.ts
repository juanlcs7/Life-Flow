import { endOfMonth, format, isWithinInterval, parseISO, startOfMonth, subMonths } from "date-fns";

export interface ReportTransaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

const totalByType = (transactions: ReportTransaction[], type: ReportTransaction["type"]) => transactions.filter((item) => item.type === type).reduce((total, item) => total + Number(item.amount), 0);

function monthTransactions(transactions: ReportTransaction[], date: Date) {
  const interval = { start: startOfMonth(date), end: endOfMonth(date) };
  return transactions.filter((item) => isWithinInterval(parseISO(item.date), interval));
}

function monthSummary(transactions: ReportTransaction[]) {
  const income = totalByType(transactions, "income");
  const expenses = totalByType(transactions, "expense");
  const balance = income - expenses;
  const savingsRate = income > 0 ? (balance / income) * 100 : 0;
  return { income, expenses, balance, savingsRate };
}

export function percentageChange(current: number, previous: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return ((current - previous) / Math.abs(previous)) * 100;
}

export function buildFinancialReport(transactions: ReportTransaction[], referenceDate = new Date(), monthCount = 6) {
  const currentTransactions = monthTransactions(transactions, referenceDate);
  const previousTransactions = monthTransactions(transactions, subMonths(referenceDate, 1));
  const current = monthSummary(currentTransactions);
  const previous = monthSummary(previousTransactions);
  const categoryTotals = new Map<string, number>();

  currentTransactions.filter((item) => item.type === "expense").forEach((item) => categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + Number(item.amount)));
  const categories = [...categoryTotals.entries()].map(([name, value]) => ({ name, value, percent: current.expenses > 0 ? (value / current.expenses) * 100 : 0 })).sort((a, b) => b.value - a.value);
  const evolution = Array.from({ length: Math.max(1, monthCount) }, (_, index) => {
    const date = subMonths(referenceDate, Math.max(1, monthCount) - index - 1);
    const summary = monthSummary(monthTransactions(transactions, date));
    return { key: format(date, "yyyy-MM"), month: format(date, "MMM"), ...summary };
  });

  return {
    current,
    previous,
    changes: {
      income: percentageChange(current.income, previous.income),
      expenses: percentageChange(current.expenses, previous.expenses),
      balance: percentageChange(current.balance, previous.balance),
    },
    categories,
    evolution,
  };
}
