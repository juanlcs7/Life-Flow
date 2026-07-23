import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { logHistoryEvent } from "./useHistoryEvents";

export interface Habit {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  color: string;
  unit: string;
  daily_goal: number;
  current_progress: number;
  streak: number;
  last_updated: string | null;
  created_at: string;
}

export type NewHabit = Pick<Habit, "name" | "icon" | "color" | "unit" | "daily_goal">;

// Helper to get today's date string
const getTodayDateString = () => new Date().toISOString().split("T")[0];

export function useHabits() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["habits", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("habits")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      const today = getTodayDateString();
      const habits = data as Habit[];
      
      // Check if any habits need daily reset (last_updated is not today)
      const habitsToReset = habits.filter(
        (habit) => habit.last_updated && habit.last_updated !== today && habit.current_progress > 0
      );
      
      // Reset habits that weren't updated today
      if (habitsToReset.length > 0) {
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
        
        for (const habit of habitsToReset) {
          const wasYesterday = habit.last_updated === yesterday;
          const wasCompleted = habit.current_progress >= habit.daily_goal;
          
          // If completed yesterday, maintain streak; otherwise reset streak
          const newStreak = wasYesterday && wasCompleted ? habit.streak : 0;
          
          await supabase
            .from("habits")
            .update({ 
              current_progress: 0, 
              streak: newStreak
            })
            .eq("id", habit.id);
        }
        
        // Re-fetch after reset
        const { data: updatedData, error: updateError } = await supabase
          .from("habits")
          .select("*")
          .order("created_at", { ascending: true });
          
        if (updateError) throw updateError;
        return updatedData as Habit[];
      }
      
      return habits;
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (habit: NewHabit) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("habits")
        .insert({ ...habit, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
    },
  });

  const incrementMutation = useMutation({
    mutationFn: async ({ id, current_progress, daily_goal, streak, last_updated }: { 
      id: string; 
      current_progress: number; 
      daily_goal: number;
      streak: number;
      last_updated: string | null;
    }) => {
      const today = new Date().toISOString().split("T")[0];
      const wasYesterday = last_updated === new Date(Date.now() - 86400000).toISOString().split("T")[0];
      const isToday = last_updated === today;
      
      let newStreak = streak;
      if (!isToday) {
        newStreak = wasYesterday ? streak + 1 : 1;
      }

      const newProgress = current_progress + 1;
      const justCompleted = newProgress >= daily_goal && current_progress < daily_goal;
      
      const { error } = await supabase
        .from("habits")
        .update({ 
          current_progress: newProgress,
          streak: newStreak,
          last_updated: today,
        })
        .eq("id", id);

      if (error) throw error;

      // Log completion to history when goal is reached
      if (user && justCompleted) {
        const habit = (query.data || []).find(h => h.id === id);
        if (habit) {
          await logHistoryEvent(user.id, {
            event_type: "health",
            action: "complete",
            title: habit.name,
            description: `Meta diária atingida (${daily_goal} ${habit.unit})`,
            category: "Hábitos",
            reference_id: id,
            reference_type: "habit",
            metadata: { streak: newStreak, daily_goal, icon: habit.icon },
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Habit> & { id: string }) => {
      const { error } = await supabase
        .from("habits")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("habits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["habits", user?.id] });
    },
  });

  return {
    habits: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addHabit: addMutation.mutateAsync,
    incrementHabit: incrementMutation.mutateAsync,
    updateHabit: updateMutation.mutateAsync,
    deleteHabit: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
  };
}
