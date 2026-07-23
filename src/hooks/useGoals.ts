import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  category: string;
  deadline: string;
  progress: number;
  created_at: string;
  updated_at: string;
}

export type NewGoal = Pick<Goal, "title" | "category" | "deadline">;

export function useGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("deadline", { ascending: true });

      if (error) throw error;
      return data as Goal[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (goal: NewGoal) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("goals")
        .insert({ ...goal, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const { error } = await supabase
        .from("goals")
        .update({ progress: Math.min(100, Math.max(0, progress)) })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", user?.id] });
    },
  });

  return {
    goals: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addGoal: addMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
