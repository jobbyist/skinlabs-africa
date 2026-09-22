import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ResolvedIngredient {
  id: string;
  slug: string;
}

const CONCENTRATION_SUFFIX = /\s*[\d.]+%\s*$/;
const PARENTHETICAL = /^(.*?)\s*\(([^)]+)\)\s*$/;

/** A free-text ingredient string like "Niacinamide 10%" or "Argireline
 *  (Acetyl Hexapeptide-8)" may carry a concentration suffix and/or a
 *  common-name/INCI-name pairing in parentheses. Generates the plausible
 *  standalone name candidates to try resolving, in order. */
function nameCandidates(raw: string): string[] {
  const stripped = raw.replace(CONCENTRATION_SUFFIX, "").trim();
  const candidates = [stripped];
  const parenMatch = stripped.match(PARENTHETICAL);
  if (parenMatch) {
    candidates.push(parenMatch[1].trim(), parenMatch[2].trim());
  }
  return candidates.filter((c) => c.length >= 2);
}

async function resolveExactMatch(candidate: string): Promise<ResolvedIngredient | null> {
  const { data, error } = await supabase.rpc("search_ingredients", {
    p_search: candidate,
    p_page: 1,
    p_per_page: 5,
  });
  if (error || !data) return null;
  const lower = candidate.toLowerCase();
  const exact = data.find(
    (row) => row.common_name?.toLowerCase() === lower || row.inci_name?.toLowerCase() === lower,
  );
  return exact ? { id: exact.id, slug: exact.slug } : null;
}

/** Resolves a free-text ingredient name (e.g. a product's key_ingredients
 *  entry, or an AI-generated report's ingredient mention) to a real
 *  `ingredients` row, via the same alias-aware `search_ingredients` RPC the
 *  Ingredient Checker's combobox already uses. Only ever returns a match on
 *  a confident, exact (case-insensitive) match against common_name/
 *  inci_name/alias — never a fuzzy top-result guess, since a wrong link is
 *  worse than no link. Returns null when unresolved so callers can fall
 *  back to plain, unlinked text. */
export async function resolveIngredientSlug(rawName: string): Promise<ResolvedIngredient | null> {
  if (!rawName || rawName.trim().length < 2) return null;
  for (const candidate of nameCandidates(rawName)) {
    const resolved = await resolveExactMatch(candidate);
    if (resolved) return resolved;
  }
  return null;
}

/** Batch-resolves a list of free-text ingredient names (e.g. a product's
 *  full key_ingredients array) to a Map<rawName, ResolvedIngredient | null>,
 *  cached by the exact name list so re-renders don't re-hit the RPC. */
export function useResolvedIngredientSlugs(names: string[]) {
  return useQuery({
    queryKey: ["resolved-ingredient-slugs", names],
    queryFn: async () => {
      const entries = await Promise.all(
        names.map(async (name) => [name, await resolveIngredientSlug(name)] as const),
      );
      return new Map(entries);
    },
    enabled: names.length > 0,
    staleTime: 60 * 60 * 1000,
  });
}
