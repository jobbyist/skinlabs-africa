/**
 * Narrow, real-match-only bridge between the editorial catalogue (reviews,
 * SKYNN AI's grounded routine picks) and the OpenHaus marketplace. Never
 * fabricates a match — a confidence floor (exact-ish brand + meaningful
 * product-name token overlap) must be met, or the caller gets `null` and
 * shows nothing.
 */
import { supabase } from "@/integrations/supabase/client";

export interface MarketplaceMatch {
  slug: string;
  brandSlug: string;
  name: string;
}

const STOPWORDS = new Set([
  "the", "a", "an", "with", "for", "and", "of", "in", "on", "ml", "step", "kit", "set",
]);

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function normalizeBrand(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Jaccard overlap of significant word tokens between two product names. */
function nameOverlap(a: string, b: string): number {
  const ta = new Set(tokenize(a));
  const tb = new Set(tokenize(b));
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / new Set([...ta, ...tb]).size;
}

const CONFIDENCE_FLOOR = 0.4;

let cachedCatalog: { brandSlug: string; brandName: string; slug: string; name: string }[] | null = null;

async function loadCatalog() {
  if (cachedCatalog) return cachedCatalog;
  const { data, error } = await supabase
    .from("marketplace_products")
    .select("slug, name, brand:marketplace_brands(slug, name)")
    .eq("in_stock", true);
  if (error) throw error;
  cachedCatalog = (data ?? [])
    .filter((row) => row.brand)
    .map((row) => ({
      brandSlug: row.brand!.slug,
      brandName: row.brand!.name,
      slug: row.slug,
      name: row.name,
    }));
  return cachedCatalog;
}

/**
 * Finds a genuine OpenHaus listing for a given brand + product name, or
 * `null` when nothing clears the confidence floor. Brand must match
 * (normalized, punctuation-insensitive) exactly — this is intentionally
 * strict since OpenHaus only carries 4 brands today, so a false positive
 * would misdirect a shopper to the wrong product entirely.
 */
export async function findMarketplaceMatch(brand: string, productName: string): Promise<MarketplaceMatch | null> {
  try {
    const catalog = await loadCatalog();
    const wantedBrand = normalizeBrand(brand);
    const candidates = catalog.filter((c) => normalizeBrand(c.brandName) === wantedBrand);
    if (candidates.length === 0) return null;

    let best: { entry: (typeof candidates)[number]; score: number } | null = null;
    for (const entry of candidates) {
      const score = nameOverlap(productName, entry.name);
      if (score >= CONFIDENCE_FLOOR && (!best || score > best.score)) {
        best = { entry, score };
      }
    }
    if (!best) return null;
    return { slug: best.entry.slug, brandSlug: best.entry.brandSlug, name: best.entry.name };
  } catch {
    // Network/DB hiccup — fail closed to "no match" rather than surface an error for a non-critical enhancement.
    return null;
  }
}
