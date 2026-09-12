import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { scoreTextItem } from "@/lib/search-engine";
import { useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { formatZar } from "@/lib/marketplace/pricing";

const RESULTS_CAP = 8;

/**
 * OpenHaus's own search — deliberately scoped ONLY to marketplace_products,
 * never the site-wide reviews/editorial index (that's SiteSearch). Same
 * CommandDialog + debounce + in-browser relevance-scoring pattern.
 */
export function MarketplaceSearch({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const navigate = useNavigate();
  const { data: products } = useMarketplaceProducts();
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebouncedValue(rawQuery, 120);
  const hasQuery = query.trim().length > 0;

  useEffect(() => {
    if (!open) setRawQuery("");
  }, [open]);

  const go = (href: string) => {
    onOpenChange(false);
    navigate(href);
  };

  const ranked = useMemo(() => {
    if (!products) return [];
    return products
      .map((product) => {
        const match = scoreTextItem(
          query,
          product.name,
          `${product.brand.name} ${product.description}`,
          [...product.concern, ...product.values, ...product.keyActives],
        );
        return { product, score: match.score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, RESULTS_CAP);
  }, [products, query]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search OpenHaus products, brands, ingredients…" value={rawQuery} onValueChange={setRawQuery} />
      <CommandList>
        {hasQuery && ranked.length === 0 && <CommandEmpty>No products found.</CommandEmpty>}
        {ranked.length > 0 && (
          <CommandGroup heading="Products">
            {ranked.map(({ product }) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => go(`/marketplace/product/${product.slug}`)}
                className="flex items-center gap-3"
              >
                <Package className="h-4 w-4 shrink-0 text-stone-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">{product.brand.name}</p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-stone-600">{formatZar(product.markedUpPriceZar)}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
