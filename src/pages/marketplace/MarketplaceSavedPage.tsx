import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/MarketplaceBreadcrumbs";
import { MarketplaceProductCard } from "@/components/marketplace/MarketplaceProductCard";
import { useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { useSavedProducts } from "@/hooks/use-saved-products";

export default function MarketplaceSavedPage() {
  const { data: products, isLoading } = useMarketplaceProducts();
  const { savedIds, toggleSaved } = useSavedProducts();
  const saved = products?.filter((p) => savedIds.has(p.id)) ?? [];

  return (
    <>
      <Helmet>
        <title>Saved | OpenHaus by SkinLabs®</title>
        <meta name="description" content="Your saved OpenHaus products." />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <MarketplaceBreadcrumbs items={[{ label: "Saved" }]} />
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight">Saved</h1>
            <Link
              to="/dashboard"
              className="text-xs font-medium text-stone-500 hover:text-stone-800 underline underline-offset-2"
            >
              Also on your account dashboard →
            </Link>
          </div>
          {isLoading ? (
            <p className="text-sm text-stone-400">Loading…</p>
          ) : saved.length === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-stone-200 py-16 text-center">
              <Heart className="h-8 w-8 text-stone-300" />
              <p className="text-sm font-medium text-stone-700">Nothing saved yet</p>
              <p className="text-xs text-stone-400">Tap the heart on any product to save it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-5">
              {saved.map((product) => (
                <MarketplaceProductCard
                  key={product.id}
                  product={product}
                  saved
                  onToggleSave={() => toggleSaved(product.id)}
                />
              ))}
            </div>
          )}
        </div>
        <MobileBottomNav />
      </div>
    </>
  );
}
