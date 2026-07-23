import { useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface Investment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  initial_value: number;
  current_value: number;
  start_date: string;
  notes: string | null;
  account_id: string | null;
  yield_rate: number;
  yield_period: "daily" | "monthly" | "yearly";
  last_yield_date: string;
  created_at: string;
  updated_at: string;
}

export interface InvestmentTransaction {
  id: string;
  investment_id: string;
  user_id: string;
  amount: number;
  type: "deposit" | "withdraw";
  date: string;
  notes: string | null;
  created_at: string;
}

function daysBetween(fromISO: string, toISO: string) {
  const a = new Date(fromISO + "T00:00:00");
  const b = new Date(toISO + "T00:00:00");
  return Math.floor((b.getTime() - a.getTime()) / 86400000);
}

function dailyRateFromPeriod(rate: number, period: string) {
  const r = (rate || 0) / 100;
  if (!r) return 0;
  if (period === "daily") return r;
  if (period === "monthly") return Math.pow(1 + r, 1 / 30) - 1;
  return Math.pow(1 + r, 1 / 365) - 1; // yearly
}

export function useInvestments() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: investments = [], isLoading } = useQuery({
    queryKey: ["investments", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investments")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as Investment[];
    },
    enabled: !!user,
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["investment_transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("investment_transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return (data || []) as InvestmentTransaction[];
    },
    enabled: !!user,
  });

  // Daily yield auto-apply: when investments load, update those whose last_yield_date < today
  useEffect(() => {
    if (!user || investments.length === 0) return;
    const today = new Date().toISOString().split("T")[0];
    const toUpdate = investments.filter(
      (i) => i.yield_rate > 0 && i.last_yield_date < today,
    );
    if (toUpdate.length === 0) return;

    (async () => {
      for (const inv of toUpdate) {
        const days = daysBetween(inv.last_yield_date, today);
        if (days <= 0) continue;
        const dr = dailyRateFromPeriod(Number(inv.yield_rate), inv.yield_period);
        const newValue = Number(inv.current_value) * Math.pow(1 + dr, days);
        await supabase
          .from("investments")
          .update({
            current_value: Number(newValue.toFixed(2)),
            last_yield_date: today,
          })
          .eq("id", inv.id);
      }
      queryClient.invalidateQueries({ queryKey: ["investments", user.id] });
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [investments.length, user?.id]);

  const addInvestment = useMutation({
    mutationFn: async (payload: {
      name: string;
      type: string;
      initial_value: number;
      start_date: string;
      notes?: string | null;
      account_id?: string | null;
      yield_rate?: number;
      yield_period?: string;
    }) => {
      if (!user) throw new Error("not auth");
      const { data, error } = await supabase
        .from("investments")
        .insert({
          user_id: user.id,
          name: payload.name,
          type: payload.type,
          initial_value: payload.initial_value,
          current_value: payload.initial_value,
          start_date: payload.start_date,
          notes: payload.notes ?? null,
          account_id: payload.account_id ?? null,
          yield_rate: payload.yield_rate ?? 0,
          yield_period: payload.yield_period ?? "monthly",
          last_yield_date: new Date().toISOString().split("T")[0],
        })
        .select()
        .single();
      if (error) throw error;

      // Deduct from account balance if linked
      if (payload.account_id && payload.initial_value > 0) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", payload.account_id)
          .single();
        if (acc) {
          await supabase
            .from("accounts")
            .update({ balance: Number(acc.balance) - payload.initial_value })
            .eq("id", payload.account_id);
        }
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const updateInvestment = useMutation({
    mutationFn: async (payload: Partial<Investment> & { id: string }) => {
      const { id, ...updates } = payload;
      const { error } = await supabase.from("investments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investments"] }),
  });

  const deleteInvestment = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("investments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["investments"] }),
  });

  const addTransaction = useMutation({
    mutationFn: async (payload: {
      investment_id: string;
      amount: number;
      type: "deposit" | "withdraw";
      account_id?: string | null;
      notes?: string | null;
    }) => {
      if (!user) throw new Error("not auth");
      const inv = investments.find((i) => i.id === payload.investment_id);
      if (!inv) throw new Error("investment not found");

      const { error: txErr } = await supabase.from("investment_transactions").insert({
        user_id: user.id,
        investment_id: payload.investment_id,
        amount: payload.amount,
        type: payload.type,
        notes: payload.notes ?? null,
      });
      if (txErr) throw txErr;

      const delta = payload.type === "deposit" ? payload.amount : -payload.amount;
      await supabase
        .from("investments")
        .update({ current_value: Number(inv.current_value) + delta })
        .eq("id", inv.id);

      const accId = payload.account_id ?? inv.account_id;
      if (accId) {
        const { data: acc } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", accId)
          .single();
        if (acc) {
          const balanceDelta = payload.type === "deposit" ? -payload.amount : payload.amount;
          await supabase
            .from("accounts")
            .update({ balance: Number(acc.balance) + balanceDelta })
            .eq("id", accId);
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["investments"] });
      queryClient.invalidateQueries({ queryKey: ["investment_transactions"] });
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });

  const totals = useMemo(() => {
    const invested = investments.reduce((s, i) => s + Number(i.initial_value), 0);
    const current = investments.reduce((s, i) => s + Number(i.current_value), 0);
    return { invested, current, profit: current - invested };
  }, [investments]);

  return {
    investments,
    transactions,
    isLoading,
    totals,
    addInvestment: addInvestment.mutateAsync,
    updateInvestment: updateInvestment.mutateAsync,
    deleteInvestment: deleteInvestment.mutateAsync,
    addTransaction: addTransaction.mutateAsync,
  };
}