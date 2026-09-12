import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface InternalRatingSummary {
  avgRating: number | null;
  ratingCount: number;
}

/**
 * SkinLabs®'s own internal rating for a marketplace product — distinct from
 * the (separately displayed) external Faithful to Nature rating. Signed-in
 * users can submit one rating per product (upsert), and everyone sees the
 * aggregate summary.
 */
export function useMarketplaceRating(productId: string | undefined) {
  const { user } = useAuth();
  const [summary, setSummary] = useState<InternalRatingSummary>({ avgRating: null, ratingCount: 0 });
  const [myRating, setMyRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!productId) return;
    setLoading(true);
    const [{ data: summaryRow }, { data: mine }] = await Promise.all([
      supabase
        .from("marketplace_product_internal_rating_summary")
        .select("avg_rating, rating_count")
        .eq("product_id", productId)
        .maybeSingle(),
      user
        ? supabase
            .from("marketplace_product_user_ratings")
            .select("rating")
            .eq("product_id", productId)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    setSummary({
      avgRating: summaryRow?.avg_rating === null || summaryRow?.avg_rating === undefined ? null : Number(summaryRow.avg_rating),
      ratingCount: summaryRow?.rating_count ?? 0,
    });
    setMyRating(mine?.rating ?? null);
    setLoading(false);
  }, [productId, user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const submitRating = useCallback(
    async (rating: number) => {
      if (!productId || !user) return;
      await supabase
        .from("marketplace_product_user_ratings")
        .upsert({ product_id: productId, user_id: user.id, rating }, { onConflict: "product_id,user_id" });
      await refresh();
    },
    [productId, user, refresh],
  );

  return { summary, myRating, loading, submitRating, canRate: Boolean(user) };
}
