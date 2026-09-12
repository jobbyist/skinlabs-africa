import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin, ChevronRight } from "lucide-react";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { useMarketplaceBrands } from "@/hooks/use-marketplace-products";

export default function MarketplaceBrandsPage() {
  const { data: brands, isLoading } = useMarketplaceBrands();

  return (
    <>
      <Helmet>
        <title>All brands | OpenHaus by SkinLabs®</title>
        <meta name="description" content="Every South African skincare brand stocked on OpenHaus, curated by SkinLabs®." />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight mb-5">All brands</h1>
          {isLoading ? (
            <p className="text-sm text-stone-400">Loading…</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
              {brands?.map((brand) => (
                <Link
                  key={brand.id}
                  to={`/marketplace/brand/${brand.slug}`}
                  className="flex items-center justify-between rounded-2xl border border-stone-200 bg-white px-5 py-4 hover:border-stone-400 hover:shadow-sm transition-all"
                >
                  <div>
                    <p className="font-bold text-stone-900">{brand.name}</p>
                    {brand.origin && (
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400">
                        <MapPin className="h-3 w-3" /> {brand.origin}
                      </p>
                    )}
                  </div>
                  <ChevronRight className="h-4 w-4 text-stone-400" />
                </Link>
              ))}
            </div>
          )}
        </div>
        <MobileBottomNav />
      </div>
    </>
  );
}
