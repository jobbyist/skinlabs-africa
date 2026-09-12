/**
 * OpenHaus live currency converter — refreshes marketplace_fx_rates from
 * Frankfurter.app (free, no API key, ECB-based rates). Scheduled every 6
 * hours via pg_cron and can be triggered manually by an admin. Rates are
 * display-only: cart/checkout totals stay authoritative in ZAR.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const CURRENCIES = ["USD", "EUR", "GBP"];

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

    // Frankfurter's `base=ZAR` gives rate-from-ZAR directly for each symbol.
    const res = await fetch(`https://api.frankfurter.app/latest?from=ZAR&to=${CURRENCIES.join(",")}`);
    if (!res.ok) {
      throw new Error(`Frankfurter ${res.status}: ${await res.text().catch(() => "")}`);
    }
    const payload = await res.json();
    const rates: Record<string, number> = payload?.rates ?? {};

    let updated = 0;
    const errors: string[] = [];
    for (const currency of CURRENCIES) {
      const rate = rates[currency];
      if (typeof rate !== "number" || !Number.isFinite(rate) || rate <= 0) {
        errors.push(`Missing/invalid rate for ${currency}`);
        continue;
      }
      const { error } = await admin
        .from("marketplace_fx_rates")
        .upsert({ currency_code: currency, rate_from_zar: rate, updated_at: new Date().toISOString() }, { onConflict: "currency_code" });
      if (error) {
        errors.push(`${currency}: ${error.message}`);
      } else {
        updated += 1;
      }
    }

    return new Response(JSON.stringify({ ok: true, updated, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("openhaus-fx-sync failed:", err);
    return new Response(JSON.stringify({ error: String(err).slice(0, 500) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
