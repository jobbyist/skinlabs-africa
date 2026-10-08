import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { fetchGeneratedReviews } from "@/lib/generatedReviews";

/** All pipeline-generated reviews, mapped to ProductReview shape and ready to merge
 *  with the static productReviews catalogue (e.g. [...productReviews, ...data]). */
export function useGeneratedReviews() {
  return useQuery({
    queryKey: ["ai-generated-product-reviews"],
    queryFn: () => fetchGeneratedReviews(supabase),
    staleTime: 5 * 60 * 1000,
  });
}
