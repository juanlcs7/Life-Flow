import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format, startOfMonth } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface MonthlyBudget {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  month: string;
  created_at: string;
  updated_at: string;
}

export function useBudgets(selectedMonth: Date) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const month = format(startOfMonth(selectedMonth), "yyyy-MM-dd");
  const queryKey = ["monthly_budgets", user?.id, month];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("monthly_budgets")
        .select("*")
        .eq("user_id", user.id)
        .eq("month", month)
        .order("category");
      if (error) throw error;
      return data as MonthlyBudget[];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async ({ category, amount }: { category: string; amount: number }) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { error } = await supabase.from("monthly_budgets").upsert(
        {
          user_id: user.id,
          category,
          amount,
          month,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,category,month" },
      );
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("monthly_budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    budgets: query.data ?? [],
    isLoading: query.isLoading,
    saveBudget: saveMutation.mutateAsync,
    deleteBudget: deleteMutation.mutateAsync,
    isSaving: saveMutation.isPending,
  };
}
