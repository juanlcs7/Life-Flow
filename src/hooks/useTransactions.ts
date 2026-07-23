import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logHistoryEvent } from "./useHistoryEvents";

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
}

export type NewTransaction = Omit<Transaction, "id" | "user_id" | "created_at">;

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

  // Helper to get account name
  const getAccountName = async (accountId: string | null): Promise<string | null> => {
    if (!accountId) return null;
    const { data } = await supabase
      .from("accounts")
      .select("name")
      .eq("id", accountId)
      .maybeSingle();
    return data?.name || null;
  };

  const addMutation = useMutation({
    mutationFn: async (transaction: NewTransaction) => {
      if (!user) throw new Error("User not authenticated");
      
      // Insert transaction
      const { data, error } = await supabase
        .from("transactions")
        .insert({ ...transaction, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Update account balance if account is selected
      if (transaction.account_id) {
        const balanceChange = transaction.type === "income" ? transaction.amount : -transaction.amount;
        
        // Get current account balance
        const { data: accountData, error: accountError } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", transaction.account_id)
          .single();
        
        if (accountError) throw accountError;
        
        const { error: updateError } = await supabase
          .from("accounts")
          .update({ balance: accountData.balance + balanceChange })
          .eq("id", transaction.account_id);
        
        if (updateError) throw updateError;
      }

      // Log to history
      const accountName = await getAccountName(transaction.account_id);
      await logHistoryEvent(user.id, {
        event_type: "finance",
        action: "create",
        title: transaction.description,
        description: transaction.type === "income" ? "Nova receita registrada" : "Nova despesa registrada",
        amount: transaction.amount,
        category: transaction.category,
        account_name: accountName,
        reference_id: data.id,
        reference_type: "transaction",
        metadata: { type: transaction.type },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Transaction> & { id: string }) => {
      // Get existing transaction to revert its balance impact
      const existingTransaction = query.data?.find(t => t.id === id);
      
      if (existingTransaction && existingTransaction.account_id) {
        // Revert old balance change
        const oldChange = existingTransaction.type === "income" ? -existingTransaction.amount : existingTransaction.amount;
        
        const { data: oldAccountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", existingTransaction.account_id)
          .single();
        
        if (oldAccountData) {
          await supabase
            .from("accounts")
            .update({ balance: oldAccountData.balance + oldChange })
            .eq("id", existingTransaction.account_id);
        }
      }
      
      // Update transaction
      const { error } = await supabase
        .from("transactions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;

      // Apply new balance change if account is set
      const newAccountId = updates.account_id ?? existingTransaction?.account_id;
      const newType = updates.type ?? existingTransaction?.type;
      const newAmount = updates.amount ?? existingTransaction?.amount;
      
      if (newAccountId && newType && newAmount) {
        const newChange = newType === "income" ? newAmount : -newAmount;
        
        const { data: newAccountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", newAccountId)
          .single();
        
        if (newAccountData) {
          await supabase
            .from("accounts")
            .update({ balance: newAccountData.balance + newChange })
            .eq("id", newAccountId);
        }
      }

      // Log to history
      if (user && existingTransaction) {
        const accountName = await getAccountName(newAccountId || null);
        await logHistoryEvent(user.id, {
          event_type: "finance",
          action: "update",
          title: updates.description || existingTransaction.description,
          description: "Transação editada",
          amount: newAmount,
          category: updates.category || existingTransaction.category,
          account_name: accountName,
          reference_id: id,
          reference_type: "transaction",
          metadata: { type: newType },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Get transaction to revert its balance impact
      const transaction = query.data?.find(t => t.id === id);
      
      if (transaction && transaction.account_id) {
        const balanceChange = transaction.type === "income" ? -transaction.amount : transaction.amount;
        
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", transaction.account_id)
          .single();
        
        if (accountData) {
          await supabase
            .from("accounts")
            .update({ balance: accountData.balance + balanceChange })
            .eq("id", transaction.account_id);
        }
      }
      
      // Log to history before deleting
      if (user && transaction) {
        const accountName = await getAccountName(transaction.account_id);
        await logHistoryEvent(user.id, {
          event_type: "finance",
          action: "delete",
          title: transaction.description,
          description: "Transação excluída",
          amount: transaction.amount,
          category: transaction.category,
          account_name: accountName,
          reference_id: id,
          reference_type: "transaction",
          metadata: { type: transaction.type },
        });
      }
      
      const { error } = await supabase.from("transactions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  return {
    transactions: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addTransaction: addMutation.mutateAsync,
    updateTransaction: updateMutation.mutateAsync,
    deleteTransaction: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
