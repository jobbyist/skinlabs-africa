/**
 * OpenHaus pricing sync — re-checks each product's Faithful to Nature (FTN)
 * source page for its current price and reapplies the 4% markup (charm-
 * rounded to R__.99). Parses the page's own `Product` JSON-LD rather than
 * calling Firecrawl at request time (no extra API key/cost/dependency for
 * a scheduled job; Firecrawl is reserved for the one-time content-
 * population script where page structure isn't known in advance).
 *
 * NOTE: faithful-to-nature.co.za sits behind Cloudflare's bot-challenge on
 * some request patterns. A fetch that lands on the challenge page (no
 * parseable JSON-LD) is logged as an error and the existing price is left
 * untouched — this function never zeroes or guesses a price on failure.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Inlined rather than imported from ../_shared — keeps this function
// self-contained for single-function deploys. Must stay in sync with
// src/lib/marketplace/pricing.ts and supabase/functions/_shared/marketplace-pricing.ts.
const MARKUP_RATE = 1.04;
function computeMarkedUpPrice(sourcePriceZar: number): number {
  const raw = sourcePriceZar * MARKUP_RATE;
  return Math.ceil(raw) - 0.01;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-cron-secret",
};

const REQUEST_DELAY_MS = 700;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function extractPriceFromJsonLd(html: string): number | null {
  const scriptStart = '<script type="application/ld+json">';
  const scriptEnd = '</script>';
  let startIndex = 0;
  
  while (true) {
    const start = html.indexOf(scriptStart, startIndex);
    if (start === -1) break;
    const contentStart = start + scriptStart.length;
    const end = html.indexOf(scriptEnd, contentStart);
    if (end === -1) break;
    
    try {
      const content = html.slice(contentStart, end).trim();
      if (content.length > 100000) {
        startIndex = end + scriptEnd.length;
        continue;
      }
      const parsed = JSON.parse(content);
      const candidates = Array.isArray(parsed) ? parsed : [parsed];
      for (const entry of candidates) {
        const nodes = entry?.["@graph"] ? entry["@graph"] : [entry];
        for (const node of nodes) {
          if (node?.["@type"] === "Product" || (Array.isArray(node?.["@type"]) && node["@type"].includes("Product"))) {
            const offers = Array.isArray(node.offers) ? node.offers[0] : node.offers;
            const price = Number(offers?.price ?? offers?.lowPrice);
            if (Number.isFinite(price) && price > 0) return price;
          }
        }
      }
    } catch {
      // Continue to next script tag
    }
    startIndex = end + scriptEnd.length;
  }
  return null;
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

    const { data: products, error: productsError } = await admin
      .from("marketplace_products")
      .select("id, source_url, original_price_zar, marked_up_price_zar")
      .eq("in_stock", true);
    if (productsError) throw productsError;

    let ok = 0;
    let failed = 0;
    const logRows: {
      product_id: string;
      old_price: number;
      new_price: number | null;
      status: "ok" | "error";
      error: string | null;
    }[] = [];

    for (const product of products ?? []) {
      try {
        const res = await fetch(product.source_url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SkinLabsOpenHausBot/1.0)" },
        });
        const html = await res.text();
        const sourcePrice = extractPriceFromJsonLd(html);

        if (!res.ok || sourcePrice === null) {
          failed += 1;
          logRows.push({
            product_id: product.id,
            old_price: Number(product.marked_up_price_zar),
            new_price: null,
            status: "error",
            error: !res.ok ? `HTTP ${res.status}` : "No parseable Product JSON-LD (possibly a bot-challenge page)",
          });
        } else {
          const newMarkedUp = computeMarkedUpPrice(sourcePrice);
          const newMarkedUp = computeMarkedUpPrice(sourcePrice);
          const { error: updateError } = await admin
            .from("marketplace_products")
            .update({
              original_price_zar: sourcePrice,
              marked_up_price_zar: newMarkedUp,
              source_last_synced_at: new Date().toISOString(),
            })
            .eq("id", product.id);
          if (updateError) {
            failed += 1;
            logRows.push({
              product_id: product.id,
              old_price: Number(product.marked_up_price_zar),
              new_price: null,
              status: "error",
              error: `DB update failed: ${updateError.message}`,
            });
          } else {
            ok += 1;
            logRows.push({
              product_id: product.id,
              old_price: Number(product.marked_up_price_zar),
              new_price: newMarkedUp,
              status: "ok",
              error: null,
            });
          }
        }
      } catch (err) {
        failed += 1;
        logRows.push({
          product_id: product.id,
          old_price: Number(product.marked_up_price_zar),
          new_price: null,
          status: "error",
          error: String(err).slice(0, 300),
        });
      }
      await sleep(REQUEST_DELAY_MS);
    }

    if (logRows.length > 0) {
      await admin.from("marketplace_price_sync_log").insert(logRows);
    }

    return new Response(JSON.stringify({ ok: true, updated: ok, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("openhaus-price-sync failed:", err);
    return new Response(JSON.stringify({ error: String(err).slice(0, 500) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
