import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ZarUsdQuote {
  /** Multiply a ZAR amount by this to get USD. */
  rate: number;
  /** "live" = fetched from Frankfurter at checkout time; "cached" = marketplace_fx_rates fallback. */
  source: "live" | "cached";
  /** ISO timestamp the rate was published/last refreshed. */
  asOf: string;
}

/** A cached rate older than this is refused rather than used to price a real charge. */
const MAX_CACHED_RATE_AGE_MS = 48 * 60 * 60 * 1000;
const LIVE_FETCH_TIMEOUT_MS = 2500;

/**
 * Resolves the ZAR→USD rate used to price a PayPal charge. PayPal does not
 * support ZAR as a transaction currency, so every PayPal charge is placed in
 * USD, converted from the ZAR list price (pricing_plans / credit_packs /
 * founding_member_offers stay ZAR-native and remain the only price source).
 *
 * Tries a real-time rate first — Frankfurter (ECB reference rates, no API
 * key, the same provider openhaus-fx-sync already uses) — then falls back to
 * marketplace_fx_rates (refreshed every 6h by openhaus-fx-sync) as long as it
 * isn't stale. Never invents a rate: if both fail, the checkout is refused.
 */
export async function getZarUsdQuote(admin: ReturnType<typeof createClient>): Promise<ZarUsdQuote> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), LIVE_FETCH_TIMEOUT_MS);
    const res = await fetch("https://api.frankfurter.app/latest?from=ZAR&to=USD", { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      const json = await res.json();
      const rate = Number(json?.rates?.USD);
      if (rate > 0) {
        return { rate, source: "live", asOf: json?.date ? new Date(json.date).toISOString() : new Date().toISOString() };
      }
    }
  } catch (err) {
    console.warn("fx: live ZAR/USD fetch failed, falling back to cached rate", err);
  }

  const { data, error } = await admin
    .from("marketplace_fx_rates")
    .select("rate_from_zar, updated_at")
    .eq("currency_code", "USD")
    .maybeSingle();
  if (error || !data?.rate_from_zar) {
    throw new Error("USD exchange rate unavailable");
  }
  const updatedAt = new Date(data.updated_at as string);
  if (Date.now() - updatedAt.getTime() > MAX_CACHED_RATE_AGE_MS) {
    throw new Error("USD exchange rate is stale");
  }
  return { rate: Number(data.rate_from_zar), source: "cached", asOf: updatedAt.toISOString() };
}

/** Rounds to 2 decimal places, as PayPal requires for USD. Never below the $0.01 minimum. */
export function zarToUsd(amountZar: number, quote: ZarUsdQuote): number {
  return Math.max(0.01, Math.round(amountZar * quote.rate * 100) / 100);
}
