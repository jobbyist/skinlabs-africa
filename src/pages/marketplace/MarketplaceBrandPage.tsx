import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MapPin } from "lucide-react";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { useMarketplaceBrands } from "@/hooks/use-marketplace-products";
import { featuredBrands } from "./marketplaceData";

export default function MarketplaceBrandPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const { data: brands } = useMarketplaceBrands();
  const brand = brands?.find((b) => b.slug === slug);
  const coverImage = featuredBrands.find((b) => b.slug === slug)?.coverImage;

  return (
    <>
      <Helmet>
        <title>{brand?.name ?? "Brand"} | OpenHaus by SkinLabs®</title>
        <meta name="description" content={brand?.description ?? `Shop ${brand?.name ?? "this brand"} on OpenHaus, curated by SkinLabs®.`} />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />

        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 pt-4">
          <div className="rounded-3xl overflow-hidden bg-stone-900">
            {coverImage ? (
              <img src={coverImage} alt={brand?.name ?? slug} className="h-40 lg:h-64 w-full object-cover" />
            ) : (
              <div className="h-40 lg:h-64 flex items-center justify-center text-white text-2xl font-black">{brand?.name}</div>
            )}
          </div>
          <div className="mt-4 flex items-center justify-between">
            <div>
              <h1 className="font-black text-[22px] lg:text-[28px] text-stone-900">{brand?.name}</h1>
              {brand?.origin && (
                <p className="flex items-center gap-1 text-xs text-stone-400 mt-1">
                  <MapPin className="h-3 w-3" /> {brand.origin}
                </p>
              )}
            </div>
            {brand?.values && brand.values.length > 0 && (
              <div className="hidden sm:flex flex-wrap gap-1.5 justify-end max-w-xs">
                {brand.values.map((v) => (
                  <span key={v} className="rounded-full border border-stone-200 px-2.5 py-1 text-[10px] font-medium text-stone-600">
                    {v}
                  </span>
                ))}
              </div>
            )}
          </div>
          {brand?.description && <p className="mt-3 text-sm text-stone-500 max-w-2xl">{brand.description}</p>}
        </div>

        <MarketplaceGrid heading="Products" preset={{ type: "brand", brandSlug: slug }} />
        <MobileBottomNav />
      </div>
    </>
  );
}
