import { useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useProfile } from "./useProfile";
import { useTransactions } from "./useTransactions";
import { useInvestments } from "./useInvestments";
import { useGoals } from "./useGoals";
import { useFinancialGoals } from "./useFinancialGoals";
import { usePersonalGoals } from "./usePersonalGoals";

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
  const { user } = useAuth();
  const { profile } = useProfile() as any;
  const queryClient = useQueryClient();

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
  const fin = (useFinancialGoals() as any).goals as any[] | undefined;
  const personal = (usePersonalGoals() as any).goals as any[] | undefined;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const transactionsThisMonth = transactions.filter(
    (t) => new Date(t.date) >= monthStart,
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

  const activatePremium = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not auth");
      const until = new Date();
      until.setMonth(until.getMonth() + 1);
      const { error } = await supabase
        .from("profiles")
        .update({ is_premium: true, premium_until: until.toISOString() })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

  const cancelPremium = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("not auth");
      const { error } = await supabase
        .from("profiles")
        .update({ is_premium: false, premium_until: null })
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });

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
    activatePremium: activatePremium.mutateAsync,
    cancelPremium: cancelPremium.mutateAsync,
    isActivating: activatePremium.isPending,
  };
}