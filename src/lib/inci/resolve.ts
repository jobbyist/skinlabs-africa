import { supabase } from "@/integrations/supabase/client";
import { nameCandidates } from "@/lib/ingredientResolution";
import type { ScannedIngredient } from "@/lib/inci/scanner";

interface Row {
  id: string;
  slug: string;
  inci_name: string | null;
  common_name: string | null;
  category: string | null;
  irritancy_risk: "low" | "moderate" | "high" | null;
}

const cache = new Map<string, ScannedIngredient["match"]>();

/** Exact (case-insensitive) name match only, through the alias-aware search RPC: a wrong match is worse than none. */
const resolveOne = async (token: string): Promise<ScannedIngredient["match"]> => {
  const key = token.toLowerCase();
  if (cache.has(key)) return cache.get(key) ?? null;
  let found: ScannedIngredient["match"] = null;
  for (const candidate of nameCandidates(token)) {
    const { data, error } = await supabase.rpc("search_ingredients", { p_search: candidate, p_page: 1, p_per_page: 5 });
    if (error || !data) continue;
    const lower = candidate.toLowerCase();
    const row = (data as Row[]).find((r) => r.common_name?.toLowerCase() === lower || r.inci_name?.toLowerCase() === lower);
    if (row) {
      found = { id: row.id, slug: row.slug, name: row.common_name || row.inci_name || token, category: row.category, irritancy: row.irritancy_risk };
      break;
    }
  }
  cache.set(key, found);
  return found;
};

/** Resolves every token with a small worker pool so a 40-ingredient list doesn't fire 40 requests at once. */
export const resolveTokens = async (tokens: string[], onProgress?: (done: number) => void, concurrency = 6): Promise<ScannedIngredient[]> => {
  const out: ScannedIngredient[] = tokens.map((token) => ({ token, match: null }));
  let next = 0;
  let done = 0;
  const worker = async () => {
    while (next < tokens.length) {
      const i = next++;
      out[i] = { token: tokens[i], match: await resolveOne(tokens[i]) };
      onProgress?.(++done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, tokens.length) }, worker));
  return out;
};
