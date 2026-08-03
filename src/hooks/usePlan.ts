import { useMemo } from "react";
import { useProfile } from "./useProfile";
import { useTransactions } from "./useTransactions";
import { useInvestments } from "./useInvestments";
import { useGoals } from "./useGoals";
import { useFinancialGoals } from "./useFinancialGoals";
import { usePersonalGoals } from "./usePersonalGoals";
import { isDateInMonth } from "@/lib/financialCalculations";

export const PLAN_LIMITS = {
  free: {
    transactionsPerMonth: 5,
    investments: 2,
    goals: 3, // shared budget: personal + financial + simple
    advancedReports: false,
  },
  premium: {
    transactionsPerMonth: Infinity,
    investments: Infinity,
    goals: Infinity,
    advancedReports: true,
  },
} as const;

export const PREMIUM_PRICE = 19.9;

export function usePlan() {
  const { profile } = useProfile();

  const isPremium = useMemo(() => {
    if (!profile) return false;
    if (!profile.is_premium) return false;
    if (profile.premium_until && new Date(profile.premium_until) < new Date())
      return false;
    return true;
  }, [profile]);

  const limits = isPremium ? PLAN_LIMITS.premium : PLAN_LIMITS.free;

  const { transactions } = useTransactions();
  const { investments } = useInvestments();
  const { goals } = useGoals();
  const { goals: fin } = useFinancialGoals();
  const { goals: personal } = usePersonalGoals();

  const now = new Date();
  const transactionsThisMonth = transactions.filter(
    (transaction) => isDateInMonth(transaction.date, now),
  ).length;

  const investmentsCount = investments.length;
  const goalsCount =
    (goals?.length || 0) + (fin?.length || 0) + (personal?.length || 0);

  const usage = {
    transactionsThisMonth,
    investmentsCount,
    goalsCount,
  };

  const canAddTransaction = transactionsThisMonth < limits.transactionsPerMonth;
  const canAddInvestment = investmentsCount < limits.investments;
  const canAddGoal = goalsCount < limits.goals;
  const canUseReports = limits.advancedReports;

  return {
    isPremium,
    plan: isPremium ? "premium" : "free",
    limits,
    usage,
    canAddTransaction,
    canAddInvestment,
    canAddGoal,
    canUseReports,
    premiumUntil: profile?.premium_until as string | null | undefined,
  };
}
