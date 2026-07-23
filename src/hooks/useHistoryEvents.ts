import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import type { Json } from "@/integrations/supabase/types";

export interface HistoryEvent {
  id: string;
  user_id: string;
  event_type: "finance" | "task" | "health";
  action: string;
  title: string;
  description: string | null;
  amount: number | null;
  category: string | null;
  account_name: string | null;
  reference_id: string | null;
  reference_type: string | null;
  metadata: Json;
  created_at: string;
}

export type NewHistoryEvent = Omit<HistoryEvent, "id" | "user_id" | "created_at">;

export interface HistoryEventInput {
  event_type: string;
  action: string;
  title: string;
  description?: string | null;
  amount?: number | null;
  category?: string | null;
  account_name?: string | null;
  reference_id?: string | null;
  reference_type?: string | null;
  metadata?: Json;
}

export function useHistoryEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["history_events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("history_events")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) throw error;
      return data as HistoryEvent[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (event: HistoryEventInput) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("history_events")
        .insert([{ ...event, user_id: user.id, metadata: event.metadata || {} }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("history_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  // Get today's summary
  const today = new Date().toISOString().split("T")[0];
  const todayEvents = (query.data || []).filter(
    (event) => event.created_at.split("T")[0] === today
  );

  const getMetadataType = (metadata: Json): string | undefined => {
    if (typeof metadata === "object" && metadata !== null && !Array.isArray(metadata)) {
      return (metadata as Record<string, unknown>).type as string | undefined;
    }
    return undefined;
  };

  const todaySummary = {
    expenses: todayEvents
      .filter((e) => e.event_type === "finance" && e.action === "create" && getMetadataType(e.metadata) === "expense")
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    income: todayEvents
      .filter((e) => e.event_type === "finance" && e.action === "create" && getMetadataType(e.metadata) === "income")
      .reduce((sum, e) => sum + (e.amount || 0), 0),
    tasksCompleted: todayEvents.filter((e) => e.event_type === "task" && e.action === "complete").length,
    habitsCompleted: todayEvents.filter((e) => e.event_type === "health" && e.action === "complete").length,
  };

  return {
    events: query.data ?? [],
    todaySummary,
    isLoading: query.isLoading,
    error: query.error,
    addEvent: addMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
    isAdding: addMutation.isPending,
    refetch: query.refetch,
  };
}

// Helper function to log events from other hooks
export async function logHistoryEvent(
  userId: string,
  event: HistoryEventInput
) {
  const { error } = await supabase.from("history_events").insert([{
    user_id: userId,
    ...event,
    metadata: event.metadata || {},
  }]);

  if (error) {
    console.error("Failed to log history event:", error);
  }
}
