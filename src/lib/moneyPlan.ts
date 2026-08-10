export interface PlannedCommitment { category: string; amount: number }
export interface PlannedBudget { category: string; amount: number }
export interface PlannedGoal { name: string; remaining: number; monthsRemaining: number }

export function buildMoneyPlan({ income, commitments, budgets, goals }: { income: number; commitments: PlannedCommitment[]; budgets: PlannedBudget[]; goals: PlannedGoal[] }) {
  const fixedByCategory = new Map<string, number>();
  commitments.forEach((item) => fixedByCategory.set(item.category, (fixedByCategory.get(item.category) ?? 0) + Math.max(0, item.amount)));
  const fixed = [...fixedByCategory.values()].reduce((total, value) => total + value, 0);
  const variable = budgets.reduce((total, budget) => total + Math.max(0, budget.amount - (fixedByCategory.get(budget.category) ?? 0)), 0);
  const goalAllocations = goals.filter((goal) => goal.remaining > 0).map((goal) => ({ name: goal.name, amount: goal.remaining / Math.max(1, goal.monthsRemaining) }));
  const goalsTotal = goalAllocations.reduce((total, goal) => total + goal.amount, 0);
  const planned = fixed + variable + goalsTotal;
  const unassigned = income - planned;
  const allocationPercent = income > 0 ? (planned / income) * 100 : planned > 0 ? 100 : 0;
  return { income, fixed, variable, goals: goalsTotal, goalAllocations, planned, unassigned, allocationPercent, overallocated: unassigned < 0 };
}
