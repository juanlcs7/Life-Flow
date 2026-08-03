import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface TransactionImport {
  id: string;
  user_id: string;
  file_name: string;
  file_type: "csv" | "ofx";
  transaction_count: number;
  total_income: number;
  total_expense: number;
  status: "completed" | "undone";
  imported_at: string;
  undone_at: string | null;
}

export interface NewTransactionImport {
  fileName: string;
  fileType: "csv" | "ofx";
  transactionIds: string[];
  totalIncome: number;
  totalExpense: number;
}

export function useTransactionImports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["transaction_imports", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transaction_imports")
        .select("*")
        .eq("user_id", user.id)
        .order("imported_at", { ascending: false });

      if (error) throw error;
      return data as TransactionImport[];
    },
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: async ({
      fileName,
      fileType,
      transactionIds,
      totalIncome,
      totalExpense,
    }: NewTransactionImport) => {
      if (!user) throw new Error("Usuário não autenticado");
      if (transactionIds.length === 0) throw new Error("A importação não possui transações");

      const { data: importRecord, error: importError } = await supabase
        .from("transaction_imports")
        .insert({
          user_id: user.id,
          file_name: fileName,
          file_type: fileType,
          transaction_count: transactionIds.length,
          total_income: totalIncome,
          total_expense: totalExpense,
        })
        .select()
        .single();

      if (importError) throw importError;

      const { error: itemsError } = await supabase
        .from("transaction_import_items")
        .insert(transactionIds.map((transactionId) => ({
          import_id: importRecord.id,
          transaction_id: transactionId,
        })));

      if (itemsError) {
        await supabase.from("transaction_imports").delete().eq("id", importRecord.id);
        throw itemsError;
      }

      return importRecord as TransactionImport;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const undoMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.rpc("undo_transaction_import", {
        p_import_id: id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  return {
    imports: query.data ?? [],
    isLoading: query.isLoading,
    createImport: createMutation.mutateAsync,
    undoImport: undoMutation.mutateAsync,
    undoingImportId: undoMutation.isPending ? undoMutation.variables : null,
    isCreating: createMutation.isPending,
  };
}
