import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { resolveIngredientWithClient, type ResolvedIngredient } from "@/lib/ingredientResolution";

type EvidenceLevel = Database["public"]["Enums"]["evidence_level"];

export interface IngredientBreakdownEntry {
  name: string;
  resolved: ResolvedIngredient | null;
  description: string | null;
  functionSummary: string | null;
  evidenceLevel: EvidenceLevel | null;
}

interface IngredientContentRow {
  id: string;
  description: string | null;
  function_summary: string | null;
  evidence_level: EvidenceLevel | null;
}

/** Resolves each of a product's key_ingredients to a real, published
 *  `ingredients` row (when one exists) and pulls its actual
 *  description/function_summary/evidence_level -- never a fabricated
 *  summary and never just a link. An unresolved name comes back with
 *  `resolved: null` so the caller can render an honest "not yet published"
 *  note; queuing the demand signal for that name happens separately,
 *  server-side (api/product-review-sync.ts's publish step, or the one-time
 *  static-catalogue reconciliation) -- this read-only helper never writes
 *  to ingredient_generation_requests itself, since anon/authenticated has
 *  no write grant on that table by design.
 *
 *  Takes an injected Supabase client so the exact same resolution + query
 *  logic runs from a browser session (src/hooks/use-ingredient-breakdown.ts)
 *  or a server-side SSR loader (src/routes/reviews.$slug.tsx). */
export async function fetchIngredientBreakdown(
  client: SupabaseClient<Database>,
  names: string[],
): Promise<IngredientBreakdownEntry[]> {
  const resolvedEntries = await Promise.all(
    names.map(async (name) => [name, await resolveIngredientWithClient(client, name)] as const),
  );

  const resolvedIds = resolvedEntries
    .map(([, resolved]) => resolved)
    .filter((resolved): resolved is ResolvedIngredient => resolved !== null)
    .map((resolved) => resolved.id);

  let rowsById = new Map<string, IngredientContentRow>();
  if (resolvedIds.length > 0) {
    const { data } = await client
      .from("ingredients")
      .select("id, description, function_summary, evidence_level")
      .in("id", resolvedIds);
    rowsById = new Map((data ?? []).map((row) => [row.id, row as IngredientContentRow]));
  }

  return resolvedEntries.map(([name, resolved]) => {
    const row = resolved ? rowsById.get(resolved.id) : undefined;
    return {
      name,
      resolved,
      description: row?.description ?? null,
      functionSummary: row?.function_summary ?? null,
      evidenceLevel: row?.evidence_level ?? null,
    };
  });
}
