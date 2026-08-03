import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface PersonalEvent {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  event_time: string | null;
  notes: string | null;
  reminder_days_before: number;
  created_at: string;
  updated_at: string;
}

export type PersonalEventInput = Pick<PersonalEvent, "title" | "event_date" | "event_time" | "notes" | "reminder_days_before">;

export function usePersonalEvents() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = ["personal_events", user?.id];

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase.from("personal_events").select("*").order("event_date").order("event_time");
      if (error) throw error;
      return data as PersonalEvent[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (event: PersonalEventInput) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase.from("personal_events").insert({ ...event, user_id: user.id }).select().single();
      if (error) throw error;
      return data as PersonalEvent;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...event }: PersonalEventInput & { id: string }) => {
      const { data, error } = await supabase.from("personal_events").update(event).eq("id", id).select().single();
      if (error) throw error;
      return data as PersonalEvent;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("personal_events").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  return {
    events: query.data ?? [],
    isLoading: query.isLoading,
    addEvent: addMutation.mutateAsync,
    updateEvent: updateMutation.mutateAsync,
    deleteEvent: deleteMutation.mutateAsync,
    isSaving: addMutation.isPending || updateMutation.isPending,
  };
}
