import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShieldCheck, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import SpotlightRankingCard from "@/components/SpotlightRankingCard";
import BrandRequestModal from "@/components/BrandRequestModal";
import { spotlightRankedBrands, spotlightRisingBrands, spotlightTopThree, SPOTLIGHT_EDITION_MONTH, SPOTLIGHT_METHODOLOGY_VERSION } from "@/data/spotlight";

const EDITORIAL_DISCLAIMER =
  "Spotlight by SkinLabs is an independent editorial feature. Rankings and profiles are determined using the SkinLabs editorial methodology and available product information. Inclusion does not constitute paid endorsement. Commercial relationships, affiliate links, gifted products or other benefits are disclosed where applicable. Rankings may change as products, evidence, availability and editorial assessments change.";

const Spotlight = () => {
  const [claimOpen, setClaimOpen] = useState(false);
  const [submitOpen, setSubmitOpen] = useState(false);

  const canonical = "https://skinlabs.co.za/spotlight";
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Spotlight by SkinLabs",
        description: "A monthly, review-led ranking of South African skincare brands.",
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Spotlight", item: canonical }],
      },
      {
        "@type": "ItemList",
        name: `Spotlight ${SPOTLIGHT_EDITION_MONTH}`,
        itemListElement: spotlightRankedBrands.map((entry) => ({
          "@type": "ListItem",
          position: entry.rank ?? undefined,
          name: entry.brand,
          url: `https://skinlabs.co.za/spotlight/${entry.slug}`,
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Spotlight by SkinLabs — South African Skincare Brands, Ranked"
        description="A monthly, review-led ranking of South African skincare brands. Not a popularity list, not a paid directory — every score comes from real SkinLabs product reviews."
        canonical={canonical}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-24 pb-24">
        <section className="container mx-auto px-4 text-center">
          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Spotlight</p>
          <h1 className="mx-auto max-w-2xl font-heading text-4xl font-bold leading-tight text-foreground md:text-5xl">
            South African skincare brands worth knowing
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Ranked by real, published SkinLabs product review scores — never by popularity, never for payment.
            Refreshed monthly as we review more products.
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-muted-foreground">
            <span className="rounded-full bg-accent px-3 py-1 font-semibold text-foreground">{SPOTLIGHT_EDITION_MONTH} edition</span>
            <Link to="/spotlight/methodology" className="underline hover:text-foreground">
              {SPOTLIGHT_METHODOLOGY_VERSION}
            </Link>
            <Link to="/spotlight/archive" className="underline hover:text-foreground">
              Archive
            </Link>
          </div>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Button onClick={() => setSubmitOpen(true)} className="gap-2">
              <Sparkles className="h-4 w-4" /> Submit your brand
            </Button>
            <Button variant="outline" onClick={() => setClaimOpen(true)}>
              Claim your brand
            </Button>
          </div>
        </section>

        {/* Top 3 */}
        <section className="container mx-auto mt-14 px-4">
          <h2 className="mb-6 text-center font-heading text-2xl font-bold text-foreground">Top 3 this month</h2>
          <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-3">
            {spotlightTopThree.map((entry) => (
              <SpotlightRankingCard key={entry.slug} entry={entry} />
            ))}
          </div>
        </section>

        {/* Full ranking */}
        <section className="container mx-auto mt-16 px-4">
          <h2 className="mb-6 font-heading text-2xl font-bold text-foreground">The full ranking</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {spotlightRankedBrands.map((entry) => (
              <SpotlightRankingCard key={entry.slug} entry={entry} compact />
            ))}
          </div>
        </section>

        {/* New on the Radar */}
        {spotlightRisingBrands.length > 0 && (
          <section className="container mx-auto mt-16 px-4">
            <h2 className="mb-2 font-heading text-2xl font-bold text-foreground">New on the Radar</h2>
            <p className="mb-6 max-w-2xl text-sm text-muted-foreground">
              Brands with real evidence but not yet enough reviewed products for our main ranking. We'll move them
              up as SkinLabs reviews more of their range.
            </p>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {spotlightRisingBrands.map((entry) => (
                <SpotlightRankingCard key={entry.slug} entry={entry} compact />
              ))}
            </div>
          </section>
        )}

        {/* Methodology summary */}
        <section className="container mx-auto mt-16 px-4">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
            <h2 className="font-heading text-lg font-bold text-foreground">How the ranking works</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Every brand's score is the average of its SkinLabs product review scores (efficacy, value, texture and
              SA climate fit) across every product we've reviewed for that brand — never a hand-typed number.
              Brands with two or more reviewed products are Ranked; brands with one are New on the Radar. There is
              no paid placement, no vote count and no way to buy a higher position.
            </p>
            <Link to="/spotlight/methodology" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              Read the full methodology <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>

        {/* Disclaimer */}
        <section className="container mx-auto mt-10 px-4">
          <div className="mx-auto flex max-w-3xl gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p><span className="font-semibold text-foreground">Editorial disclaimer:</span> {EDITORIAL_DISCLAIMER}</p>
          </div>
        </section>
      </main>
      <Footer />

      <BrandRequestModal open={claimOpen} onOpenChange={setClaimOpen} mode="claim" />
      <BrandRequestModal open={submitOpen} onOpenChange={setSubmitOpen} mode="submit" />
    </div>
  );
};

export default Spotlight;
