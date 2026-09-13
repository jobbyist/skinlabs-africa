import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/MarketplaceBreadcrumbs";

export default function MarketplaceTerms() {
  return (
    <>
      <Helmet>
        <title>Marketplace terms | OpenHaus by SkinLabs®</title>
        <meta
          name="description"
          content="Terms of use for shopping on OpenHaus, the SkinLabs® multivendor skincare marketplace."
        />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <article className="max-w-lg lg:max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <MarketplaceBreadcrumbs items={[{ label: "Marketplace terms" }]} />
          <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight mb-6">
            Marketplace terms
          </h1>

          <div className="prose prose-stone prose-sm max-w-none space-y-6 text-stone-700">
            <p>
              OpenHaus is a curated multivendor marketplace operated by SkinLabs®. By placing an
              order you agree to these terms and our{" "}
              <Link to="/marketplace/shipping-returns" className="underline underline-offset-2">
                shipping & returns policy
              </Link>
              .
            </p>
            <section>
              <h2 className="font-bold text-lg text-stone-900">Listings & pricing</h2>
              <p className="mt-2">
                Product information is supplied by brand partners and reviewed for consistency with
                SkinLabs editorial standards. Prices include a transparent marketplace fee where
                applicable. We may correct obvious pricing errors and cancel affected orders with a
                full refund.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-lg text-stone-900">Availability</h2>
              <p className="mt-2">
                All goods are subject to stock. If an item becomes unavailable after you order, we
                will contact you with options (wait, substitute, or refund).
              </p>
            </section>
            <section>
              <h2 className="font-bold text-lg text-stone-900">Account & conduct</h2>
              <p className="mt-2">
                You must provide accurate checkout details. Fraudulent orders, abusive behaviour, or
                attempts to circumvent security may result in order cancellation and account
                restriction.
              </p>
            </section>
            <section>
              <h2 className="font-bold text-lg text-stone-900">Privacy</h2>
              <p className="mt-2">
                Personal data is processed under the SkinLabs{" "}
                <Link to="/privacy-policy" className="underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </p>
            </section>
            <p className="text-xs text-stone-500 border-t border-stone-200 pt-4">
              These marketplace terms sit alongside the general{" "}
              <Link to="/terms-of-service" className="underline underline-offset-2">
                SkinLabs Terms of Service
              </Link>
              . For conflicts on marketplace-specific fulfilment, this page and the shipping &
              returns policy take precedence.
            </p>
          </div>
        </article>
        <MobileBottomNav />
      </div>
    </>
  );
}
