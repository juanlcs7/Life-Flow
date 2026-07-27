import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export type ContactType = "personal" | "professional";

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  type: ContactType;
  email: string | null;
  phone: string | null;
  role: string | null;
  company: string | null;
  birthday: string | null;
  notes: string | null;
  favorite: boolean;
  last_contact_date: string | null;
  follow_up_date: string | null;
  follow_up_note: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactInput = Pick<Contact, "name" | "type"> &
  Partial<Pick<Contact, "email" | "phone" | "role" | "company" | "birthday" | "notes" | "favorite" | "last_contact_date" | "follow_up_date" | "follow_up_note">>;

export function useContacts() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["contacts", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .order("favorite", { ascending: false })
        .order("name", { ascending: true });

      if (error) throw error;
      return data as Contact[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (contact: ContactInput) => {
      if (!user) throw new Error("Usuário não autenticado");
      const { data, error } = await supabase
        .from("contacts")
        .insert({ ...contact, user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data as Contact;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] }),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ContactInput> & { id: string }) => {
      const { error } = await supabase
        .from("contacts")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["contacts", user?.id] }),
  });

  return {
    contacts: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    addContact: addMutation.mutateAsync,
    updateContact: updateMutation.mutateAsync,
    deleteContact: deleteMutation.mutateAsync,
    isSaving: addMutation.isPending || updateMutation.isPending,
  };
}
