/**
 * OpenHaus pricing sync — re-checks Faithful to Nature (FTN) source pages
 * for current prices and reapplies the 4% markup (charm-rounded to R__.99).
 * Reads the page's own `Product` JSON-LD and og/product price meta tags
 * rather than calling Firecrawl at request time (no extra API key/cost/
 * dependency for a scheduled job).
 *
 * Runs in batches to stay inside the edge-function wall-clock limit: each
 * invocation checks the BATCH_SIZE products whose price was checked longest
 * ago (`price_checked_at`, stamped on every attempt so a persistently
 * failing page can't starve the rest), and stops starting new fetches once
 * TIME_BUDGET_MS has elapsed. pg_cron calls it several times a night so the
 * whole catalogue is covered daily.
 *
 * NOTE: faithful-to-nature.co.za sits behind Cloudflare's bot-challenge on
 * some request patterns. A fetch that lands on the challenge page (no
 * readable price) is logged as an error and the existing price is left
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

const BATCH_SIZE = 20;
const TIME_BUDGET_MS = 100_000;
const FETCH_TIMEOUT_MS = 15_000;
const MAX_HTML_BYTES = 5_000_000;
const REQUEST_DELAY_MS = 700;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function priceFromJsonLdBlock(block: string): number | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(block.trim());
  } catch {
    return null;
  }
  const candidates = Array.isArray(parsed) ? parsed : [parsed];
  for (const entry of candidates as Record<string, unknown>[]) {
    const nodes = (entry?.["@graph"] as Record<string, unknown>[] | undefined) ?? [entry];
    for (const node of nodes) {
      const type = node?.["@type"];
      if (type === "Product" || (Array.isArray(type) && type.includes("Product"))) {
        const rawOffers = node.offers as Record<string, unknown> | Record<string, unknown>[] | undefined;
        const offers = Array.isArray(rawOffers) ? rawOffers[0] : rawOffers;
        const price = Number(offers?.price ?? offers?.lowPrice);
        if (Number.isFinite(price) && price > 0) return price;
      }
    }
  }
  return null;
}

// Linear scans (no regex backtracking over multi-MB pages); tolerate extra
// attributes and casing on the tags.
function jsonLdPrice(html: string, lower: string): number | null {
  let from = 0;
  while (true) {
    const marker = lower.indexOf("application/ld+json", from);
    if (marker === -1) return null;
    const contentStart = lower.indexOf(">", marker) + 1;
    if (contentStart === 0) return null;
    const end = lower.indexOf("</script>", contentStart);
    if (end === -1) return null;
    const price = priceFromJsonLdBlock(html.slice(contentStart, end));
    if (price !== null) return price;
    from = end + "</script>".length;
  }
}

function metaPrice(html: string, lower: string, property: string): number | null {
  let from = 0;
  while (true) {
    const marker = lower.indexOf(property, from);
    if (marker === -1) return null;
    from = marker + property.length;
    const tagStart = lower.lastIndexOf("<", marker);
    const tagEnd = lower.indexOf(">", marker);
    if (tagStart === -1 || tagEnd === -1) return null;
    // Skip matches outside a tag (e.g. in body text or JSON) and non-meta tags.
    if (lower.slice(tagStart, marker).includes(">")) continue;
    const tag = html.slice(tagStart, tagEnd);
    if (!/^<meta\s/i.test(tag)) continue;
    const content = /content\s*=\s*["']([^"']*)["']/i.exec(tag)?.[1];
    const price = Number(content);
    return content && Number.isFinite(price) && price > 0 ? price : null;
  }
}

// FTN's Product JSON-LD carries the regular price even while a "Special
// Price" is on; the og/product price meta tags carry the price actually
// charged. A sale price is never above the regular one, so the lowest
// candidate is the current selling price.
function extractSourcePrice(html: string): number | null {
  const lower = html.toLowerCase();
  const candidates = [
    jsonLdPrice(html, lower),
    metaPrice(html, lower, "og:price:amount"),
    metaPrice(html, lower, "product:price:amount"),
  ].filter((p): p is number => p !== null);
  return candidates.length > 0 ? Math.min(...candidates) : null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const startedAt = Date.now();
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
      .eq("in_stock", true)
      .order("price_checked_at", { ascending: true, nullsFirst: true })
      .limit(BATCH_SIZE);
    if (productsError) throw productsError;

    let ok = 0;
    let failed = 0;
    const attemptedIds: string[] = [];
    const logRows: {
      product_id: string;
      old_price: number;
      new_price: number | null;
      status: "ok" | "error";
      error: string | null;
    }[] = [];
    const logError = (product: { id: string; marked_up_price_zar: number }, error: string) => {
      failed += 1;
      logRows.push({
        product_id: product.id,
        old_price: Number(product.marked_up_price_zar),
        new_price: null,
        status: "error",
        error,
      });
    };

    for (const product of products ?? []) {
      if (Date.now() - startedAt > TIME_BUDGET_MS) break;
      attemptedIds.push(product.id);
      try {
        const res = await fetch(product.source_url, {
          headers: { "User-Agent": "Mozilla/5.0 (compatible; SkinLabsOpenHausBot/1.0)" },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        const html = await res.text();
        const sourcePrice = html.length > MAX_HTML_BYTES ? null : extractSourcePrice(html);

        if (!res.ok) {
          logError(product, `HTTP ${res.status}`);
        } else if (html.length > MAX_HTML_BYTES) {
          logError(product, "Response too large (>5MB)");
        } else if (sourcePrice === null) {
          logError(product, "No price in JSON-LD or price meta tags (possibly a bot-challenge page)");
        } else {
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
            logError(product, `DB update failed: ${updateError.message}`);
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
        logError(product, String(err).slice(0, 300));
      }
      await sleep(REQUEST_DELAY_MS);
    }

    if (attemptedIds.length > 0) {
      const { error: stampError } = await admin
        .from("marketplace_products")
        .update({ price_checked_at: new Date().toISOString() })
        .in("id", attemptedIds);
      if (stampError) console.error("openhaus-price-sync: failed to stamp price_checked_at:", stampError);
    }

    if (logRows.length > 0) {
      const { error: logInsertError } = await admin.from("marketplace_price_sync_log").insert(logRows);
      if (logInsertError) console.error("openhaus-price-sync: failed to write sync log:", logInsertError);
    }

    return new Response(
      JSON.stringify({ ok: true, checked: attemptedIds.length, updated: ok, failed }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    console.error("openhaus-price-sync failed:", err);
    return new Response(JSON.stringify({ error: String(err).slice(0, 500) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
