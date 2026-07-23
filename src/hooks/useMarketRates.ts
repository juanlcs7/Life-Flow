import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface MarketRate {
  code: string;
  name: string;
  value: number;
  period: "daily" | "monthly" | "yearly";
  source: string | null;
  reference_date: string | null;
  updated_at: string;
}

const STALE_MS = 1000 * 60 * 60 * 12; // 12h

export function useMarketRates() {
  return useQuery({
    queryKey: ["market_rates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("market_rates")
        .select("*")
        .order("code");
      if (error) throw error;

      const rows = (data || []) as MarketRate[];
      const newest = rows.reduce(
        (m, r) => Math.max(m, new Date(r.updated_at).getTime()),
        0,
      );
      const isStale = !newest || Date.now() - newest > STALE_MS;

      if (isStale) {
        // fire-and-forget refresh from BCB
        supabase.functions.invoke("fetch-market-rates").catch(() => {});
      }

      return rows;
    },
    staleTime: 1000 * 60 * 30,
  });
}

export function getRate(rates: MarketRate[] | undefined, code: string) {
  return rates?.find((r) => r.code === code);
}

/** Convert a rate at its native period to an annual %. */
export function toYearly(value: number, period: string): number {
  const r = value / 100;
  if (period === "yearly") return value;
  if (period === "monthly") return (Math.pow(1 + r, 12) - 1) * 100;
  return (Math.pow(1 + r, 252) - 1) * 100; // daily (business)
}