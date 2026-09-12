import { useParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { findBySlug, skinTones } from "@/data/marketplace/taxonomy";

export default function MarketplaceSkinTonePage() {
  const { band = "" } = useParams<{ band: string }>();
  const entry = findBySlug(skinTones, band);
  const label = entry?.label ?? "Skin Tone";

  return (
    <>
      <Helmet>
        <title>{label} — Shop by skin tone | OpenHaus by SkinLabs®</title>
        <meta name="description" content={`Products explicitly formulated for ${label.toLowerCase()} on OpenHaus, curated by SkinLabs®.`} />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <MarketplaceGrid heading={label} preset={{ type: "skin-tone", slug: band }} />
        <MobileBottomNav />
      </div>
    </>
  );
}
