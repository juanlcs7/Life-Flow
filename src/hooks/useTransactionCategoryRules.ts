import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface CategoryRuleDraft {
  keyword: string;
  category: string;
}

export interface TransactionCategoryRule extends CategoryRuleDraft {
  updated_at: string;
}

export function useTransactionCategoryRules() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["transaction_category_rules", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("transaction_category_rules")
        .select("keyword, category, updated_at")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });

  const saveMutation = useMutation({
    mutationFn: async (rules: CategoryRuleDraft[]) => {
      if (!user || rules.length === 0) return;

      const uniqueRules = [...new Map(rules.map((rule) => [rule.keyword, rule])).values()];
      const { error } = await supabase
        .from("transaction_category_rules")
        .upsert(
          uniqueRules.map((rule) => ({ ...rule, user_id: user.id })),
          { onConflict: "user_id,keyword" },
        );

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction_category_rules", user?.id] });
    },
  });

  const categoryRules = useMemo(
    () => Object.fromEntries((query.data ?? []).map((rule) => [rule.keyword, rule.category])),
    [query.data],
  );

  const deleteMutation = useMutation({
    mutationFn: async (keyword: string) => {
      if (!user) throw new Error("Usuário não autenticado.");

      const { error } = await supabase
        .from("transaction_category_rules")
        .delete()
        .eq("user_id", user.id)
        .eq("keyword", keyword);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transaction_category_rules", user?.id] });
    },
  });

  return {
    rules: (query.data ?? []) as TransactionCategoryRule[],
    categoryRules,
    saveCategoryRules: saveMutation.mutateAsync,
    deleteCategoryRule: deleteMutation.mutateAsync,
    isLoading: query.isLoading,
    isSaving: saveMutation.isPending || deleteMutation.isPending,
  };
}
