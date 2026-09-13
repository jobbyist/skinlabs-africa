import { Link, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/MarketplaceBreadcrumbs";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { categories, findBySlug } from "@/data/marketplace/taxonomy";

export default function MarketplaceCategoriesPage() {
  const [params] = useSearchParams();
  const categorySlug = params.get("category");
  const entry = categorySlug ? findBySlug(categories, categorySlug) : undefined;

  return (
    <>
      <Helmet>
        <title>
          {entry ? `${entry.label} — Shop by category` : "Shop by category"} | OpenHaus by SkinLabs®
        </title>
        <meta
          name="description"
          content="Browse OpenHaus skincare by category — face, body, hair & scalp, sun care, treatments and tools."
        />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 pt-4">
          <MarketplaceBreadcrumbs
            items={
              entry
                ? [
                    { label: "Categories", href: "/marketplace/categories" },
                    { label: entry.label },
                  ]
                : [{ label: "Categories" }]
            }
          />
        </div>
        {entry ? (
          <MarketplaceGrid heading={entry.label} preset={{ type: "category", slug: entry.slug }} />
        ) : (
          <div className="max-w-lg lg:max-w-6xl mx-auto px-4 lg:px-8 pb-6 lg:pb-10">
            <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight mb-5">
              Shop by category
            </h1>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 lg:gap-4">
              {categories.map((cat) => (
                <Link
                  key={cat.slug}
                  to={`/marketplace/categories?category=${cat.slug}`}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-8 text-center hover:border-stone-400 hover:shadow-sm transition-all"
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-sm font-semibold text-stone-800">{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}
        <MobileBottomNav />
      </div>
    </>
  );
}
