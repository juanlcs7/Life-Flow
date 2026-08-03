import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { monthlyEquivalent } from "@/lib/financialCalculations";

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  amount: number;
  frequency: "weekly" | "monthly" | "yearly";
  category: string;
  next_billing_date: string;
  reminder_days_before: number;
  account_id: string | null;
  active: boolean;
  auto_debit: boolean;
  created_at: string;
  updated_at: string;
}

export type NewSubscription = Omit<Subscription, "id" | "user_id" | "created_at" | "updated_at">;

export function useSubscriptions({
  processAutoDebit = true,
}: {
  processAutoDebit?: boolean;
} = {}) {
  // Kept for backwards compatibility; processing now runs in Supabase Cron.
  void processAutoDebit;
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["subscriptions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("subscriptions")
        .select("*")
        .order("next_billing_date", { ascending: true });

      if (error) throw error;
      return data as Subscription[];
    },
    enabled: !!user,
  });

  const addMutation = useMutation({
    mutationFn: async (subscription: NewSubscription) => {
      if (!user) throw new Error("User not authenticated");
      const { data, error } = await supabase
        .from("subscriptions")
        .insert({ ...subscription, user_id: user.id })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<Subscription> & { id: string }) => {
      const { error } = await supabase
        .from("subscriptions")
        .update(updates)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.id] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("subscriptions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.id] });
    },
  });

  // Pay a subscription now: creates an expense transaction, debits the linked
  // account, and advances next_billing_date by the frequency.
  const payNowMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("not auth");
      const { error } = await supabase.rpc("pay_subscription", { p_subscription_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  // Calculate monthly cost (normalize all to monthly)
  const monthlyCost = (query.data || [])
    .filter(s => s.active)
    .reduce((sum, sub) => sum + monthlyEquivalent(sub.amount, sub.frequency), 0);

  // Get upcoming renewals (next 7 days)
  const upcomingRenewals = (query.data || [])
    .filter(s => {
      if (!s.active) return false;
      const diffDays = differenceInCalendarDays(parseISO(s.next_billing_date), new Date());
      return diffDays >= 0 && diffDays <= 7;
    });

  return {
    subscriptions: query.data ?? [],
    activeSubscriptions: (query.data ?? []).filter(s => s.active),
    monthlyCost,
    upcomingRenewals,
    isLoading: query.isLoading,
    error: query.error,
    addSubscription: addMutation.mutateAsync,
    updateSubscription: updateMutation.mutateAsync,
    deleteSubscription: deleteMutation.mutateAsync,
    paySubscription: payNowMutation.mutateAsync,
    isPaying: payNowMutation.isPending,
    isAdding: addMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
