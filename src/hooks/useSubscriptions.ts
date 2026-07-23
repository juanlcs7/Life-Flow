import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { addDays, addMonths, addWeeks, addYears, format, parseISO, isBefore, startOfDay } from "date-fns";
import { logHistoryEvent } from "./useHistoryEvents";
import { useEffect, useRef } from "react";

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

export function useSubscriptions() {
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
      const sub = (query.data || []).find((s) => s.id === id);
      if (!sub) throw new Error("Assinatura não encontrada");

      const today = format(new Date(), "yyyy-MM-dd");

      // Create expense transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: "expense",
        category: sub.category,
        amount: sub.amount,
        description: `${sub.name} (assinatura)`,
        date: today,
        account_id: sub.account_id,
      });

      // Debit account
      if (sub.account_id) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", sub.account_id)
          .single();
        if (acc) {
          await supabase
            .from("accounts")
            .update({ balance: acc.balance - sub.amount })
            .eq("id", sub.account_id);
        }
      }

      // Advance next billing date
      const base = parseISO(sub.next_billing_date);
      const next =
        sub.frequency === "weekly"
          ? addWeeks(base, 1)
          : sub.frequency === "yearly"
          ? addYears(base, 1)
          : addMonths(base, 1);
      await supabase
        .from("subscriptions")
        .update({ next_billing_date: format(next, "yyyy-MM-dd") })
        .eq("id", id);

      await logHistoryEvent(user.id, {
        event_type: "finance",
        action: "payment",
        title: sub.name,
        description: "Assinatura paga",
        amount: sub.amount,
        category: sub.category,
        reference_id: sub.id,
        reference_type: "subscription",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["transactions", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["accounts", user?.id] });
      queryClient.invalidateQueries({ queryKey: ["history_events", user?.id] });
    },
  });

  // Auto-debit processor: runs once when subscriptions data loads. For any
  // active subscription with auto_debit=true, account linked, and a
  // next_billing_date <= today, charges it automatically.
  const processedRef = useRef(false);
  useEffect(() => {
    if (!user || !query.data || processedRef.current) return;
    processedRef.current = true;
    (async () => {
      const today = startOfDay(new Date());
      const due = query.data.filter(
        (s) =>
          s.active &&
          (s as any).auto_debit &&
          s.account_id &&
          !isBefore(today, parseISO(s.next_billing_date)),
      );
      for (const s of due) {
        try {
          await payNowMutation.mutateAsync(s.id);
        } catch (e) {
          console.error("auto-debit failed", s.name, e);
        }
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, query.data]);

  // Calculate monthly cost (normalize all to monthly)
  const monthlyCost = (query.data || [])
    .filter(s => s.active)
    .reduce((sum, sub) => {
      switch (sub.frequency) {
        case "weekly": return sum + (sub.amount * 4);
        case "yearly": return sum + (sub.amount / 12);
        default: return sum + sub.amount;
      }
    }, 0);

  // Get upcoming renewals (next 7 days)
  const upcomingRenewals = (query.data || [])
    .filter(s => {
      if (!s.active) return false;
      const nextDate = new Date(s.next_billing_date);
      const today = new Date();
      const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
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
