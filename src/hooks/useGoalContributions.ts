import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface GoalContribution {
  id: string;
  user_id: string;
  goal_id: string;
  amount: number;
  type: "deposit" | "withdraw";
  note: string | null;
  account_id: string | null;
  created_at: string;
}

export function useGoalContributions(goalId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["goal_contributions", goalId, user?.id],
    queryFn: async () => {
      if (!user || !goalId) return [];
      
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("*")
        .eq("goal_id", goalId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as GoalContribution[];
    },
    enabled: !!user && !!goalId,
  });

  // Get all contributions for a user (for summary)
  const allContributionsQuery = useQuery({
    queryKey: ["all_goal_contributions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from("goal_contributions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data as GoalContribution[];
    },
    enabled: !!user,
  });

  const invalidateContributions = () => {
    queryClient.invalidateQueries({ queryKey: ["goal_contributions"] });
    queryClient.invalidateQueries({ queryKey: ["all_goal_contributions", user?.id] });
  };

  return {
    contributions: query.data ?? [],
    allContributions: allContributionsQuery.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    invalidateContributions,
  };
}

// Helper to add contribution (called from useFinancialGoals)
export async function addGoalContribution(
  userId: string,
  goalId: string,
  amount: number,
  type: "deposit" | "withdraw",
  note?: string,
  accountId?: string
) {
  const { error } = await supabase
    .from("goal_contributions")
    .insert({
      user_id: userId,
      goal_id: goalId,
      amount,
      type,
      note: note || null,
      account_id: accountId || null,
    });

  if (error) throw error;
}
