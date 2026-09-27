import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type IngredientSummary = Database["public"]["Functions"]["search_ingredients"]["Returns"][number];

export interface IngredientFilters {
  search?: string;
  category?: string;
  concernSlug?: string;
  evidence?: Database["public"]["Enums"]["evidence_level"];
}

const PER_PAGE = 10;

interface SearchResult {
  items: IngredientSummary[];
  total: number;
}

async function fetchIngredients(filters: IngredientFilters, page: number): Promise<SearchResult> {
  const { data, error } = await supabase.rpc("search_ingredients", {
    p_search: filters.search || undefined,
    p_category: filters.category || undefined,
    p_concern_slug: filters.concernSlug || undefined,
    p_evidence: filters.evidence || undefined,
    p_page: page,
    p_per_page: PER_PAGE,
  });
  if (error) throw error;
  const rows = data ?? [];
  return { items: rows, total: rows[0]?.total_count ?? 0 };
}

/** Paginated, filtered, alias-aware ingredient directory listing — 10 per page via search_ingredients(). */
export function useIngredients(filters: IngredientFilters, page: number) {
  return useQuery({
    queryKey: ["ingredients-search", filters, page],
    queryFn: () => fetchIngredients(filters, page),
    staleTime: 5 * 60 * 1000,
  });
}

export const INGREDIENTS_PER_PAGE = PER_PAGE;
