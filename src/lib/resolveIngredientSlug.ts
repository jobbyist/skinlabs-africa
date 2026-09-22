import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { resolveIngredientWithClient, type ResolvedIngredient } from "@/lib/ingredientResolution";

export type { ResolvedIngredient };

/** Resolves a free-text ingredient name (e.g. "Niacinamide 10%" or
 *  "Argireline (Acetyl Hexapeptide-8)") to a real `ingredients` row using the
 *  browser Supabase client. Thin wrapper around the client-parametrized
 *  resolver in src/lib/ingredientResolution.ts, which is also reused
 *  server-side (SSR loaders) and by src/lib/ingredientBreakdown.ts -- keep
 *  the actual name-matching logic there, not duplicated here. */
export async function resolveIngredientSlug(rawName: string): Promise<ResolvedIngredient | null> {
  return resolveIngredientWithClient(supabase, rawName);
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
