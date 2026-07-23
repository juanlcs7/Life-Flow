import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { format } from "date-fns";
import { logHistoryEvent } from "./useHistoryEvents";
import { addGoalContribution } from "./useGoalContributions";

export interface FinancialGoal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  notes: string | null;
  reminder_enabled: boolean;
  reminder_frequency: string;
  created_at: string;
  updated_at: string;
}

export type NewFinancialGoal = Omit<FinancialGoal, "id" | "user_id" | "created_at" | "updated_at">;

export function useFinancialGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["financial_goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("financial_goals")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as FinancialGoal[];
    },
    enabled: !!user,
  });

  // Helper to get account name
  const getAccountName = async (accountId: string | null | undefined): Promise<string | null> => {
    if (!accountId) return null;
    const { data } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle();
    return data?.name || null;
  };

  const addMutation = useMutation({
    mutationFn: async (goal: NewFinancialGoal) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("financial_goals")
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_goals", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FinancialGoal> & { id: string }) => {
      const { error } = await supabase
        .from("financial_goals")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_goals", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("financial_goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_goals", user?.id] });
    },
  });

  const addToGoalMutation = useMutation({
    mutationFn: async ({ id, amount, note, accountId }: { id: string; amount: number; note?: string; accountId?: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const goal = (query.data || []).find(g => g.id === id);
      if (!goal) throw new Error("Meta não encontrada");
      
      // Create a "savings" type transaction (expense that goes to savings)
      // This transaction represents money being moved to savings/goals
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "expense",
          category: "Poupança",
          amount: amount,
          description: `Aporte: ${goal.name}${note ? ` - ${note}` : ""}`,
          date: format(new Date(), "yyyy-MM-dd"),
          account_id: accountId || null,
        });
      
      if (transactionError) throw transactionError;
      
      // Update account balance if account is selected
      if (accountId) {
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", accountId)
          .single();
        
        if (!accountError && accountData) {
          await supabase
            .from("accounts")
            .update({ balance: accountData.balance - amount })
            .eq("id", accountId);
        }
      }
      
      // Update goal current amount
      const { error } = await supabase
        .from("financial_goals")
        .update({ current_amount: goal.current_amount + amount })
        .eq("id", id);
      
      if (error) throw error;

      // Add contribution record
      await addGoalContribution(user.id, id, amount, "deposit", note, accountId);

      // Log to history
      const accountName = await getAccountName(accountId);
      await logHistoryEvent(user.id, {
        event_type: "finance",
        action: "deposit",
        title: `Aporte em ${goal.name}`,
        description: note || "Aporte em meta financeira",
        amount: amount,
        category: "Poupança",
        account_name: accountName,
        reference_id: id,
        reference_type: "financial_goal",
        metadata: { goal_name: goal.name, new_total: goal.current_amount + amount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_goals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["goal_contributions"] });
      queryClient.invalidateQueries({ queryKey: ["all_goal_contributions", user?.id] });
    },
  });

  const withdrawFromGoalMutation = useMutation({
    mutationFn: async ({ id, amount, note, accountId }: { id: string; amount: number; note?: string; accountId?: string }) => {
      if (!user) throw new Error("User not authenticated");
      
      const goal = (query.data || []).find(g => g.id === id);
      if (!goal) throw new Error("Meta não encontrada");
      
      if (amount > goal.current_amount) {
        throw new Error("Valor maior que o disponível na meta");
      }
      
      // Create an income transaction (money returning from savings)
      const { error: transactionError } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          type: "income",
          category: "Poupança",
          amount: amount,
          description: `Resgate: ${goal.name}${note ? ` - ${note}` : ""}`,
          date: format(new Date(), "yyyy-MM-dd"),
          account_id: accountId || null,
        });
      
      if (transactionError) throw transactionError;
      
      // Update account balance if account is selected
      if (accountId) {
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", accountId)
          .single();
        
        if (!accountError && accountData) {
          await supabase
            .from("accounts")
            .update({ balance: accountData.balance + amount })
            .eq("id", accountId);
        }
      }
      
      // Update goal current amount
      const { error } = await supabase
        .from("financial_goals")
        .update({ current_amount: goal.current_amount - amount })
        .eq("id", id);
      
      if (error) throw error;

      // Add contribution record
      await addGoalContribution(user.id, id, amount, "withdraw", note, accountId);

      // Log to history
      const accountName = await getAccountName(accountId);
      await logHistoryEvent(user.id, {
        event_type: "finance",
        action: "withdraw",
        title: `Resgate de ${goal.name}`,
        description: note || "Resgate de meta financeira",
        amount: amount,
        category: "Poupança",
        account_name: accountName,
        reference_id: id,
        reference_type: "financial_goal",
        metadata: { goal_name: goal.name, new_total: goal.current_amount - amount },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["financial_goals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["goal_contributions"] });
      queryClient.invalidateQueries({ queryKey: ["all_goal_contributions", user?.id] });
    },
  });

  // Calculate total savings across all goals
  const totalSavings = (query.data || []).reduce((sum, goal) => sum + goal.current_amount, 0);

  return {
    goals: query.data ?? [],
    totalSavings,
    isLoading: query.isLoading,
    error: query.error,
    addGoal: addMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
    addToGoal: addToGoalMutation.mutateAsync,
    withdrawFromGoal: withdrawFromGoalMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
