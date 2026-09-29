import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import AdSlot from "@/components/AdSlot";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { useSpotlightEditionArchive } from "@/hooks/use-spotlight-edition";

const SpotlightArchive = () => {
  const canonical = "https://skinlabs.co.za/spotlight/archive";
  const { data: editions, isLoading } = useSpotlightEditionArchive();
  const current = editions?.find((e) => e.isCurrent);
  const past = (editions ?? []).filter((e) => !e.isCurrent);

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Spotlight Archive — Past SkinLabs Brand Rankings"
        description="The archive of past Spotlight by SkinLabs editions, tracking how South African skincare brand rankings change over time."
        canonical={canonical}
      />
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to="/spotlight" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Spotlight
          </Link>

          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Spotlight</p>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">Archive</h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Spotlight launched under Methodology v1.0 in August 2026. Each edition below is recorded automatically
            once our published review count crosses a new milestone, preserving the methodology version and review
            count in force at the time, so you can see how South African skincare brands' standing genuinely
            changes over time.
          </p>

          <AdSlot placement="spotlight-archive-top" compact />

          {current && (
            <div className="mt-8 rounded-3xl border border-border bg-card p-6">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-heading text-lg font-bold text-foreground">{current.editionLabel} — current edition</h2>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Live</span>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                {current.reviewCountAtSnapshot}+ published reviews at last snapshot · {current.methodologyVersion}
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link to="/spotlight">View the full ranking</Link>
              </Button>
            </div>
          )}

          {!isLoading && past.length > 0 && (
            <div className="mt-6 space-y-4">
              {past.map((edition) => (
                <div key={edition.id} className="rounded-2xl border border-border bg-card/60 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-heading text-base font-semibold text-foreground">{edition.editionLabel}</h3>
                    <span className="text-xs text-muted-foreground">
                      {new Date(edition.createdAt).toLocaleDateString("en-ZA", { year: "numeric", month: "long" })}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {edition.reviewCountAtSnapshot}+ published reviews at snapshot · {edition.methodologyVersion}
                  </p>
                </div>
              ))}
            </div>
          )}

          <p className="mt-10 text-sm text-muted-foreground">
            Past editions appear here automatically as they are published. Each entry preserves the review count and
            methodology version in force at the time, so year-on-year movement stays transparent.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SpotlightArchive;
