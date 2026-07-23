import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logHistoryEvent } from "./useHistoryEvents";

export interface Task {
  id: string;
  user_id: string;
  title: string;
  category: string;
  priority: "low" | "medium" | "high";
  due_time: string | null;
  due_date: string;
  completed: boolean;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export type NewTask = Pick<Task, "title" | "category" | "priority" | "due_time" | "due_date"> & {
  goal_id?: string | null;
};

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["tasks", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("due_date", { ascending: true })
        .order("due_time", { ascending: true });

      if (error) throw error;
      return data as Task[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (task: NewTask) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, user_id: user.id })
        .select()
        .single();

      if (error) throw error;

      // Log to history
      await logHistoryEvent(user.id, {
        event_type: "task",
        action: "create",
        title: task.title,
        description: "Nova tarefa criada",
        category: task.category,
        reference_id: data.id,
        reference_type: "task",
        metadata: { priority: task.priority, due_date: task.due_date },
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ completed })
        .eq("id", id);

      if (error) throw error;

      // Log completion to history
      if (user && completed) {
        const task = query.data?.find(t => t.id === id);
        if (task) {
          await logHistoryEvent(user.id, {
            event_type: "task",
            action: "complete",
            title: task.title,
            description: "Tarefa concluída",
            category: task.category,
            reference_id: id,
            reference_type: "task",
            metadata: { priority: task.priority },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Task> & { id: string }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id);
      if (error) throw error;

      // Log to history
      if (user) {
        const existingTask = query.data?.find(t => t.id === id);
        await logHistoryEvent(user.id, {
          event_type: "task",
          action: "update",
          title: updates.title || existingTask?.title || "Tarefa",
          description: "Tarefa editada",
          category: updates.category || existingTask?.category,
          reference_id: id,
          reference_type: "task",
          metadata: { priority: updates.priority || existingTask?.priority },
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // Log to history before deleting
      if (user) {
        const task = query.data?.find(t => t.id === id);
        if (task) {
          await logHistoryEvent(user.id, {
            event_type: "task",
            action: "delete",
            title: task.title,
            description: "Tarefa excluída",
            category: task.category,
            reference_id: id,
            reference_type: "task",
            metadata: { priority: task.priority },
          });
        }
      }

      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const linkTaskMutation = useMutation({
    mutationFn: async ({ taskId, goalId }: { taskId: string; goalId: string | null }) => {
      const { error } = await supabase
        .from("tasks")
        .update({ goal_id: goalId })
        .eq("id", taskId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["linked_tasks", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["personal_goals", user?.id] });
    },
  });

  return {
    tasks: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addTask: addMutation.mutateAsync,
    toggleTask: toggleMutation.mutateAsync,
    updateTask: updateMutation.mutateAsync,
    deleteTask: deleteMutation.mutateAsync,
    linkTask: linkTaskMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
