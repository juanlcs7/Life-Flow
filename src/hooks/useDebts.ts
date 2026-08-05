import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Debt {
  id: string;
  user_id: string;
  name: string;
  balance: number;
  annual_interest_rate: number;
  minimum_payment: number;
  due_day: number | null;
  created_at: string;
  updated_at: string;
}

export type NewDebt = Pick<Debt, "name" | "balance" | "annual_interest_rate" | "minimum_payment" | "due_day">;

export function useDebts({ enabled = true }: { enabled?: boolean } = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["debts", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("debts").select("*").order("annual_interest_rate", { ascending: false });
      if (error) throw error;
      return data as Debt[];
    },
    enabled: Boolean(user && enabled),
  });

  const addMutation = useMutation({
    mutationFn: async (debt: NewDebt) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.from("debts").insert({ ...debt, user_id: user.id }).select().single();
      if (error) throw error;
      return data as Debt;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewDebt> & { id: string }) => {
      const { error } = await supabase.from("debts").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("debts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    debts: query.data ?? [],
    isLoading: query.isLoading,
    addDebt: addMutation.mutateAsync,
    updateDebt: updateMutation.mutateAsync,
    deleteDebt: deleteMutation.mutateAsync,
    isSaving: addMutation.isPending || updateMutation.isPending,
  };
}
