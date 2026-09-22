import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, ArrowRight } from "lucide-react";
import type { GroundedRoutine, GroundedPick } from "@/lib/skynnProductMatch";
import { findMarketplaceMatch, type MarketplaceMatch } from "@/lib/marketplaceCrossLink";
import { useResolvedIngredientSlugs } from "@/lib/resolveIngredientSlug";

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

  const uniquePicks = new Map<string, GroundedPick>();
  for (const pick of [...(routine?.am ?? []), ...(routine?.pm ?? [])]) uniquePicks.set(pick.product.id, pick);
  const matchedPicks = [...uniquePicks.values()].filter((pick) => matches[pick.product.id]);

  const allKeyIngredients = useMemo(
    () => [...new Set(matchedPicks.flatMap((pick) => pick.product.key_ingredients))],
    [matchedPicks],
  );
  const { data: resolvedIngredientSlugs } = useResolvedIngredientSlugs(allKeyIngredients);

  if (!routine || matchedCount === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-secondary/20 p-5">
      <div className="flex items-center gap-2 mb-3">
        <ShoppingBag className="h-4 w-4 text-primary shrink-0" />
        <h4 className="font-heading font-semibold text-card-foreground">Shop these picks on OpenHaus</h4>
      </div>
      <div className="flex flex-col gap-3">
        {matchedPicks.map((pick) => {
          const match = matches[pick.product.id];
          return (
            <div key={pick.product.id} className="rounded-lg border border-border bg-background px-3 py-2">
              <Link
                to={`/marketplace/product/${match.slug}`}
                className="flex items-center justify-between gap-2 text-sm hover:text-primary transition-colors"
              >
                <span className="text-foreground">
                  {pick.product.brand} {pick.product.product_name}
                </span>
                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              {pick.product.key_ingredients.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {pick.product.key_ingredients.map((ingredient) => {
                    const resolved = resolvedIngredientSlugs?.get(ingredient);
                    return resolved ? (
                      <Link
                        key={ingredient}
                        to={`/ingredients/${resolved.slug}`}
                        className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                      >
                        {ingredient}
                      </Link>
                    ) : (
                      <span key={ingredient} className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {ingredient}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
