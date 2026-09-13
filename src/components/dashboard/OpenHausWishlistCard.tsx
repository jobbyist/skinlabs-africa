import { Link } from "react-router-dom";
import { Heart, ArrowRight, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { formatZar } from "@/lib/marketplace/pricing";

/**
 * Surfaces the OpenHaus marketplace wishlist on the main SkinLabs dashboard.
 * Shares the same localStorage-backed list as /marketplace/saved.
 */
export default function OpenHausWishlistCard() {
  const { savedIds, toggleSaved } = useSavedProducts();
  const { data: products, isLoading } = useMarketplaceProducts();
  const saved = (products ?? []).filter((p) => savedIds.has(p.id)).slice(0, 6);

  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-4 w-4 text-primary" /> OpenHaus wishlist
          </CardTitle>
          <CardDescription>
            Products you saved while shopping the marketplace.{" "}
            <Link to="/marketplace/saved" className="font-medium text-foreground underline underline-offset-2">
              View all
            </Link>
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link to="/marketplace" className="gap-1">
            Shop <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading saved products…</p>
        ) : saved.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-8 text-center">
            <Package className="h-7 w-7 text-muted-foreground/50" />
            <p className="text-sm font-medium text-foreground">No marketplace saves yet</p>
            <p className="text-xs text-muted-foreground">Tap the heart on any OpenHaus product to add it here.</p>
            <Button size="sm" variant="secondary" className="mt-2" asChild>
              <Link to="/marketplace">Browse OpenHaus</Link>
            </Button>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {saved.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                <Link to={`/marketplace/product/${p.slug}`} className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground hover:underline">{p.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {p.brand.name} · {formatZar(p.markedUpPriceZar)}
                  </p>
                </Link>
                <button
                  type="button"
                  onClick={() => toggleSaved(p.id)}
                  className="rounded-full p-2 text-primary hover:bg-accent"
                  aria-label={`Remove ${p.name} from wishlist`}
                >
                  <Heart className="h-4 w-4 fill-current" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
