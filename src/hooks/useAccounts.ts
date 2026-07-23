import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "checking" | "savings" | "wallet" | "credit_card";
  balance: number;
  color: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

export type NewAccount = Omit<Account, "id" | "user_id" | "created_at" | "updated_at">;

export function useAccounts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["accounts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("accounts")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Account[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (account: NewAccount) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("accounts")
        .insert({ ...account, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Account> & { id: string }) => {
      const { error } = await supabase
        .from("accounts")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("accounts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });

  const transferMutation = useMutation({
    mutationFn: async ({ fromId, toId, amount }: { fromId: string; toId: string; amount: number }) => {
      const accounts = query.data || [];
      const fromAccount = accounts.find(a => a.id === fromId);
      const toAccount = accounts.find(a => a.id === toId);
      
      if (!fromAccount || !toAccount) throw new Error("Conta não encontrada");
      
      // Update source account
      const { error: error1 } = await supabase
        .from("accounts")
        .update({ balance: fromAccount.balance - amount })
        .eq("id", fromId);
      if (error1) throw error1;

      // Update destination account
      const { error: error2 } = await supabase
        .from("accounts")
        .update({ balance: toAccount.balance + amount })
        .eq("id", toId);
      if (error2) throw error2;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
    },
  });

  const totalBalance = (query.data || []).reduce((sum, acc) => sum + acc.balance, 0);

  return {
    accounts: query.data ?? [],
    totalBalance,
    isLoading: query.isLoading,
    error: query.error,
    addAccount: addMutation.mutateAsync,
    updateAccount: updateMutation.mutateAsync,
    deleteAccount: deleteMutation.mutateAsync,
    transfer: transferMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
