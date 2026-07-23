import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logHistoryEvent } from "./useHistoryEvents";

export interface PersonalGoal {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  deadline: string;
  progress: number;
  priority: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export type NewPersonalGoal = Pick<PersonalGoal, "title" | "category" | "deadline"> & {
  description?: string;
  priority?: string;
};

export interface LinkedTask {
  id: string;
  title: string;
  completed: boolean;
  priority: string;
  due_date: string;
  goal_id: string | null;
}

export function usePersonalGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["personal_goals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("deadline", { ascending: true });

      if (error) throw error;
      return data as PersonalGoal[];
    },
    enabled: !!user,
  });

  // Fetch tasks linked to goals
  const linkedTasksQuery = useQuery({
    queryKey: ["linked_tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, completed, priority, due_date, goal_id")
        .not("goal_id", "is", null)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as LinkedTask[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (goal: NewPersonalGoal) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("goals")
        .insert({ 
          ...goal, 
          user_id: user.id,
          priority: goal.priority || "medium",
          description: goal.description || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Log to history
      await logHistoryEvent(user.id, {
        event_type: "task",
        action: "create",
        title: `Meta criada: ${goal.title}`,
        description: goal.description || undefined,
        category: goal.category,
        reference_id: data.id,
        reference_type: "goal",
        metadata: { priority: goal.priority, deadline: goal.deadline },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_goals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<PersonalGoal> & { id: string }) => {
      const { error } = await supabase
        .from("goals")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_goals", user?.id] });
    },
  });

  const updateProgressMutation = useMutation({
    mutationFn: async ({ id, progress }: { id: string; progress: number }) => {
      const goal = (query.data || []).find(g => g.id === id);
      const newProgress = Math.min(100, Math.max(0, progress));
      const newStatus = newProgress >= 100 ? "completed" : "in_progress";
      
      const { error } = await supabase
        .from("goals")
        .update({ progress: newProgress, status: newStatus })
        .eq("id", id);

      if (error) throw error;

      // Log completion
      if (newProgress >= 100 && goal && user) {
        await logHistoryEvent(user.id, {
          event_type: "task",
          action: "complete",
          title: `Meta concluída: ${goal.title}`,
          category: goal.category,
          reference_id: id,
          reference_type: "goal",
          metadata: { deadline: goal.deadline },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_goals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from("goals")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_goals", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First unlink all tasks
      await supabase
        .from("tasks")
        .update({ goal_id: null })
        .eq("goal_id", id);

      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal_goals", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["linked_tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
    },
  });

  // Helper to calculate progress based on linked tasks
  const getGoalProgress = (goalId: string) => {
    const tasks = (linkedTasksQuery.data || []).filter(t => t.goal_id === goalId);
    if (tasks.length === 0) return null; // No linked tasks, use manual progress
    const completed = tasks.filter(t => t.completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  // Get tasks for a specific goal
  const getGoalTasks = (goalId: string) => {
    return (linkedTasksQuery.data || []).filter(t => t.goal_id === goalId);
  };

  // Stats for insights
  const stats = {
    total: (query.data || []).length,
    inProgress: (query.data || []).filter(g => g.status === "in_progress").length,
    completed: (query.data || []).filter(g => g.status === "completed").length,
    paused: (query.data || []).filter(g => g.status === "paused").length,
    overdue: (query.data || []).filter(g => {
      if (g.status === "completed") return false;
      const deadline = new Date(g.deadline);
      return deadline < new Date();
    }).length,
    nearCompletion: (query.data || []).filter(g => g.progress >= 80 && g.status !== "completed").length,
  };

  return {
    goals: query.data ?? [],
    linkedTasks: linkedTasksQuery.data ?? [],
    stats,
    isLoading: query.isLoading,
    error: query.error,
    addGoal: addMutation.mutateAsync,
    updateGoal: updateMutation.mutateAsync,
    updateProgress: updateProgressMutation.mutateAsync,
    updateStatus: updateStatusMutation.mutateAsync,
    deleteGoal: deleteMutation.mutateAsync,
    getGoalProgress,
    getGoalTasks,
    isAdding: addMutation.isPending,
  };
}
