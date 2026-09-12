import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { findBySlug, concerns } from "@/data/marketplace/taxonomy";

export default function MarketplaceConcernPage() {
  const { slug = "" } = useParams<{ slug: string }>();
  const entry = findBySlug(concerns, slug);
  const label = entry?.label ?? "Concern";

  return (
    <>
      <Helmet>
        <title>{label} — Shop by concern | OpenHaus by SkinLabs®</title>
        <meta name="description" content={`Shop OpenHaus products for ${label.toLowerCase()}, curated by SkinLabs®.`} />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <MarketplaceGrid heading={label} preset={{ type: "concern", slug }} />
        <MobileBottomNav />
      </div>
    </>
  );
}
