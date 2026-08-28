import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { SPOTLIGHT_EDITION_MONTH, SPOTLIGHT_METHODOLOGY_VERSION } from "@/data/spotlight";

const SpotlightMethodology = () => {
  const canonical = "https://skinlabs.co.za/spotlight/methodology";

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Spotlight Methodology — How SkinLabs Ranks SA Skincare Brands"
        description="How Spotlight by SkinLabs ranks South African skincare brands: eligibility, scoring, evidence standards, update cadence and current limitations."
        canonical={canonical}
      />
      <Header />
      <main className="pt-24 pb-24">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to="/spotlight" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Spotlight
          </Link>

          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Spotlight</p>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">How the ranking works</h1>
          <p className="mt-2 text-sm text-muted-foreground">{SPOTLIGHT_METHODOLOGY_VERSION} · Effective {SPOTLIGHT_EDITION_MONTH}</p>

          <div className="prose prose-neutral mt-8 max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
            <h2>Purpose</h2>
            <p>
              Spotlight exists to give readers a credible, review-led starting point for discovering South African
              skincare brands — not a popularity contest, and not a paid directory. Every score is computed from
              SkinLabs' own published product reviews, and no brand can buy a higher position.
            </p>

            <h2>What Methodology v1.0 actually measures</h2>
            <p>
              A brand's Spotlight score is the average of its <strong>SkinLabs product review score</strong> across
              every product from that brand SkinLabs has reviewed. Each product review scores four things out of 10:
            </p>
            <ul>
              <li><strong>Efficacy</strong> — how well the formulation does what it claims, based on disclosed actives and available evidence.</li>
              <li><strong>Value</strong> — price relative to formulation quality and local market alternatives.</li>
              <li><strong>Texture</strong> — real-world usability: how the product actually feels and layers.</li>
              <li><strong>SA climate fit</strong> — how it performs in South African heat, humidity, altitude and UV conditions.</li>
            </ul>
            <p>
              A brand's four-axis average across all its reviewed products becomes its Spotlight score. This is
              recalculated automatically every time SkinLabs publishes or updates a review — it is never hand-typed.
            </p>

            <h2>What this version doesn't measure — yet</h2>
            <p>
              A more complete brand-ranking framework could also weigh things like ingredient-transparency
              disclosure, packaging innovation, customer-service quality or independently audited manufacturing
              standards. We don't have reliable, independently verifiable evidence for those criteria yet, and
              publishing invented scores for them would break the "review-led" promise this feature is built on.
              Methodology v1.0 measures only what SkinLabs has genuinely reviewed. Future versions may expand this
              scope once we have real evidence to back it — any change will get a new version number and be
              documented here.
            </p>

            <h2>Eligibility</h2>
            <ul>
              <li>The brand sells skincare products to South African consumers.</li>
              <li>At least one product from the brand has a published SkinLabs review.</li>
              <li>Brands with <strong>2 or more</strong> reviewed products appear in the main Ranked tier.</li>
              <li>Brands with exactly <strong>1</strong> reviewed product appear under New on the Radar until we review more of their range.</li>
            </ul>

            <h2>Movement</h2>
            <p>
              This is Spotlight's first edition, so every brand is labelled "New" — there's no prior snapshot to
              compare against yet. From the second edition onward, movement will reflect genuine score changes as
              SkinLabs publishes new or updated reviews, never a fabricated up/down.
            </p>

            <h2>Update cadence</h2>
            <p>
              Spotlight is intended to refresh as SkinLabs publishes new product reviews, with a full edition
              reassessment at least monthly. See the <Link to="/spotlight/archive">archive</Link> for past editions
              once more than one exists.
            </p>

            <h2>Commercial independence</h2>
            <p>
              Inclusion in Spotlight is never paid, and no brand can guarantee or purchase a ranking position. If
              SkinLabs ever has a commercial relationship with a featured brand — a gifted product, an affiliate
              link, a sponsorship — it will be disclosed clearly on that brand's profile and in the product review
              it's based on.
            </p>

            <h2>Limitations</h2>
            <p>
              A brand's Spotlight score reflects only the products SkinLabs has actually reviewed, which may be a
              small fraction of its full range. A high score means the reviewed products performed well — it isn't
              a guarantee every product in the brand's catalogue will.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SpotlightMethodology;
