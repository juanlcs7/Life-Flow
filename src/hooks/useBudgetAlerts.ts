import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ClaimBudgetAlertInput {
  budgetId: string;
  level: 80 | 100;
  spentAmount: number;
  budgetAmount: number;
}

export function useBudgetAlerts() {
  const claimMutation = useMutation({
    mutationFn: async ({ budgetId, level, spentAmount, budgetAmount }: ClaimBudgetAlertInput) => {
      const { data, error } = await supabase.rpc("claim_budget_alert", {
        p_budget_id: budgetId,
        p_alert_level: level,
        p_spent_amount: spentAmount,
        p_budget_amount: budgetAmount,
      });

      if (error) throw error;
      return data;
    },
  });

  return { claimBudgetAlert: claimMutation.mutateAsync };
}

