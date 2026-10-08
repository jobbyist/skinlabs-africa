import { Link } from "react-router-dom";
import { ArrowLeft, Calendar, FileText } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { useSpotlightEdition, useSpotlightEditionArchive } from "@/hooks/use-spotlight-edition";
import { useSpotlightRanking } from "@/hooks/use-spotlight-ranking";
import { EDITORIAL_INDEPENDENCE_LINE, FUNDING_STATEMENT } from "@/lib/editorialIndependence";

/**
 * The editorial methodologies page (route kept at /spotlight/methodology so existing links, the sitemap and search keep
 * working). Every methodology below describes what the code and pipelines actually do today; if a pipeline changes, change
 * its section here in the same PR. The Spotlight version and edition always come from the live spotlight_editions row
 * (useSpotlightEdition), never from text typed into this page.
 */
const SECTIONS = [
  { id: "briefings", label: "Briefings" },
  { id: "reviews", label: "Reviews" },
  { id: "comparisons", label: "Comparisons" },
  { id: "seasonals", label: "Seasonals" },
  { id: "podcast", label: "Podcast" },
  { id: "ingredients", label: "Ingredients" },
  { id: "spotlight", label: "Spotlight" },
] as const;

const SpotlightMethodology = () => {
  const canonical = "https://skinlabs.co.za/spotlight/methodology";
  const { data: edition } = useSpotlightEdition();
  const archive = useSpotlightEditionArchive();
  const { ranked, radar } = useSpotlightRanking();

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Editorial Methodologies — How SkinLabs Briefings, Reviews, Comparisons, Seasonals, Podcast, Ingredients and Spotlight Are Made"
        description="How every SkinLabs content type is researched, scored, checked and updated: Briefings, Reviews, Shelf Showdown comparisons, Seasonals, the Skin Deep podcast, Ingredient profiles and Spotlight brand rankings."
        canonical={canonical}
      />
      <Header />
      <main className="pb-24 pt-24">
        <div className="container mx-auto max-w-3xl px-4">
          <Link to="/spotlight" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Spotlight
          </Link>

          <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Methodologies</p>
          <h1 className="font-heading text-3xl font-bold text-foreground md:text-4xl">How SkinLabs content is made</h1>
          <p className="mt-3 text-muted-foreground">
            One page for every editorial content type: where the information comes from, how it is scored or checked,
            how often it changes, and what each method cannot tell you. {EDITORIAL_INDEPENDENCE_LINE}
          </p>

          <nav aria-label="Methodologies" className="mt-6 flex flex-wrap gap-2">
            {SECTIONS.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="rounded-full border border-border px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {s.label}
              </a>
            ))}
          </nav>

          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:scroll-mt-28 prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground">
            <h2>Principles that apply everywhere</h2>
            <ul>
              <li><strong>Independence.</strong> {FUNDING_STATEMENT}</li>
              <li><strong>Nothing invented.</strong> We never fabricate reviews, ratings, prices, ingredient data or performance claims. Where we do not have evidence, a page says so or shows nothing.</li>
              <li><strong>AI assistance is disclosed.</strong> Several pipelines use AI to research, draft or structure content. Each section below says where, and every pipeline runs automated quality, duplication and compliance checks before anything is published.</li>
              <li><strong>Cosmetic, not clinical.</strong> Content is educational. We do not diagnose, and checks reject named-diagnosis claims. For anything persistent, see a doctor or dermatologist.</li>
              <li><strong>Corrections.</strong> If something is wrong, tell us through the <Link to="/corrections-removals">corrections and removals</Link> page. See also the <Link to="/editorial-policy">Editorial Policy</Link>.</li>
            </ul>

            <h2 id="briefings">Briefings</h2>
            <p>Briefings are short, South Africa-focused explainers on skincare news, research and seasonal skin concerns.</p>
            <ul>
              <li><strong>Sources.</strong> Each briefing starts from a real, public page chosen from a rotating list of South African and international skincare news and research channels. The source link is kept on the briefing. Some briefings are written by hand from an editorial blueprint; others are drafted with AI assistance from the source page.</li>
              <li><strong>Local context.</strong> Drafts are written for South African readers: climate, altitude, UV and local product availability come first, not an overseas default.</li>
              <li><strong>Checks before publishing.</strong> A formatting check (clear headings, short paragraphs, at least one list), a minimum length, a duplicate check (the source link and the title and wording are compared with the last 45 days of briefings, so one source cannot produce several near-identical briefings) and a scan that rejects named-diagnosis language. A draft that fails gets one guided rewrite and is then dropped.</li>
              <li><strong>Cadence.</strong> At most one new briefing a day. Every briefing ends with an editorial disclaimer. Photographs are credited to their source.</li>
              <li><strong>Limits.</strong> A briefing summarises its source for general education. It is not medical advice and not a product recommendation.</li>
            </ul>

            <h2 id="reviews">Reviews</h2>
            <p>A review is SkinLabs&apos; scored assessment of one product, written for South African conditions.</p>
            <ul>
              <li><strong>The score.</strong> Four scores out of 10: <strong>Efficacy</strong> (does the formulation do what it claims, judged on its disclosed actives and the available evidence), <strong>Value</strong> (price against formulation quality and local alternatives), <strong>Texture</strong> (how it feels and layers in use) and <strong>SA climate fit</strong> (heat, humidity, altitude and UV). The overall score is their average.</li>
              <li><strong>Where reviews come from.</strong> A hand-written catalogue, plus reviews researched from brand and retailer product pages and drafted with AI assistance, grounded in what the page actually says. A review never states a fact its source does not support.</li>
              <li><strong>Sponsored products.</strong> Reviews of products sold through OpenHaus, SkinLabs&apos; own marketplace, and any paid placement carry a <em>Sponsored</em> label. Sponsorship does not change how a review is scored.</li>
              <li><strong>Prices.</strong> A price appears only if it was read from the retailer&apos;s own product page, the product was matched with confidence and it was checked in the last 14 days. Otherwise we show a dated &ldquo;at review time&rdquo; snapshot or nothing.</li>
              <li><strong>Ratings.</strong> The editorial score (out of 10) and member ratings (out of 5) are never blended. Member ratings appear only when real members have rated the product.</li>
              <li><strong>Ingredients.</strong> Key ingredients link to our <a href="#ingredients">ingredient profiles</a>. If a profile does not exist yet, the review says it is coming rather than guessing.</li>
              <li><strong>Limits.</strong> We assess formulations and published information. A review is not a clinical trial and cannot predict how your skin will react.</li>
            </ul>

            <h2 id="comparisons">Comparisons (Shelf Showdown)</h2>
            <p>A Shelf Showdown puts two products from the same category side by side.</p>
            <ul>
              <li><strong>Pairing.</strong> Both products have a published SkinLabs review. Each pairing is recorded, so the same two products are never compared twice.</li>
              <li><strong>Data.</strong> Scores, prices, ingredients and verdicts are taken from those reviews, not re-scored for the comparison.</li>
              <li><strong>Verdict style.</strong> A comparison says which product is better <em>for what</em> (for example, drier skin, a tighter budget or humid coast). It never crowns a universal winner.</li>
              <li><strong>Cadence.</strong> New comparisons are generated weekly, with AI assistance and the same checks as reviews, alongside hand-written ones.</li>
              <li><strong>Limits.</strong> A comparison is only as broad as the two reviews behind it.</li>
            </ul>

            <h2 id="seasonals">Seasonals</h2>
            <p>Seasonal hubs gather what matters for skin in each South African season.</p>
            <ul>
              <li><strong>Season.</strong> The current season is worked out from today&apos;s date using southern-hemisphere months (SAST), not set by hand.</li>
              <li><strong>Product edits.</strong> Every product in a seasonal edit is one SkinLabs has reviewed, and links to its review.</li>
              <li><strong>Guidance.</strong> General, cosmetic advice (for example more sun protection in summer or a richer moisturiser through a dry Highveld winter), never a diagnosis or a treatment plan.</li>
              <li><strong>Limits.</strong> Seasonal advice is general and cannot reflect your skin, your city or the weather this week. For that, see Skin Weather in your dashboard.</li>
            </ul>

            <h2 id="podcast">Podcast (The Skin Deep)</h2>
            <p>The Skin Deep is SkinLabs&apos; audio series on skincare topics.</p>
            <ul>
              <li><strong>Format.</strong> Episodes are discussion-format audio that draws on SkinLabs&apos; own published material. They are not interviews with experts, practitioners or brands, and we do not present them as such.</li>
              <li><strong>Show notes.</strong> Summaries, chapter timestamps and transcript excerpts are written from the final audio, which we transcribe and check. If an episode does not name a product, no product is listed for it.</li>
              <li><strong>Independence.</strong> The podcast takes no paid mentions. Anything sponsored would be labelled in the episode and its notes.</li>
              <li><strong>Cadence.</strong> Season 1 is complete. We publish the Season 2 date on the <Link to="/podcast">podcast page</Link> once it is set.</li>
              <li><strong>Limits.</strong> Spoken summaries are simplified. The written reviews and ingredient profiles are the reference.</li>
            </ul>

            <h2 id="ingredients">Ingredients</h2>
            <p>Ingredient profiles explain what an ingredient is, what it does and what to watch for.</p>
            <ul>
              <li><strong>Research.</strong> Each profile is built from published sources such as PubMed-indexed studies and DermNet NZ, and lists its citations. Drafting uses AI assistance; the sources decide the content, not the model.</li>
              <li><strong>What a profile covers.</strong> Function, typical concentration range, evidence level, irritancy and pregnancy notes, usage and formulation notes, related ingredients and known interactions.</li>
              <li><strong>Verification status.</strong> New profiles are published as <em>partially verified</em>. Only a human reviewer can mark a profile <em>verified</em>, and a profile can be deprecated.</li>
              <li><strong>Interactions.</strong> Pair notes and routine conflict checks come from sourced interaction records. A pair we have no record for produces nothing, never a guess.</li>
              <li><strong>Growth and upkeep.</strong> The catalogue grows every week, including ingredients our reviews mention that do not have a profile yet. Older profiles are re-checked oldest first. Generic &ldquo;complex&rdquo; blends and ingredients with no usable literature are skipped rather than filled with invented content.</li>
              <li><strong>Limits.</strong> Concentrations and evidence describe ingredients in general, not a specific product. Allergy notes are cautions, not a clearance.</li>
            </ul>

            <h2 id="spotlight">Spotlight</h2>
            <p className="text-sm">
              {edition.methodologyVersion} · {edition.editionLabel} edition · {ranked.length} ranked brands, {radar.length} on the radar
            </p>
            <h3>Purpose</h3>
            <p>
              Spotlight gives readers a review-led starting point for discovering skincare brands sold in South Africa: not a
              popularity contest and not a paid directory. Every score is computed from SkinLabs&apos; own published product
              reviews, and no brand can buy a higher position.
            </p>
            <h3>What it measures</h3>
            <p>
              A brand&apos;s Spotlight score is the average of the overall review score (efficacy, value, texture and SA climate
              fit, each out of 10) across <strong>every published SkinLabs review of that brand</strong>, whether the review
              is hand-written or researched by the review pipeline. Spelling variants of a brand name (for example
              &ldquo;SKOON.&rdquo; and &ldquo;Skoon&rdquo;) count as the same brand. Scores are recalculated whenever a review is
              published or updated and are never typed in by hand.
            </p>
            <h3>Eligibility and tiers</h3>
            <ul>
              <li>The brand sells skincare to South African consumers and has at least one published SkinLabs review.</li>
              <li>Brands with <strong>two or more</strong> published reviews are <strong>Ranked</strong>, ordered by score.</li>
              <li>Brands with exactly <strong>one</strong> published review appear under <strong>New on the Radar</strong> until we review more of their range.</li>
              <li>Brands with a hand-written editorial profile show it. A brand without one gets a profile compiled only from facts in its reviews (counts, categories, scores and the verdict of its top-scoring review), with no website, history or positioning claims added.</li>
              <li>Some ranked brands have products sold through OpenHaus. Those reviews are labelled Sponsored on the review itself and noted on the brand profile. They are scored exactly like any other review.</li>
            </ul>
            <h3>Weekly Top 3 rotation</h3>
            <ul>
              <li>Take the highest-scoring Ranked brands, up to a pool of nine, and split them into cohorts of three in score order.</li>
              <li>The cohort on show is chosen by the rotation week number, so it advances one cohort each week and cycles back to the top.</li>
              <li>It flips at <strong>00:00 SAST every Friday</strong>, never mid-week and never on demand, and is not influenced by traffic, votes or payment.</li>
              <li>With fewer than nine Ranked brands the pool shrinks; the overall top three show until there are enough to rotate.</li>
            </ul>
            <h3>Movement, cadence and counts</h3>
            <p>
              Brands are labelled &ldquo;New&rdquo; until a genuine earlier snapshot exists to compare against; movement reflects real
              score changes, never a made-up arrow. The full ranking refreshes as reviews are published, with a complete
              reassessment at least monthly. Every count on the Spotlight pages comes from the same live data as the ranking.
              The edition label and version are recorded in the <Link to="/spotlight/archive">archive</Link> each time the
              published-review count passes a new milestone of 25.
            </p>
            <h3>Access to brand profiles</h3>
            <p>
              The ranking, the Top 3 and every brand card are visible to everyone. Opening a full brand profile is free for
              the first three brands each calendar month for signed-out visitors and Glow Explorer members; Glow Lite, Glow
              Insider and Glow VIP members have unlimited access. The limit has no effect on any score or rank.
            </p>
            <h3>What it does not measure</h3>
            <p>
              Spotlight does not score ingredient-transparency disclosure, packaging, customer service or audited
              manufacturing standards, because we do not have independently verifiable evidence for them. A score reflects
              only the products SkinLabs has reviewed, which may be a small part of a brand&apos;s range.
            </p>
            <h3>Version history</h3>
            <ul>
              <li><strong>v1.0 (August 2026):</strong> four-axis review scoring, Ranked and New on the Radar tiers, monthly refresh.</li>
              <li><strong>v1.1 (September 2026):</strong> weekly Top 3 rotation, paginated ranking and the three-profiles-a-month free allowance.</li>
              <li><strong>v1.2 onwards:</strong> edition and version numbers advance automatically each time the published-review count passes another 25, with no change to the scoring method.</li>
              <li><strong>October 2026 update:</strong> the ranking now includes every published review (hand-written and pipeline-researched), merges spelling variants of a brand name, and lists every brand with two or more published reviews as Ranked.</li>
            </ul>
          </div>

          <section className="mt-14 border-t border-border pt-10" aria-labelledby="archive-heading">
            <h2 id="archive-heading" className="font-heading text-2xl font-bold text-foreground">Spotlight editions on record</h2>
            <p className="mt-1 text-sm text-muted-foreground">Read from the live archive, so it always matches the version shown on Spotlight.</p>
            <ul className="mt-5 space-y-3">
              {(archive.data ?? []).map((e) => (
                <li key={e.id} className="flex items-start gap-3 rounded-2xl border border-border bg-card p-4">
                  <FileText className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground" aria-hidden="true" />
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">
                      {e.methodologyVersion.replace("Spotlight Methodology ", "")} · {e.editionLabel}
                      {e.isCurrent && <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-semibold uppercase text-primary-foreground">Current</span>}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" aria-hidden="true" /> {e.reviewCountAtSnapshot}+ published reviews at snapshot
                    </p>
                  </div>
                </li>
              ))}
              {archive.isLoading && <li className="text-sm text-muted-foreground">Loading editions…</li>}
              {!archive.isLoading && (archive.data ?? []).length === 0 && (
                <li className="text-sm text-muted-foreground">
                  Current edition: {edition.methodologyVersion.replace("Spotlight Methodology ", "")} · {edition.editionLabel}.
                </li>
              )}
            </ul>
            <div className="mt-8 text-center">
              <Link to="/spotlight" className="inline-flex items-center gap-2 text-sm font-medium text-primary transition-colors hover:text-primary/80">
                <ArrowLeft className="h-4 w-4" aria-hidden="true" /> View current Spotlight rankings
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SpotlightMethodology;
