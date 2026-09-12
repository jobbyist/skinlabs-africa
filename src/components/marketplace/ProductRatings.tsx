import { useState } from "react";
import { Star, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useMarketplaceRating } from "@/hooks/use-marketplace-rating";
import { cn } from "@/lib/utils";

function Stars({ value, size = "sm" }: { value: number; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star key={s} className={cn(h, s <= Math.round(value) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200")} />
      ))}
    </div>
  );
}

/**
 * Two distinct rating dimensions, deliberately never blended:
 * 1. External — real Faithful to Nature rating (only rendered when a row
 *    exists; a product with none simply shows nothing here, never a
 *    fabricated placeholder), tooltip credits the source.
 * 2. Internal — SkinLabs®'s own signed-in-user rating system for OpenHaus,
 *    with an inline 1-5 star submission control.
 */
export function ProductRatings({
  productId,
  externalRating,
}: {
  productId: string;
  externalRating: { rating: number | null; reviewCount: number | null; sourceUrl: string } | null;
}) {
  const { summary, myRating, submitRating, canRate } = useMarketplaceRating(productId);
  const [hoverRating, setHoverRating] = useState<number | null>(null);

  const hasExternal = externalRating && externalRating.rating !== null;

  return (
    <div className="flex flex-col gap-2">
      {hasExternal && (
        <div className="flex items-center gap-1.5">
          <Stars value={externalRating.rating!} />
          <span className="text-[12px] font-medium text-stone-600">
            {externalRating.rating!.toFixed(1)} {externalRating.reviewCount ? `(${externalRating.reviewCount})` : ""}
          </span>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-3 w-3 text-stone-400" />
            </TooltipTrigger>
            <TooltipContent className="max-w-[220px] text-xs">
              Rating sourced from Faithful to Nature, this product's retailer.
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-stone-400">SkinLabs® Rating</span>
        {summary.ratingCount > 0 ? (
          <>
            <Stars value={summary.avgRating ?? 0} />
            <span className="text-[12px] font-medium text-stone-600">
              {summary.avgRating?.toFixed(1)} ({summary.ratingCount})
            </span>
          </>
        ) : (
          <span className="text-[12px] text-stone-400">No SkinLabs ratings yet</span>
        )}
      </div>

      {canRate && (
        <div className="flex items-center gap-1">
          <span className="mr-1 text-[11px] text-stone-500">{myRating ? "Your rating:" : "Rate this product:"}</span>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              aria-label={`Rate ${s} stars`}
              onMouseEnter={() => setHoverRating(s)}
              onMouseLeave={() => setHoverRating(null)}
              onClick={() => submitRating(s)}
              className="p-0.5"
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  s <= (hoverRating ?? myRating ?? 0) ? "fill-amber-400 text-amber-400" : "text-stone-300",
                )}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
