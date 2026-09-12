import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { GroundedRoutine, GroundedPick } from "@/lib/skynnProductMatch";
import { findMarketplaceMatch, type MarketplaceMatch } from "@/lib/marketplaceCrossLink";

/**
 * "Shop on OpenHaus" — a narrow, real-match-only bridge from SKYNN AI's
 * grounded routine picks to the marketplace. Renders nothing unless a
 * genuine OpenHaus listing exists for that exact brand + product.
 */
export default function OpenHausShopLinks({ routine }: { routine: GroundedRoutine | null }) {
  const [matches, setMatches] = useState<Record<string, MarketplaceMatch>>({});

  useEffect(() => {
    if (!routine) return;
    const uniquePicks = new Map<string, GroundedPick>();
    for (const pick of [...routine.am, ...routine.pm]) uniquePicks.set(pick.product.id, pick);

    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        [...uniquePicks.values()].map(async (pick) => {
          const match = await findMarketplaceMatch(pick.product.brand, pick.product.product_name);
          return [pick.product.id, match] as const;
        }),
      );
      if (cancelled) return;
      const found = Object.fromEntries(entries.filter((e): e is [string, MarketplaceMatch] => Boolean(e[1])));
      setMatches(found);
    })();

    return () => {
      cancelled = true;
    };
  }, [routine]);

  const matchedCount = Object.keys(matches).length;
  if (!routine || matchedCount === 0) return null;

  const uniquePicks = new Map<string, GroundedPick>();
  for (const pick of [...routine.am, ...routine.pm]) uniquePicks.set(pick.product.id, pick);

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
        <h4 className="font-heading font-semibold text-card-foreground">Shop these picks on OpenHaus</h4>
      </div>
      <div className="flex flex-col gap-2">
        {[...uniquePicks.values()]
          .filter((pick) => matches[pick.product.id])
          .map((pick) => {
            const match = matches[pick.product.id];
            return (
              <Link
                key={pick.product.id}
                to={`/marketplace/product/${match.slug}`}
                className="flex items-center justify-between gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm hover:border-primary transition-colors"
              >
                <span className="text-foreground">
                  {pick.product.brand} {pick.product.product_name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            );
          })}
      </div>
    </div>
  );
}
