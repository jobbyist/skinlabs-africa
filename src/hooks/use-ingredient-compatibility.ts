import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type CompatibilityResult = Database["public"]["Functions"]["get_ingredient_interaction"]["Returns"][number];

async function fetchCompatibility(idA: string, idB: string): Promise<CompatibilityResult | null> {
  const { data, error } = await supabase.rpc("get_ingredient_interaction", { a: idA, b: idB });
  if (error) throw error;
  return data?.[0] ?? null;
}

/** DB-driven compatibility lookup for two ingredients via the ordered-pair
 *  get_ingredient_interaction() RPC — never an LLM guess. Returns null (not
 *  an error) when no verified relationship row exists for the pair. */
export function useIngredientCompatibility(idA: string | undefined, idB: string | undefined) {
  return useQuery({
    queryKey: ["ingredient-compatibility", idA, idB],
    queryFn: () => fetchCompatibility(idA as string, idB as string),
    enabled: !!idA && !!idB && idA !== idB,
    staleTime: 5 * 60 * 1000,
  });
}

export interface IngredientOption {
  id: string;
  slug: string;
  label: string;
}

async function searchIngredientOptions(query: string): Promise<IngredientOption[]> {
  if (!query || query.trim().length < 2) return [];
  const { data, error } = await supabase.rpc("search_ingredients", {
    p_search: query.trim(),
    p_page: 1,
    p_per_page: 8,
  });
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    label: row.common_name || row.inci_name,
  }));
}

/** Alias-aware ingredient search for the checker's combobox inputs. */
export function useIngredientOptions(query: string) {
  return useQuery({
    queryKey: ["ingredient-options", query],
    queryFn: () => searchIngredientOptions(query),
    staleTime: 60 * 1000,
  });
}
