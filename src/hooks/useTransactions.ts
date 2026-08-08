import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Transaction {
  id: string;
  user_id: string;
  type: "income" | "expense";
  category: string;
  amount: number;
  description: string;
  date: string;
  account_id: string | null;
  created_at: string;
  reviewed_at?: string | null;
}

export type NewTransaction = Omit<Transaction, "id" | "user_id" | "created_at" | "reviewed_at">;

export function useTransactions() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["transactions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      return data as Transaction[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (transaction: NewTransaction) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .rpc("create_financial_transaction", {
          p_type: transaction.type,
          p_category: transaction.category,
          p_amount: transaction.amount,
          p_description: transaction.description,
          p_date: transaction.date,
          p_account_id: transaction.account_id,
        });
      if (error) throw error;
      const created = data as Transaction;
      const { error: reviewError } = await supabase
        .from("transactions")
        .update({ reviewed_at: new Date().toISOString() })
        .eq("id", created.id);
      if (reviewError) throw reviewError;
      return created;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      const existing = query.data?.find((transaction) => transaction.id === id);
      if (!existing) throw new Error("Transação não encontrada");
      const next = { ...existing, ...updates };
      const { error } = await supabase.rpc("update_financial_transaction", {
        p_id: id,
        p_type: next.type,
        p_category: next.category,
        p_amount: next.amount,
        p_description: next.description,
        p_date: next.date,
        p_account_id: next.account_id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.rpc("delete_financial_transaction", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("transactions").update({ reviewed_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] }),
  });

  const reviewAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("transactions").update({ reviewed_at: new Date().toISOString() }).is("reviewed_at", null);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] }),
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addTransaction: addMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    reviewTransaction: reviewMutation.mutateAsync,
    reviewAllTransactions: reviewAllMutation.mutateAsync,
    pendingReviewCount: (query.data ?? []).filter((transaction) => !transaction.reviewed_at).length,
    isReviewing: reviewMutation.isPending || reviewAllMutation.isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
