import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Tag } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { scoreTextItem } from "@/lib/search-engine";
import { useMarketplaceProducts, useMarketplaceBrands } from "@/hooks/use-marketplace-products";
import { formatZar } from "@/lib/marketplace/pricing";

const PRODUCT_CAP = 12;
const BRAND_CAP = 4;

/**
 * OpenHaus marketplace search — scoped to marketplace products + brands only.
 * Indexes name, brand, description, category, concerns, values, key actives,
 * and skin-tone claims so ingredient- and concern-led queries resolve well.
 */
export function MarketplaceSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const { data: products } = useMarketplaceProducts();
  const { data: brands } = useMarketplaceBrands();
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

  const rankedProducts = useMemo(() => {
    if (!products || !hasQuery) return [];
    return products
      .map((product) => {
        const haystack = [
          product.brand.name,
          product.description,
          product.category,
          product.size ?? "",
          ...product.concern,
          ...product.values,
          ...product.keyActives,
          ...product.skinToneClaims,
        ].join(" ");
        const match = scoreTextItem(query, product.name, haystack, [
          product.brand.name,
          product.category,
          ...product.concern,
          ...product.values,
          ...product.keyActives,
        ]);
        return { product, score: match.score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, PRODUCT_CAP);
  }, [products, query, hasQuery]);

  const rankedBrands = useMemo(() => {
    if (!brands || !hasQuery) return [];
    return brands
      .map((brand) => {
        const match = scoreTextItem(
          query,
          brand.name,
          `${brand.origin ?? ""} ${brand.description ?? ""} ${(brand.values ?? []).join(" ")}`,
          brand.values ?? [],
        );
        return { brand, score: match.score };
      })
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, BRAND_CAP);
  }, [brands, query, hasQuery]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Search products, brands, ingredients, concerns…"
        value={rawQuery}
        onValueChange={setRawQuery}
      />
      <CommandList>
        {hasQuery && rankedProducts.length === 0 && rankedBrands.length === 0 && (
          <CommandEmpty>No OpenHaus results for “{query}”.</CommandEmpty>
        )}
        {rankedBrands.length > 0 && (
          <CommandGroup heading="Brands">
            {rankedBrands.map(({ brand }) => (
              <CommandItem
                key={brand.id}
                value={`brand-${brand.id}`}
                onSelect={() => go(`/marketplace/brand/${brand.slug}`)}
                className="flex items-center gap-3"
              >
                <Tag className="h-4 w-4 shrink-0 text-stone-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{brand.name}</p>
                  {brand.origin && (
                    <p className="truncate text-xs text-muted-foreground">{brand.origin}</p>
                  )}
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {rankedProducts.length > 0 && (
          <CommandGroup heading="Products">
            {rankedProducts.map(({ product }) => (
              <CommandItem
                key={product.id}
                value={product.id}
                onSelect={() => go(`/marketplace/product/${product.slug}`)}
                className="flex items-center gap-3"
              >
                <Package className="h-4 w-4 shrink-0 text-stone-400" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{product.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {product.brand.name}
                    {product.category ? ` · ${product.category}` : ""}
                  </p>
                </div>
                <span className="shrink-0 text-xs font-semibold text-stone-600">
                  {formatZar(product.markedUpPriceZar)}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
