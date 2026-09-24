import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, ChevronRight, Search, Package } from "lucide-react";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/MarketplaceBreadcrumbs";
import { useMarketplaceBrands, useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { featuredBrands } from "./marketplaceData";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

/** Fallback short descriptions when Supabase description is empty */
const FALLBACK_DESCRIPTIONS: Record<string, string> = {
  skoon: "Clean, minimalist SA skincare focused on barrier health and everyday essentials.",
  "standard-beauty": "Affordable actives that work — evidence-led formulas without the markup.",
  esse: "Probiotic skincare rooted in microbiome science and South African botanicals.",
  lelive: "Sun-smart, climate-aware formulas built for South African skin and light.",
};

export default function MarketplaceBrandsPage() {
  const { data: brands, isLoading } = useMarketplaceBrands();
  const { data: products } = useMarketplaceProducts();
  const [query, setQuery] = useState("");

  const productCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products ?? []) {
      map.set(p.brand.slug, (map.get(p.brand.slug) ?? 0) + 1);
    }
    return map;
  }, [products]);

  const coverBySlug = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of featuredBrands) {
      if (b.coverImage) map.set(b.slug, b.coverImage);
    }
    return map;
  }, []);

  const filtered = useMemo(() => {
    const list = brands ?? [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        (b.origin ?? "").toLowerCase().includes(q) ||
        (b.description ?? "").toLowerCase().includes(q) ||
        (FALLBACK_DESCRIPTIONS[b.slug] ?? "").toLowerCase().includes(q),
    );
  }, [brands, query]);

  return (
    <>
      <Helmet>
        <title>All brands | OpenHaus by SkinLabs®</title>
        <meta
          name="description"
          content="Every South African skincare brand stocked on OpenHaus, curated by SkinLabs®."
        />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <MarketplaceBreadcrumbs items={[{ label: "Brands" }]} />
          <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight mb-2">
            All brands
          </h1>
          <p className="text-sm text-stone-500 mb-5">
            Independent South African labels, curated for climate, concern and real ingredient lists.
          </p>

          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search brands…"
              className="pl-9 rounded-full border-stone-200 bg-white"
              aria-label="Search brands"
            />
          </div>

          {isLoading ? (
            <p className="text-sm text-stone-400">Loading…</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-stone-400">No brands match “{query}”.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-5">
              {filtered.map((brand) => {
                const count = productCounts.get(brand.slug) ?? 0;
                const cover =
                  brand.coverImagePath ||
                  coverBySlug.get(brand.slug) ||
                  undefined;
                const desc =
                  brand.description?.trim() ||
                  FALLBACK_DESCRIPTIONS[brand.slug] ||
                  "South African skincare on OpenHaus.";

                return (
                  <Link
                    key={brand.id}
                    to={`/marketplace/brand/${brand.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white card-interactive hover:border-stone-400"
                  >
                    <div className="relative h-28 lg:h-36 bg-stone-900">
                      {cover ? (
                        <img
                          src={cover}
                          alt={`${brand.name} cover`}
                          className="h-full w-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <span className="text-2xl font-light tracking-widest text-white">
                            {brand.name}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-bold text-stone-900 group-hover:underline underline-offset-2">
                            {brand.name}
                          </p>
                          {brand.origin && (
                            <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                              <MapPin className="h-3 w-3" /> {brand.origin}
                            </p>
                          )}
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-stone-400" />
                      </div>
                      <p className="text-xs leading-relaxed text-stone-500 line-clamp-2">{desc}</p>
                      <p className="mt-auto flex items-center gap-1.5 text-[11px] font-medium text-stone-600">
                        <Package className="h-3.5 w-3.5" />
                        {count} product{count === 1 ? "" : "s"}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
        <MobileBottomNav />
      </div>
    </>
  );
}
