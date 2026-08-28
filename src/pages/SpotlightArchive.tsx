import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { SPOTLIGHT_EDITION_MONTH, SPOTLIGHT_METHODOLOGY_VERSION, spotlightRankedBrands } from "@/data/spotlight";

const SpotlightArchive = () => {
  const canonical = "https://skinlabs.co.za/spotlight/archive";

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
            This is Spotlight's first edition, so there's nothing to archive yet. We'll add each past edition here
            once the second edition publishes — rank, score and methodology version preserved, so you can see how
            South African skincare brands' standing has genuinely changed over time.
          </p>

          <div className="mt-8 rounded-3xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-heading text-lg font-bold text-foreground">{SPOTLIGHT_EDITION_MONTH} — current edition</h2>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">Live</span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {spotlightRankedBrands.length} ranked brands · {SPOTLIGHT_METHODOLOGY_VERSION}
            </p>
            <Button asChild className="mt-4">
              <Link to="/spotlight">View the current ranking</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SpotlightArchive;
