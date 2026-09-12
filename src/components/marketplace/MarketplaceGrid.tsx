import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarketplaceProducts, type MarketplaceProductRecord } from "@/hooks/use-marketplace-products";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { MarketplaceProductCard } from "./MarketplaceProductCard";
import { categories, concerns, values as valueTaxonomy, skinTones, findBySlug } from "@/data/marketplace/taxonomy";
import { cn } from "@/lib/utils";

export type PresetFilter =
  | { type: "category" | "concern" | "values" | "skin-tone"; slug: string }
  | { type: "brand"; brandSlug: string }
  | null;

const sortOptions = [
  { value: "name", label: "Name (A-Z)" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
];

export function MarketplaceGrid({ heading, preset }: { heading: string; preset?: PresetFilter }) {
  const { data: products, isLoading } = useMarketplaceProducts();
  const [category, setCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState("name");
  const { savedIds, toggleSaved } = useSavedProducts();

  const filtered = useMemo(() => {
    if (!products) return [];
    let base = products;

    if (preset?.type === "category") base = base.filter((p) => p.category === preset.slug);
    if (preset?.type === "concern") {
      const label = findBySlug(concerns, preset.slug)?.label;
      base = label ? base.filter((p) => p.concern.includes(label)) : base;
    }
    if (preset?.type === "values") {
      const label = findBySlug(valueTaxonomy, preset.slug)?.label;
      base = label ? base.filter((p) => p.values.includes(label)) : base;
    }
    if (preset?.type === "skin-tone") {
      const label = findBySlug(skinTones, preset.slug)?.label;
      base = label ? base.filter((p) => p.skinToneClaims.includes(label)) : base;
    }
    if (preset?.type === "brand") base = base.filter((p) => p.brand.slug === preset.brandSlug);

    if (category !== "all") base = base.filter((p) => p.category === category);

    const sorted = [...base];
    if (sortBy === "name") sorted.sort((a, b) => a.name.localeCompare(b.name));
    if (sortBy === "price-low") sorted.sort((a, b) => a.markedUpPriceZar - b.markedUpPriceZar);
    if (sortBy === "price-high") sorted.sort((a, b) => b.markedUpPriceZar - a.markedUpPriceZar);

    return sorted;
  }, [products, preset, category, sortBy]);

  return (
    <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
      <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight mb-1">{heading}</h1>
      <p className="text-[12px] lg:text-sm text-stone-500 mb-5">
        {isLoading ? "Loading…" : `${filtered.length} product${filtered.length === 1 ? "" : "s"}`}
      </p>

      {!preset || preset.type !== "category" ? (
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
          <button
            onClick={() => setCategory("all")}
            className={cn(
              "flex-shrink-0 px-4 py-2 rounded-full text-[12px] font-medium border transition-all",
              category === "all" ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-700 border-stone-200 hover:border-stone-400",
            )}
          >
            All categories
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(cat.slug)}
              className={cn(
                "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium border transition-all",
                category === cat.slug ? "bg-stone-900 text-white border-stone-900" : "bg-white text-stone-700 border-stone-200 hover:border-stone-400",
              )}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      ) : null}

      <div className="flex justify-end mb-4">
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-[180px] h-9 text-[12px] rounded-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 && !isLoading ? (
        <div className="rounded-2xl border border-dashed border-stone-200 py-16 text-center text-stone-400 text-sm">
          No products match these filters yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
          {filtered.map((product: MarketplaceProductRecord) => (
            <MarketplaceProductCard
              key={product.id}
              product={product}
              saved={savedIds.has(product.id)}
              onToggleSave={() => toggleSaved(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
