import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

/**
 * Database-backed pricing configuration — the single source of truth for
 * every price, trial length, benefit list and offer shown anywhere in the
 * app. Nothing here is hard-coded; src/data/plans.ts keeps a small static
 * fallback used only if this fetch fails outright (offline, RLS misconfig),
 * so the pricing page never renders completely blank.
 *
 * A/B testing: every table below carries a `variant_key` (default
 * 'control'). A visitor is bucketed into one variant, once, and that
 * assignment is persisted in localStorage so it doesn't change across
 * visits. Any pricing_plans/credit_packs/pricing_settings row can then be
 * given a second, variant-specific override row — free allowance, Glow Lite
 * price, Insider price, the annual/monthly default and trial length are all
 * just fields on these rows, so overriding any of them for an experiment
 * needs no code change, only a new database row.
 */

export type PricingPlan = Tables<"pricing_plans">;
export type CreditPack = Tables<"credit_packs">;
export type FoundingMemberOffer = Tables<"founding_member_offers">;
export type PricingSettings = Tables<"pricing_settings">;

const VARIANT_STORAGE_KEY = "skinlabs-pricing-variant";

/**
 * Reads whatever pricing variant this browser has already been bucketed
 * into, without fetching or assigning one — for call sites (like the AI
 * Formulator) that need a best-effort variant key but shouldn't pay for a
 * network round trip just to find out. Falls back to 'control'.
 */
export const getPersistedPricingVariant = (): string => getStoredVariant() ?? "control";

const getStoredVariant = (): string | null => {
  try {
    return localStorage.getItem(VARIANT_STORAGE_KEY);
  } catch {
    return null;
  }
};

const storeVariant = (variantKey: string) => {
  try {
    localStorage.setItem(VARIANT_STORAGE_KEY, variantKey);
  } catch {
    // Private browsing / storage disabled — the visitor just gets bucketed fresh each visit.
  }
};

const weightedPick = (variants: { variant_key: string; traffic_weight: number }[]): string => {
  const total = variants.reduce((sum, v) => sum + Math.max(v.traffic_weight, 0), 0);
  if (total <= 0) return "control";
  let roll = Math.random() * total;
  for (const v of variants) {
    roll -= Math.max(v.traffic_weight, 0);
    if (roll <= 0) return v.variant_key;
  }
  return variants[variants.length - 1].variant_key;
};

/**
 * Resolves (and persists) which pricing variant this browser is bucketed
 * into. Assignment happens once per browser and is remembered — not
 * recomputed on every load — so a visitor's prices stay consistent for the
 * life of an experiment even if traffic weights change mid-run. This does
 * not carry across devices or browsers for a signed-in user; that's a known
 * limitation of a client-side-only bucketing scheme, acceptable for a first
 * pricing experiment but worth revisiting if cross-device consistency ever
 * matters.
 */
export const resolvePricingVariant = (activeVariants: { variant_key: string; traffic_weight: number }[]): string => {
  const stored = getStoredVariant();
  if (stored && activeVariants.some((v) => v.variant_key === stored)) return stored;
  const picked = activeVariants.length > 0 ? weightedPick(activeVariants) : "control";
  storeVariant(picked);
  return picked;
};

const mergeByVariant = <T extends { variant_key: string }>(rows: T[], idKey: keyof T, variantKey: string): T[] => {
  const byId = new Map<string, T>();
  for (const row of rows) if (row.variant_key === "control") byId.set(String(row[idKey]), row);
  for (const row of rows) if (row.variant_key === variantKey) byId.set(String(row[idKey]), row);
  return Array.from(byId.values());
};

export interface PricingConfig {
  variantKey: string;
  plans: PricingPlan[];
  creditPacks: CreditPack[];
  foundingOffer: FoundingMemberOffer | null;
  settings: PricingSettings;
}

const FALLBACK_SETTINGS: PricingSettings = {
  variant_key: "control",
  default_billing_interval: "annual",
  free_ai_analysis_allowance: 1,
};

const CONFIG_FETCH_TIMEOUT_MS = 6000;

/**
 * A slow/hanging network (not just a fast error) shouldn't leave the pricing
 * page spinning forever — better to fail fast onto the static fallback than
 * make a visitor wait indefinitely for a request that may never resolve.
 */
const withTimeout = <T,>(promise: PromiseLike<T>, ms: number): Promise<T> =>
  Promise.race([
    Promise.resolve(promise),
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Pricing config request timed out")), ms)),
  ]);

async function fetchPricingConfig(): Promise<PricingConfig> {
  const { data: variantRows } = await withTimeout(
    supabase.from("pricing_experiment_variants").select("variant_key, traffic_weight, is_active").eq("is_active", true),
    CONFIG_FETCH_TIMEOUT_MS,
  );
  const activeVariants = variantRows && variantRows.length > 0 ? variantRows : [{ variant_key: "control", traffic_weight: 100, is_active: true }];
  const variantKey = resolvePricingVariant(activeVariants);

  const [{ data: plans }, { data: packs }, { data: offers }, { data: settingsRows }] = await withTimeout(
    Promise.all([
      supabase.from("pricing_plans").select("*").in("variant_key", [variantKey, "control"]),
      supabase.from("credit_packs").select("*").eq("is_active", true).in("variant_key", [variantKey, "control"]),
      supabase
        .from("founding_member_offers")
        .select("*")
        .eq("is_active", true)
        .in("variant_key", [variantKey, "control"]),
      supabase.from("pricing_settings").select("*").in("variant_key", [variantKey, "control"]),
    ]),
    CONFIG_FETCH_TIMEOUT_MS,
  );

  const mergedPlans = mergeByVariant(plans ?? [], "plan_id", variantKey).sort((a, b) => a.sort_order - b.sort_order);
  const mergedPacks = mergeByVariant(packs ?? [], "pack_id", variantKey).sort((a, b) => a.sort_order - b.sort_order);
  const foundingOffer =
    (offers ?? []).find((o) => o.variant_key === variantKey) ??
    (offers ?? []).find((o) => o.variant_key === "control") ??
    null;
  const settings =
    (settingsRows ?? []).find((s) => s.variant_key === variantKey) ??
    (settingsRows ?? []).find((s) => s.variant_key === "control") ??
    FALLBACK_SETTINGS;

  return { variantKey, plans: mergedPlans, creditPacks: mergedPacks, foundingOffer, settings };
}

export const usePricingConfig = () =>
  useQuery({
    queryKey: ["pricing-config"],
    queryFn: fetchPricingConfig,
    staleTime: 5 * 60 * 1000,
    // Pricing has a solid static fallback (src/data/plans.ts) — failing fast onto
    // it beats making a visitor wait through several retries of a slow/hung request.
    retry: 1,
    retryDelay: 1000,
  });

export const planPrice = (plan: PricingPlan, interval: "monthly" | "annual") =>
  interval === "annual" ? Number(plan.price_annual) : Number(plan.price_monthly);

export const annualMonthlyEquivalent = (plan: PricingPlan) =>
  Number(plan.price_annual) > 0 ? Math.round(Number(plan.price_annual) / 12) : 0;

export const annualSavingsLabel = (plan: PricingPlan): string | null => {
  const monthlyCostOverYear = Number(plan.price_monthly) * 12;
  const annual = Number(plan.price_annual);
  if (!(monthlyCostOverYear > 0) || !(annual > 0) || annual >= monthlyCostOverYear) return null;
  const savedRand = Math.round(monthlyCostOverYear - annual);
  const savedMonths = Math.round(savedRand / Number(plan.price_monthly));
  return savedMonths > 0 ? `${savedMonths} months free` : `Save R${savedRand}/year`;
};
