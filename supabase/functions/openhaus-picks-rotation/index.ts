/**
 * SkinLabs® Picks weekly rotation — selects a fresh curated set of OpenHaus
 * products every Monday 00:00 SAST (cron: 0 22 * * 0 UTC), favouring brand
 * and category diversity and excluding whatever was picked in the last 2
 * weeks. Idempotent per week: re-running for a week that already has rows
 * is a no-op. Manual admin trigger supported too.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const PICKS_COUNT = 4;
const LOOKBACK_WEEKS = 2;

/** The Monday (UTC date) of the current week, in SAST (UTC+2). */
function currentWeekMonday(): string {
  const now = new Date();
  const sastMs = now.getTime() + 2 * 60 * 60 * 1000;
  const sast = new Date(sastMs);
  const day = sast.getUTCDay(); // 0 = Sunday
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(sast);
  monday.setUTCDate(sast.getUTCDate() + diffToMonday);
  return monday.toISOString().slice(0, 10);
}

function pastWeeks(weekOf: string, count: number): string[] {
  const base = new Date(`${weekOf}T00:00:00Z`);
  const weeks: string[] = [];
  for (let i = 1; i <= count; i++) {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - i * 7);
    weeks.push(d.toISOString().slice(0, 10));
  }
  return weeks;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

  try {
    const cronSecret = Deno.env.get("MARKETPLACE_CRON_SECRET");
    const providedSecret = req.headers.get("x-cron-secret");
    const viaCron = Boolean(cronSecret && providedSecret && providedSecret === cronSecret);
    let authorised = viaCron;

    if (!authorised) {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.replace("Bearer ", "");
      if (token) {
        const { data: userData } = await admin.auth.getUser(token);
        if (userData?.user) {
          const { data: adminRole } = await admin.rpc("has_role", {
            _user_id: userData.user.id,
            _role: "admin",
          });
          authorised = Boolean(adminRole);
        }
      }
    }

    if (!authorised) {
      return new Response(JSON.stringify({ error: "Not authorised" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const weekOf = currentWeekMonday();

    const { count: existingCount } = await admin
      .from("marketplace_skinlabs_picks")
      .select("id", { count: "exact", head: true })
      .eq("week_of", weekOf);
    if ((existingCount ?? 0) > 0) {
      return new Response(JSON.stringify({ ok: true, weekOf, created: 0, message: "Picks already exist for this week" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: products, error: productsError } = await admin
      .from("marketplace_products")
      .select("id, brand_id, category")
      .eq("in_stock", true);
    if (productsError) throw productsError;
    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ ok: true, weekOf, created: 0, message: "No in-stock products" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const recentWeeks = pastWeeks(weekOf, LOOKBACK_WEEKS);
    const { data: recentPicks } = await admin
      .from("marketplace_skinlabs_picks")
      .select("product_id")
      .in("week_of", recentWeeks);
    const excluded = new Set((recentPicks ?? []).map((r) => r.product_id));

    const eligible = products.filter((p) => !excluded.has(p.id));
    const pool = eligible.length >= PICKS_COUNT ? eligible : products;

    // Shuffle, then greedily pick favouring brand/category diversity.
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const picked: typeof pool = [];
    const usedBrands = new Set<string>();
    const usedCategories = new Set<string>();

    for (const product of shuffled) {
      if (picked.length >= PICKS_COUNT) break;
      if (usedBrands.has(product.brand_id) || usedCategories.has(product.category)) continue;
      picked.push(product);
      usedBrands.add(product.brand_id);
      usedCategories.add(product.category);
    }
    for (const product of shuffled) {
      if (picked.length >= PICKS_COUNT) break;
      if (picked.some((p) => p.id === product.id)) continue;
      picked.push(product);
    }

    const rows = picked.map((product, index) => ({ product_id: product.id, week_of: weekOf, position: index }));
    const { error: insertError } = await admin.from("marketplace_skinlabs_picks").insert(rows);
    if (insertError) throw insertError;

    return new Response(JSON.stringify({ ok: true, weekOf, created: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("openhaus-picks-rotation failed:", err);
    return new Response(JSON.stringify({ error: String(err).slice(0, 500) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
