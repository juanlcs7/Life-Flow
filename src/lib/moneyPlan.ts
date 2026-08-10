export interface PlannedCommitment { category: string; amount: number }
export interface PlannedBudget { category: string; amount: number }
export interface PlannedGoal { name: string; remaining: number; monthsRemaining: number }

export function calculateSafeToSpend({
  unassigned,
  variableBudget,
  variableSpent,
  daysRemaining,
}: {
  unassigned: number;
  variableBudget: number;
  variableSpent: number;
  daysRemaining: number;
}) {
  const available = Math.max(0, unassigned) + Math.max(0, variableBudget - Math.max(0, variableSpent));
  return {
    available,
    daily: available / Math.max(1, daysRemaining),
    daysRemaining: Math.max(1, daysRemaining),
  };
}

export function simulatePurchaseImpact({ amount, available, daysRemaining }: { amount: number; available: number; daysRemaining: number }) {
  const purchase = Math.max(0, amount);
  const safeAvailable = Math.max(0, available);
  const safeDays = Math.max(1, daysRemaining);
  const remaining = Math.max(0, safeAvailable - purchase);
  const dailyBefore = safeAvailable / safeDays;
  const dailyAfter = remaining / safeDays;
  const impactPercent = safeAvailable > 0 ? Math.min(100, (purchase / safeAvailable) * 100) : purchase > 0 ? 100 : 0;
  const status = purchase <= 0 ? "idle" : purchase > safeAvailable ? "risk" : impactPercent <= 15 ? "safe" : "caution";
  return { purchase, remaining, dailyBefore, dailyAfter, impactPercent, status } as const;
}

export function buildMoneyPlan({ income, commitments, budgets, goals }: { income: number; commitments: PlannedCommitment[]; budgets: PlannedBudget[]; goals: PlannedGoal[] }) {
  const fixedByCategory = new Map<string, number>();
  commitments.forEach((item) => fixedByCategory.set(item.category, (fixedByCategory.get(item.category) ?? 0) + Math.max(0, item.amount)));
  const fixed = [...fixedByCategory.values()].reduce((total, value) => total + value, 0);
  const variableAllocations = budgets.map((budget) => ({
    category: budget.category,
    amount: Math.max(0, budget.amount - (fixedByCategory.get(budget.category) ?? 0)),
    fixed: fixedByCategory.get(budget.category) ?? 0,
  }));
  const variable = variableAllocations.reduce((total, budget) => total + budget.amount, 0);
  const goalAllocations = goals.filter((goal) => goal.remaining > 0).map((goal) => ({ name: goal.name, amount: goal.remaining / Math.max(1, goal.monthsRemaining) }));
  const goalsTotal = goalAllocations.reduce((total, goal) => total + goal.amount, 0);
  const planned = fixed + variable + goalsTotal;
  const unassigned = income - planned;
  const allocationPercent = income > 0 ? (planned / income) * 100 : planned > 0 ? 100 : 0;
  return { income, fixed, variable, variableAllocations, goals: goalsTotal, goalAllocations, planned, unassigned, allocationPercent, overallocated: unassigned < 0 };
}
