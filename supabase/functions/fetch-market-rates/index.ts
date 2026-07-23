import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// BCB SGS series codes
// 12  = CDI (daily %)
// 432 = Selic meta (annual %)
// 433 = IPCA (monthly %)
// 195 = Poupança (monthly %)
const SERIES = [
  { code: "CDI",      sgs: 12,  name: "CDI",                period: "daily"   },
  { code: "SELIC",    sgs: 432, name: "Selic Meta",         period: "yearly"  },
  { code: "IPCA",     sgs: 433, name: "IPCA (mensal)",      period: "monthly" },
  { code: "POUPANCA", sgs: 195, name: "Poupança (mensal)",  period: "monthly" },
];

async function fetchSeries(sgs: number): Promise<{ value: number; date: string } | null> {
  try {
    const url = `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${sgs}/dados/ultimos/1?formato=json`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return null;
    const arr = await r.json();
    if (!Array.isArray(arr) || arr.length === 0) return null;
    const last = arr[arr.length - 1];
    const value = parseFloat(String(last.valor).replace(",", "."));
    const [dd, mm, yyyy] = String(last.data).split("/");
    return { value, date: `${yyyy}-${mm}-${dd}` };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const results: Record<string, unknown> = {};
  for (const s of SERIES) {
    const r = await fetchSeries(s.sgs);
    if (!r) { results[s.code] = "failed"; continue; }
    const { error } = await supabase.from("market_rates").upsert({
      code: s.code,
      name: s.name,
      value: r.value,
      period: s.period,
      source: "BCB",
      reference_date: r.date,
      updated_at: new Date().toISOString(),
    }, { onConflict: "code" });
    results[s.code] = error ? `error:${error.message}` : { value: r.value, date: r.date };
  }

  return new Response(JSON.stringify({ ok: true, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});