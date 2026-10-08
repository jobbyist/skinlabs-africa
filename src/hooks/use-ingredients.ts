import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { isSouthAfricanBotanical, unionByName } from "@/lib/ingredientMatrix";

export type IngredientSummary = Database["public"]["Functions"]["search_ingredients"]["Returns"][number];

export interface IngredientFilters {
  search?: string;
  category?: string;
  concernSlug?: string;
  /** Matrix mode: any-of these concerns (replaces concernSlug when set). */
  concerns?: string[];
  /** Only South African / indigenous botanicals (src/lib/ingredientMatrix.ts). */
  saOnly?: boolean;
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

const MATRIX_FETCH_SIZE = 300;

/**
 * Matrix mode (several concerns, or SA botanicals): the RPC filters by ONE concern, so fetch each selected concern
 * (or everything for SA-only), union by id, filter, and paginate in the browser. The catalogue is a few hundred rows.
 */
async function fetchMatrix(filters: IngredientFilters, page: number): Promise<SearchResult> {
  const concerns = filters.concerns?.length ? filters.concerns : [undefined];
  const lists = await Promise.all(
    concerns.map(async (concern) => {
      const { data, error } = await supabase.rpc("search_ingredients", {
        p_search: filters.search || undefined,
        p_category: filters.category || undefined,
        p_concern_slug: concern,
        p_evidence: filters.evidence || undefined,
        p_page: 1,
        p_per_page: MATRIX_FETCH_SIZE,
      });
      if (error) throw error;
      return data ?? [];
    }),
  );
  let items = unionByName(lists);
  if (filters.saOnly) items = items.filter(isSouthAfricanBotanical);
  return { items: items.slice((page - 1) * PER_PAGE, page * PER_PAGE), total: items.length };
}

export const usesMatrix = (f: IngredientFilters) => (f.concerns?.length ?? 0) > 1 || Boolean(f.saOnly);

/** Paginated, filtered, alias-aware ingredient directory listing — 10 per page via search_ingredients(). */
export function useIngredients(filters: IngredientFilters, page: number) {
  return useQuery({
    queryKey: ["ingredients-search", filters, page],
    queryFn: () =>
      usesMatrix(filters)
        ? fetchMatrix(filters, page)
        : fetchIngredients({ ...filters, concernSlug: filters.concerns?.[0] ?? filters.concernSlug }, page),
    staleTime: 5 * 60 * 1000,
  });
}

export const INGREDIENTS_PER_PAGE = PER_PAGE;
