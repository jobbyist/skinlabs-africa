import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type IngredientRow = Database["public"]["Tables"]["ingredients"]["Row"];

export interface IngredientConcernLink {
  relationship: Database["public"]["Enums"]["ingredient_concern_relationship"];
  concern_name: string;
  concern_slug: string;
}

export interface IngredientInteractionLink {
  id: string;
  interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"];
  explanation: string | null;
  usage_guidance: string | null;
  source_url: string | null;
  confidence: Database["public"]["Enums"]["confidence_level"] | null;
  other_ingredient_id: string;
  other_ingredient_slug: string;
  other_ingredient_name: string;
}

export interface IngredientProductLink {
  product_id: string;
  product_slug: string;
  product_name: string;
  brand_name: string;
  is_key_ingredient: boolean | null;
}

export interface IngredientSourceLink {
  id: string;
  source_url: string;
  source_title: string | null;
  publisher: string | null;
  publication_date: string | null;
  evidence_summary: string | null;
}

export interface IngredientDetail {
  ingredient: IngredientRow;
  concerns: IngredientConcernLink[];
  interactions: IngredientInteractionLink[];
  products: IngredientProductLink[];
  sources: IngredientSourceLink[];
}

async function fetchIngredientDetail(slug: string): Promise<IngredientDetail | null> {
  const { data: ingredient, error: ingredientError } = await supabase
    .from("ingredients")
    .select("*")
    .eq("slug", slug)
    .neq("verification_status", "deprecated")
    .maybeSingle();
  if (ingredientError) throw ingredientError;
  if (!ingredient) return null;

  const [
    { data: concernRows, error: concernError },
    { data: interactionRows, error: interactionError },
    { data: productRows, error: productError },
    { data: sourceRows, error: sourceError },
  ] = await Promise.all([
      supabase
        .from("ingredient_concerns")
        .select("relationship, skin_concerns(name, slug)")
        .eq("ingredient_id", ingredient.id),
      supabase
        .from("ingredient_interactions")
        .select(
          "id, interaction_type, explanation, usage_guidance, source_url, confidence, ingredient_a_id, ingredient_b_id, a:ingredients!ingredient_interactions_ingredient_a_id_fkey(id, slug, inci_name, common_name), b:ingredients!ingredient_interactions_ingredient_b_id_fkey(id, slug, inci_name, common_name)",
        )
        .or(`ingredient_a_id.eq.${ingredient.id},ingredient_b_id.eq.${ingredient.id}`),
      supabase
        .from("product_ingredients")
        .select(
          "is_key_ingredient, product_versions!inner(is_current, products(id, slug, name, brands(name)))",
        )
        .eq("ingredient_id", ingredient.id)
        .eq("product_versions.is_current", true)
        .limit(12),
      supabase
        .from("ingredient_sources")
        .select("id, source_url, source_title, publisher, publication_date, evidence_summary")
        .eq("ingredient_id", ingredient.id)
        .order("publication_date", { ascending: false }),
    ]);

  if (concernError) throw concernError;
  if (interactionError) throw interactionError;
  if (productError) throw productError;
  if (sourceError) throw sourceError;

  const concerns: IngredientConcernLink[] = (concernRows ?? [])
    .filter((r) => r.skin_concerns)
    .map((r) => ({
      relationship: r.relationship,
      concern_name: (r.skin_concerns as { name: string; slug: string }).name,
      concern_slug: (r.skin_concerns as { name: string; slug: string }).slug,
    }));

  const interactions: IngredientInteractionLink[] = (interactionRows ?? []).map((r) => {
    const isA = r.ingredient_a_id === ingredient.id;
    const other = (isA ? r.b : r.a) as { id: string; slug: string; inci_name: string; common_name: string | null } | null;
    return {
      id: r.id,
      interaction_type: r.interaction_type,
      explanation: r.explanation,
      usage_guidance: r.usage_guidance,
      source_url: r.source_url,
      confidence: r.confidence,
      other_ingredient_id: other?.id ?? "",
      other_ingredient_slug: other?.slug ?? "",
      other_ingredient_name: other?.common_name || other?.inci_name || "",
    };
  });

  const products: IngredientProductLink[] = (productRows ?? [])
    .map((r): IngredientProductLink | null => {
      const pv = r.product_versions as { products: { id: string; slug: string; name: string; brands: { name: string } | null } | null } | null;
      const p = pv?.products;
      if (!p) return null;
      return {
        product_id: p.id,
        product_slug: p.slug,
        product_name: p.name,
        brand_name: p.brands?.name ?? "",
        is_key_ingredient: r.is_key_ingredient,
      };
    })
    .filter((p): p is IngredientProductLink => p !== null);

  const sources: IngredientSourceLink[] = sourceRows ?? [];

  return { ingredient, concerns, interactions, products, sources };
}

/** Full ingredient detail: the row itself, its concern links, its interaction
 *  links (both directions of ingredient_a/b resolved to "the other ingredient"),
 *  and real products (current formulation) that contain it. */
export function useIngredientDetail(slug: string | undefined) {
  return useQuery({
    queryKey: ["ingredient-detail", slug],
    queryFn: () => fetchIngredientDetail(slug as string),
    enabled: !!slug,
    staleTime: 5 * 60 * 1000,
  });
}
