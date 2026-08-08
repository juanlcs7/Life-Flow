import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface IncomeSource {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  amount: number;
  payment_day: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export type NewIncomeSource = Pick<IncomeSource, "account_id" | "name" | "amount" | "payment_day" | "active">;

export function useIncomeSources() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["income-sources", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("income_sources").select("*").order("payment_day");
      if (error) throw error;
      return data as IncomeSource[];
    },
    enabled: Boolean(user),
  });

  const addMutation = useMutation({
    mutationFn: async (source: NewIncomeSource) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.from("income_sources").insert({ ...source, user_id: user.id }).select().single();
      if (error) throw error;
      return data as IncomeSource;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<NewIncomeSource> & { id: string }) => {
      const { error } = await supabase.from("income_sources").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("income_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const sources = query.data ?? [];
  return {
    incomeSources: sources,
    activeIncomeSources: sources.filter((source) => source.active),
    monthlyIncome: sources.filter((source) => source.active).reduce((total, source) => total + Number(source.amount), 0),
    isLoading: query.isLoading,
    saveIncomeSource: async (source: NewIncomeSource & { id?: string }) => source.id
      ? updateMutation.mutateAsync({ ...source, id: source.id })
      : addMutation.mutateAsync(source),
    deleteIncomeSource: deleteMutation.mutateAsync,
    isSaving: addMutation.isPending || updateMutation.isPending,
  };
}
