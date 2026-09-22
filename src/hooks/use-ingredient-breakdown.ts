import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchIngredientBreakdown, type IngredientBreakdownEntry } from "@/lib/ingredientBreakdown";

export function useIngredientBreakdown(names: string[]) {
  return useQuery<IngredientBreakdownEntry[]>({
    queryKey: ["ingredient-breakdown", names],
    queryFn: () => fetchIngredientBreakdown(supabase, names),
    enabled: names.length > 0,
    staleTime: 60 * 60 * 1000,
  });
}
