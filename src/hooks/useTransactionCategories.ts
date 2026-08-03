import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { TRANSACTION_CATEGORIES, normalizeTransactionDescription } from "@/lib/transactionCsv";
import { useAuth } from "./useAuth";

export interface TransactionCategoryOption {
  id?: string;
  name: string;
  color: string;
  icon: string;
  isCustom: boolean;
}

export interface TransactionCategoryDraft {
  name: string;
  color: string;
  icon: string;
}

const defaultAppearance: Record<string, { color: string; icon: string }> = {
  "Alimentação": { color: "#22c55e", icon: "🍽️" },
  Transporte: { color: "#3b82f6", icon: "🚗" },
  Moradia: { color: "#8b5cf6", icon: "🏠" },
  "Saúde": { color: "#ef4444", icon: "❤️" },
  "Educação": { color: "#f59e0b", icon: "📚" },
  Lazer: { color: "#ec4899", icon: "🎮" },
  Receita: { color: "#10b981", icon: "💰" },
  Outros: { color: "#64748b", icon: "📌" },
};

const defaultCategories: TransactionCategoryOption[] = TRANSACTION_CATEGORIES.map((name) => ({
  name,
  ...defaultAppearance[name],
  isCustom: false,
}));

export function useTransactionCategories() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["transaction_categories", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("transaction_categories")
        .select("id, name, color, icon")
        .eq("user_id", user.id)
        .order("name");

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const categories = useMemo<TransactionCategoryOption[]>(() => [
    ...defaultCategories,
    ...(query.data ?? []).map((category) => ({ ...category, isCustom: true })),
  ], [query.data]);

  const ensureUniqueName = (name: string, ignoredId?: string) => {
    const key = normalizeTransactionDescription(name);
    const duplicate = categories.some((category) =>
      category.id !== ignoredId && normalizeTransactionDescription(category.name) === key,
    );
    if (duplicate) throw new Error("Já existe uma categoria com esse nome.");
  };

  const createMutation = useMutation({
    mutationFn: async (draft: TransactionCategoryDraft) => {
      if (!user) throw new Error("Usuário não autenticado.");
      ensureUniqueName(draft.name);
      const { error } = await supabase.from("transaction_categories").insert({
        ...draft,
        name: draft.name.trim(),
        user_id: user.id,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction_categories", user?.id] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...draft }: TransactionCategoryDraft & { id: string }) => {
      if (!user) throw new Error("Usuário não autenticado.");
      ensureUniqueName(draft.name, id);
      const { error } = await supabase
        .from("transaction_categories")
        .update({ ...draft, name: draft.name.trim() })
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction_categories", user?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Usuário não autenticado.");
      const { error } = await supabase
        .from("transaction_categories")
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["transaction_categories", user?.id] }),
  });

  return {
    categories,
    customCategories: categories.filter((category) => category.isCustom),
    createCategory: createMutation.mutateAsync,
    updateCategory: updateMutation.mutateAsync,
    deleteCategory: deleteMutation.mutateAsync,
    isLoading: query.isLoading,
    isSaving: createMutation.isPending || updateMutation.isPending || deleteMutation.isPending,
  };
}
