export interface InsightTransaction {
  type: "income" | "expense";
  amount: number;
  category: string;
  date: string;
}

export interface ScheduledCommitment {
  amount: number;
  date: string;
}

export interface DebtPlanInput {
  id: string;
  name: string;
  balance: number;
  annualInterestRate: number;
  minimumPayment: number;
}

const DAY_MS = 86_400_000;
const startOfLocalDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const parseLocalDate = (value: string) => {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
};

export function buildWeeklyFinancialSummary(transactions: InsightTransaction[], now = new Date()) {
  const today = startOfLocalDay(now);
  const currentStart = new Date(today.getTime() - 6 * DAY_MS);
  const previousStart = new Date(today.getTime() - 13 * DAY_MS);
  const previousEnd = new Date(today.getTime() - 7 * DAY_MS);
  const inRange = (value: string, start: Date, end: Date) => {
    const date = parseLocalDate(value);
    return date >= start && date <= end;
  };

  const current = transactions.filter((item) => inRange(item.date, currentStart, today));
  const previous = transactions.filter((item) => inRange(item.date, previousStart, previousEnd));
  const sum = (items: InsightTransaction[], type: InsightTransaction["type"]) =>
    items.filter((item) => item.type === type).reduce((total, item) => total + Number(item.amount), 0);

  const income = sum(current, "income");
  const expenses = sum(current, "expense");
  const previousExpenses = sum(previous, "expense");
  const expenseChangePercent = previousExpenses > 0
    ? ((expenses - previousExpenses) / previousExpenses) * 100
    : null;

  const categoryTotals = new Map<string, number>();
  current.filter((item) => item.type === "expense").forEach((item) => {
    categoryTotals.set(item.category, (categoryTotals.get(item.category) ?? 0) + Number(item.amount));
  });
  const topCategory = [...categoryTotals.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;

  return {
    income,
    expenses,
    balance: income - expenses,
    expenseChangePercent,
    topCategory: topCategory ? { name: topCategory[0], amount: topCategory[1] } : null,
    transactionCount: current.length,
  };
}

export function buildBalanceForecast({
  currentBalance,
  transactions,
  commitments,
  predictableIncome = [],
  now = new Date(),
  horizons = [30, 60, 90],
}: {
  currentBalance: number;
  transactions: InsightTransaction[];
  commitments: ScheduledCommitment[];
  predictableIncome?: ScheduledCommitment[];
  now?: Date;
  horizons?: number[];
}) {
  const today = startOfLocalDay(now);
  const historyStart = new Date(today.getTime() - 89 * DAY_MS);
  const history = transactions.filter((item) => {
    const date = parseLocalDate(item.date);
    return date >= historyStart && date <= today;
  });
  const historicalNet = history.reduce(
    (total, item) => total + (item.type === "income" ? Number(item.amount) : -Number(item.amount)),
    0,
  );
  const historicalExpenses = history
    .filter((item) => item.type === "expense")
    .reduce((total, item) => total + Number(item.amount), 0);
  const dailyNet = predictableIncome.length > 0 ? -historicalExpenses / 90 : historicalNet / 90;

  return horizons.map((days) => {
    const end = new Date(today.getTime() + days * DAY_MS);
    const scheduled = commitments
      .filter((item) => {
        const date = parseLocalDate(item.date);
        return date > today && date <= end;
      })
      .reduce((total, item) => total + Number(item.amount), 0);
    const income = predictableIncome
      .filter((item) => {
        const date = parseLocalDate(item.date);
        return date > today && date <= end;
      })
      .reduce((total, item) => total + Number(item.amount), 0);
    return {
      days,
      scheduledCommitments: scheduled,
      scheduledIncome: income,
      projectedBalance: currentBalance + dailyNet * days + income - scheduled,
    };
  });
}

export function simulatePurchase({
  price,
  installments,
  currentBalance,
  monthlyIncome,
  monthlyCommitments,
}: {
  price: number;
  installments: number;
  currentBalance: number;
  monthlyIncome: number;
  monthlyCommitments: number;
}) {
  const count = Math.max(1, Math.floor(installments));
  const installmentAmount = price / count;
  const commitmentRatio = monthlyIncome > 0
    ? ((monthlyCommitments + installmentAmount) / monthlyIncome) * 100
    : 100;
  const cashBalanceAfter = currentBalance - price;
  const verdict = count === 1 && cashBalanceAfter < 0
    ? "risk"
    : commitmentRatio > 50
      ? "risk"
      : commitmentRatio > 35 || (count === 1 && cashBalanceAfter < currentBalance * 0.2)
        ? "attention"
        : "comfortable";

  return { installmentAmount, commitmentRatio, cashBalanceAfter, verdict } as const;
}

export function buildDebtPayoffPlan(
  input: DebtPlanInput[],
  extraPayment: number,
  strategy: "avalanche" | "snowball",
) {
  const debts = input
    .filter((debt) => debt.balance > 0 && debt.minimumPayment > 0)
    .map((debt) => ({ ...debt, remaining: debt.balance }));
  const priority = [...debts].sort((a, b) => strategy === "avalanche"
    ? b.annualInterestRate - a.annualInterestRate || a.balance - b.balance
    : a.balance - b.balance || b.annualInterestRate - a.annualInterestRate);
  const totalBudget = debts.reduce((total, debt) => total + debt.minimumPayment, 0) + Math.max(0, extraPayment);
  let totalInterest = 0;
  let months = 0;

  while (debts.some((debt) => debt.remaining > 0.005) && months < 600) {
    months += 1;
    debts.forEach((debt) => {
      if (debt.remaining <= 0) return;
      const interest = debt.remaining * (Math.max(0, debt.annualInterestRate) / 100 / 12);
      debt.remaining += interest;
      totalInterest += interest;
    });

    let available = totalBudget;
    debts.forEach((debt) => {
      if (debt.remaining <= 0 || available <= 0) return;
      const payment = Math.min(debt.minimumPayment, debt.remaining, available);
      debt.remaining -= payment;
      available -= payment;
    });
    priority.forEach((debt) => {
      if (debt.remaining <= 0 || available <= 0) return;
      const payment = Math.min(debt.remaining, available);
      debt.remaining -= payment;
      available -= payment;
    });
  }

  return {
    months,
    totalInterest,
    totalMonthlyPayment: totalBudget,
    order: priority.map((debt) => debt.id),
    feasible: months < 600,
  };
}
