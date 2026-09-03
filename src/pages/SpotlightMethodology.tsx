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

            <h2>What Methodology v1.1 actually measures</h2>
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
              This scoring model is unchanged from v1.0; what v1.1 adds is described below.
            </p>

            <h2>Weekly Top 3 rotation (new in v1.1)</h2>
            <p>
              The homepage and Spotlight page feature a "Top 3 brands this week" module. It is <strong>not</strong> a
              separate, hand-picked list — it is drawn algorithmically from the same Ranked-tier scores described
              above, so it can never surface a brand that isn't already genuinely top-scoring:
            </p>
            <ul>
              <li>Take the highest-scoring Ranked brands, up to a pool of 9, and split them into cohorts of 3 in score order (so brands ranked 1–3, 4–6 and 7–9 each form one cohort).</li>
              <li>The active cohort is chosen by the current rotation week number, so it advances by exactly one cohort each week and cycles back to the top cohort once every cohort has had a turn.</li>
              <li>The rotation flips at <strong>00:00 SAST every Friday</strong> — never mid-week, never on demand, and never influenced by traffic, votes or payment.</li>
              <li>If fewer than 9 brands are Ranked, the pool and cohort count shrink accordingly; the top 3 overall are shown until there are enough Ranked brands to rotate meaningfully.</li>
            </ul>
            <p>
              This means every brand that appears in "Top 3 this week" earned that appearance on real review scores —
              rotation only changes <em>which</em> genuinely top brands are surfaced, and <em>when</em>, never the bar
              for getting there. The full ranking below the Top 3 module is unaffected by rotation and continues to
              reflect every Ranked and New on the Radar brand at all times.
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

            <h2>Coverage counts</h2>
            <p>
              Every brand, Ranked and New on the Radar count referenced on Spotlight — the disclaimer on the
              Spotlight page, this Methodology page, and the archive — is computed live from the same underlying
              data as the ranking itself. Nothing is a hand-typed number: add a brand, publish a review that moves it
              between tiers, and every count updates automatically, everywhere, on the next page load. Only the
              edition label and this Methodology's version number are updated by hand, since only a person can judge
              when a new calendar edition begins or when a change is substantial enough to warrant a new methodology
              version.
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
              Every brand added since the first edition is labelled "New" until we have a genuine prior snapshot to
              compare it against. Movement will reflect real score changes as SkinLabs publishes new or updated
              reviews, never a fabricated up/down — the full ranking's movement is assessed monthly; the weekly Top 3
              module rotates on the schedule above and doesn't carry its own separate movement indicator.
            </p>

            <h2>Update cadence</h2>
            <p>
              The full ranking and all brand profiles refresh as SkinLabs publishes new product reviews, with a
              complete edition reassessment at least monthly. The Top 3 module rotates weekly as described above.
              See the <Link to="/spotlight/archive">archive</Link> for past editions once more than one exists.
            </p>

            <h2>Commercial independence</h2>
            <p>
              Inclusion in Spotlight is never paid, and no brand can guarantee or purchase a ranking position or a
              Top 3 rotation slot — the rotation is a deterministic function of real review scores and the calendar,
              not a decision anyone at SkinLabs makes edition to edition. If SkinLabs ever has a commercial
              relationship with a featured brand — a gifted product, an affiliate link, a sponsorship — it will be
              disclosed clearly on that brand's profile and in the product review it's based on.
            </p>

            <h2>Access to brand profiles</h2>
            <p>
              The full ranking, the Top 3 module and every brand's summary card are visible to all visitors, signed
              in or not. Opening a full brand profile page is free for the first 3 brands each calendar month for
              signed-out visitors and Glow Explorer (free) members; Glow Insider and Glow VIP members have unlimited
              access. This limit exists to support the reporting behind Spotlight — it doesn't affect a brand's score,
              rank or Top 3 eligibility in any way.
            </p>

            <h2>Limitations</h2>
            <p>
              A brand's Spotlight score reflects only the products SkinLabs has actually reviewed, which may be a
              small fraction of its full range. A high score means the reviewed products performed well — it isn't
              a guarantee every product in the brand's catalogue will.
            </p>

            <h2>Changelog</h2>
            <ul>
              <li>
                <strong>v1.1 — September 2026:</strong> Expanded brand coverage from 21 to 50 South African skincare
                brands with published product reviews. Introduced the weekly Top 3 rotation described above (the
                monthly "Top 3" snapshot from v1.0 is retired in favour of it). Added SEO-friendly, page-numbered
                pagination to the full ranking. Replaced the previous full members-only gate on brand profiles with a
                3-profile-per-month free allowance for signed-out visitors and Glow Explorer members.
              </li>
              <li>
                <strong>v1.0 — August 2026:</strong> Initial release. Four-axis product-review scoring, Ranked and New
                on the Radar tiers, monthly full-edition refresh.
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SpotlightMethodology;
