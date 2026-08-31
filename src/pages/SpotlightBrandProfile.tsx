import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import BrandLogo from "@/components/BrandLogo";
import BrandRequestModal from "@/components/BrandRequestModal";
import ArticleComments from "@/components/ArticleComments";
import AffiliateAdSlot from "@/components/AffiliateAdSlot";
import { getSpotlightBrand, SPOTLIGHT_EDITION_MONTH, SPOTLIGHT_METHODOLOGY_VERSION } from "@/data/spotlight";
import { overallScore } from "@/data/reviews";
import { useMembership } from "@/hooks/use-membership";
import GatedOverlay from "@/components/GatedOverlay";
import { spotlightComments } from "@/data/articleComments";

const EDITORIAL_DISCLAIMER =
  "Spotlight by SkinLabs is an independent editorial feature. Rankings and profiles are determined using the SkinLabs editorial methodology and available product information. Inclusion does not constitute paid endorsement. Commercial relationships, affiliate links, gifted products or other benefits are disclosed where applicable.";

const SpotlightBrandProfile = () => {
  const { brandSlug } = useParams();
  const [claimOpen, setClaimOpen] = useState(false);
  const { isMember, loading: membershipLoading } = useMembership();
  const entry = getSpotlightBrand(brandSlug ?? "");

  if (!entry) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Brand not found</h1>
          <p className="mt-2 text-muted-foreground">This brand may not be part of the current Spotlight edition.</p>
          <Button asChild className="mt-6">
            <Link to="/spotlight">Back to Spotlight</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const { editorial } = entry;
  const canonical = `https://skinlabs.co.za/spotlight/${entry.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: `${entry.brand} — Spotlight by SkinLabs`,
        description: editorial.whyTheyMadeTheList,
        author: { "@type": "Organization", name: "SkinLabs", url: "https://skinlabs.co.za" },
        publisher: {
          "@type": "Organization",
          name: "SkinLabs",
          logo: { "@type": "ImageObject", url: "https://skinlabs.co.za/pwa-512.png" },
        },
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Spotlight", item: "https://skinlabs.co.za/spotlight" },
          { "@type": "ListItem", position: 2, name: entry.brand, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={`${entry.brand} — Spotlight by SkinLabs`}
        description={editorial.whyTheyMadeTheList.slice(0, 155)}
        canonical={canonical}
        ogType="article"
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <GatedOverlay
            locked={!membershipLoading && !isMember}
            title="Spotlight profiles are for members"
            message="Glow Insider and Glow VIP members can open full brand profiles. Browse the ranking free on the Spotlight page."
            ctaLabel="View membership plans"
          >
          <Link to="/spotlight" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All of Spotlight
          </Link>

          <div className="flex items-start gap-4">
            <BrandLogo brand={entry.brand} logoUrl={editorial.logoUrl} size="lg" />
            <div>
              {entry.rank !== null ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  #{entry.rank} this month
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                  New on the Radar
                </span>
              )}
              <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">{entry.brand}</h1>
              <p className="mt-1 text-muted-foreground">{editorial.positioningStatement}</p>
            </div>
          </div>

          {editorial.brandStory && (
            <p className="mt-6 text-sm leading-relaxed text-muted-foreground">{editorial.brandStory}</p>
          )}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="font-heading text-2xl font-bold text-foreground">{entry.avgOverallScore}</p>
              <p className="text-xs text-muted-foreground">avg review score /10</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="font-heading text-2xl font-bold text-foreground">{entry.productCount}</p>
              <p className="text-xs text-muted-foreground">reviewed products</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <p className="font-heading text-sm font-bold text-foreground">{entry.movement}</p>
              <p className="text-xs text-muted-foreground">this edition</p>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">Known for</h2>
            <p className="text-sm text-muted-foreground">{editorial.knownFor}</p>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">The SkinLabs Take</h2>
            <p className="text-sm leading-relaxed text-foreground">{editorial.skinlabsTake}</p>
          </div>

          <div className="mt-6">
            <h2 className="mb-2 font-heading text-lg font-bold text-foreground">Why they made the list</h2>
            <p className="text-sm leading-relaxed text-foreground">{editorial.whyTheyMadeTheList}</p>
          </div>

          {editorial.evidenceLimitation && (
            <p className="mt-4 text-xs italic text-muted-foreground">{editorial.evidenceLimitation}</p>
          )}

          <div className="mt-8">
            <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Featured product</h2>
            <Link
              to={`/reviews/${entry.featuredProduct.id}`}
              className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4 hover:border-primary"
            >
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{entry.featuredProduct.category}</p>
                <p className="font-heading font-bold text-foreground">{entry.featuredProduct.product_name}</p>
              </div>
              <span className="flex shrink-0 flex-col items-center rounded-xl bg-primary px-3 py-1.5 text-primary-foreground">
                <span className="font-heading text-base font-extrabold leading-none">{overallScore(entry.featuredProduct)}</span>
                <span className="text-[9px] uppercase">/10</span>
              </span>
            </Link>
          </div>

          {entry.products.length > 1 && (
            <div className="mt-6">
              <h2 className="mb-3 font-heading text-lg font-bold text-foreground">All reviewed products</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {entry.products.map((product) => (
                  <Link
                    key={product.id}
                    to={`/reviews/${product.id}`}
                    className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-2.5 text-sm hover:border-primary"
                  >
                    <span className="text-foreground">{product.product_name}</span>
                    <span className="text-xs font-semibold text-muted-foreground">{overallScore(product)}/10</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-wrap gap-3 text-sm">
            {editorial.officialWebsite && (
              <a
                href={editorial.officialWebsite}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-foreground hover:border-primary"
              >
                Official website <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
            <Button variant="outline" onClick={() => setClaimOpen(true)}>
              Claim this brand
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            Assessed for the {SPOTLIGHT_EDITION_MONTH} edition under{" "}
            <Link to="/spotlight/methodology" className="underline hover:text-foreground">
              {SPOTLIGHT_METHODOLOGY_VERSION}
            </Link>
            .
          </p>

          <div className="mt-6 flex gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p><span className="font-semibold text-foreground">Editorial disclaimer:</span> {EDITORIAL_DISCLAIMER}</p>
          </div>

          <ArticleComments comments={spotlightComments[entry.slug] ?? []} />
          </GatedOverlay>

          {/* Affiliate/partner promotion — advertising, not editorial content. Kept outside
              GatedOverlay so it reaches every visitor, gated or not, not just members. */}
          <div className="mt-8">
            <AffiliateAdSlot partner="shopify" placement="brand-spotlight" />
          </div>
        </div>
      </main>
      <Footer />

      <BrandRequestModal open={claimOpen} onOpenChange={setClaimOpen} mode="claim" brandName={entry.brand} brandSlug={entry.slug} />
    </div>
  );
};

export default SpotlightBrandProfile;
