import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface AllergyFlaggable {
  id: string;
  inciName: string;
  commonName?: string | null;
}

async function fetchAllergies(userId: string): Promise<string[]> {
  const { data, error } = await supabase.from("profiles").select("allergies").eq("user_id", userId).maybeSingle();
  if (error) throw error;
  return (data?.allergies ?? []).map((a) => a.trim()).filter(Boolean);
}

/** Signed-in user's self-reported allergies/sensitivities (profiles.allergies
 *  — free text like "fragrance, nut oils, retinol"). Advisory-only data;
 *  see AllergyCautionNote for how it's ever surfaced. */
export function useUserAllergies() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["user-allergies", user?.id],
    queryFn: () => fetchAllergies(user!.id),
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/** Loose, case-insensitive substring match between a user's free-text
 *  allergy terms and an ingredient's names. profiles.allergies entries are
 *  informal ("nut oils"), not curated INCI names, so an exact match would
 *  miss real matches — but a bare 1-2 character term is excluded to avoid
 *  trivial false positives. A miss here is safer than a false "all clear":
 *  this only ever surfaces a note on a genuine textual match, never
 *  suppresses ambiguity by asserting the ingredient is safe. */
function matchingAllergyTerm(ingredient: AllergyFlaggable, allergies: string[]): string | null {
  const haystacks = [ingredient.inciName, ingredient.commonName]
    .filter((s): s is string => Boolean(s))
    .map((s) => s.toLowerCase());
  for (const term of allergies) {
    const needle = term.toLowerCase();
    if (needle.length < 3) continue;
    if (haystacks.some((h) => h.includes(needle) || needle.includes(h))) return term;
  }
  return null;
}

/** Flags which of the given ingredients match a signed-in user's stated
 *  allergies/sensitivities, as ingredientId -> the matching allergy term.
 *  Empty for signed-out users or when nothing matches. Never a hard block —
 *  purely advisory, rendered via AllergyCautionNote. */
export function useAllergyFlags(ingredients: AllergyFlaggable[]): Map<string, string> {
  const { data: allergies } = useUserAllergies();
  if (!allergies || allergies.length === 0) return new Map();
  const flagged = new Map<string, string>();
  for (const ingredient of ingredients) {
    const match = matchingAllergyTerm(ingredient, allergies);
    if (match) flagged.set(ingredient.id, match);
  }
  return flagged;
}
