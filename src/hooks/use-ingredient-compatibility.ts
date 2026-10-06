import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { trackConversionEvent } from "@/lib/analytics-events";

export type CompatibilityResult = Database["public"]["Functions"]["get_ingredient_pair_note"]["Returns"][number];

export type NoteSource = "curated" | "class_guidance" | "general";

async function fetchCompatibility(idA: string, idB: string): Promise<CompatibilityResult | null> {
  const { data, error } = await supabase.rpc("get_ingredient_pair_note", { a: idA, b: idB });
  if (error) throw error;
  const result = data?.[0] ?? null;
  // Fires once per real, cached-by-react-query check (not per keystroke).
  trackConversionEvent("ingredient_checker_checked", {
    found: result?.note_source === "curated",
    note_source: result?.note_source ?? "none",
    interaction_type: result?.interaction_type ?? "none",
  });
  return result;
}

/** DB-driven note for any two published ingredients via get_ingredient_pair_note():
 *  a cited note when one exists, else class-level guidance from the ingredients'
 *  categories, else an explicit "nothing on record" — never an LLM guess, and never
 *  a claim that an untested pair is safe. */
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

/** Resolves a slug (from ?a= / ?b= links on ingredient pages) to a picker option. */
export function useIngredientOptionBySlug(slug: string | null) {
  return useQuery({
    queryKey: ["ingredient-option-slug", slug],
    queryFn: async (): Promise<IngredientOption | null> => {
      const { data, error } = await supabase.from("ingredients").select("id, slug, common_name, inci_name").eq("slug", slug as string).maybeSingle();
      if (error) throw error;
      return data ? { id: data.id, slug: data.slug, label: data.common_name || data.inci_name } : null;
    },
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}
