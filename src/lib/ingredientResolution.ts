import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export interface ResolvedIngredient {
  id: string;
  slug: string;
}

interface SearchIngredientRow {
  id: string;
  slug: string;
  common_name: string | null;
  inci_name: string | null;
}

const CONCENTRATION_SUFFIX = /\s*[\d.]+%\s*$/;
const PARENTHETICAL = /^(.*?)\s*\(([^)]+)\)\s*$/;

/** A free-text ingredient string like "Niacinamide 10%" or "Argireline
 *  (Acetyl Hexapeptide-8)" may carry a concentration suffix and/or a
 *  common-name/INCI-name pairing in parentheses. Generates the plausible
 *  standalone name candidates to try resolving, in order. */
export function nameCandidates(raw: string): string[] {
  const stripped = raw.replace(CONCENTRATION_SUFFIX, "").trim();
  const candidates = [stripped];
  const parenMatch = stripped.match(PARENTHETICAL);
  if (parenMatch) {
    candidates.push(parenMatch[1].trim(), parenMatch[2].trim());
  }
  return candidates.filter((c) => c.length >= 2);
}

async function resolveExactMatch(client: SupabaseClient<Database>, candidate: string): Promise<ResolvedIngredient | null> {
  const { data, error } = await client.rpc("search_ingredients", {
    p_search: candidate,
    p_page: 1,
    p_per_page: 5,
  });
  if (error || !data) return null;
  const lower = candidate.toLowerCase();
  const exact = (data as SearchIngredientRow[]).find(
    (row) => row.common_name?.toLowerCase() === lower || row.inci_name?.toLowerCase() === lower,
  );
  return exact ? { id: exact.id, slug: exact.slug } : null;
}

/** Resolves a free-text ingredient name (e.g. a product's key_ingredients
 *  entry) to a real `ingredients` row, via the same alias-aware
 *  `search_ingredients` RPC the Ingredient Checker's combobox already uses.
 *  Takes an injected Supabase client so it works identically from a browser
 *  session (src/lib/resolveIngredientSlug.ts) or a server-side SSR loader
 *  (createSupabaseServerClient()) without duplicating the matching logic.
 *  Only ever returns a confident, exact (case-insensitive) match -- never a
 *  fuzzy top-result guess, since a wrong link is worse than no link. */
export async function resolveIngredientWithClient(
  client: SupabaseClient<Database>,
  rawName: string,
): Promise<ResolvedIngredient | null> {
  if (!rawName || rawName.trim().length < 2) return null;
  for (const candidate of nameCandidates(rawName)) {
    const resolved = await resolveExactMatch(client, candidate);
    if (resolved) return resolved;
  }
  return null;
}
