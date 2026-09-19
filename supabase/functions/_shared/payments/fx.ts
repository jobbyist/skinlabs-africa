import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Converts a ZAR list price to USD for PayPal, which (unlike PayFast) isn't
 * ZAR-native — reuses marketplace_fx_rates, the same table OpenHaus already
 * uses for its multi-currency price display (rate_from_zar: multiply a ZAR
 * amount by this to get the target currency). Not a verified fact about
 * PayPal's own settlement-currency support for South African merchant
 * accounts (this environment has no way to confirm that) — USD is used as
 * the safe, universally-supported default regardless of merchant country.
 * Rounds to 2 decimal places, as PayPal requires for USD.
 */
export async function convertZarToUsd(
  admin: ReturnType<typeof createClient>,
  amountZar: number,
): Promise<number> {
  const { data, error } = await admin
    .from("marketplace_fx_rates")
    .select("rate_from_zar")
    .eq("currency_code", "USD")
    .maybeSingle();
  if (error || !data?.rate_from_zar) {
    throw new Error("USD exchange rate unavailable");
  }
  return Math.round(amountZar * Number(data.rate_from_zar) * 100) / 100;
}
