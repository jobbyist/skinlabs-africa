import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight, Award } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReviewsGrid from "@/components/ReviewsGrid";
import SpotlightRankingCard from "@/components/SpotlightRankingCard";
import { comparisonArticles } from "@/data/comparisons";
import { spotlightTopThree } from "@/data/spotlight";

const Reviews = () => (
  <>
    <Helmet>
      <title>SA Skincare Product Reviews — Independent Scores | SkinLabs</title>
      <meta
        name="description"
        content="Independent reviews of South African skincare brands, scored on efficacy, value, texture and performance in local climate conditions. Rand pricing and where to buy."
      />
      <link rel="canonical" href="https://skinlabs.co.za/reviews" />
      <meta property="og:title" content="SA Skincare Product Reviews — Independent Scores | SkinLabs" />
      <meta property="og:description" content="Locally focused skincare reviews with rand pricing and climate performance scores." />
      <meta property="og:url" content="https://skinlabs.co.za/reviews" />
      <meta property="og:type" content="website" />
      <meta name="twitter:card" content="summary_large_image" />
    </Helmet>

    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20">
        <h1 className="sr-only">SA Skincare Product Reviews and Comparisons</h1>

        {/* Shelf Showdown: head-to-head comparison articles */}
        <section id="shelf-showdown" className="border-b border-border bg-background py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 max-w-2xl">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Shelf Showdown</p>
              <h2 className="mb-3 font-heading text-2xl font-bold text-foreground md:text-3xl">
                Two products, one shelf, no universal winner
              </h2>
              <p className="text-muted-foreground">
                Head-to-head comparisons on the actives, the evidence and the Rand value — so you know which one
                actually makes sense for your skin, not just which one has the bigger marketing budget.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              {comparisonArticles.map((article) => (
                <Link
                  key={article.slug}
                  to={`/reviews/versus/${article.slug}`}
                  className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-primary"
                >
                  <img
                    src={article.thumbnail.url}
                    alt={article.thumbnail.alt}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                  <div className="flex flex-1 flex-col p-6">
                    <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                      {article.saContext}
                    </span>
                    <h3 className="font-heading text-lg font-bold leading-snug text-foreground">{article.title}</h3>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{article.dek}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary">
                      Read the showdown <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Spotlight by SkinLabs teaser */}
        <section id="spotlight-teaser" className="border-b border-border bg-secondary/30 py-16">
          <div className="container mx-auto px-4">
            <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div className="max-w-2xl">
                <p className="mb-2 flex items-center gap-1.5 text-sm font-medium uppercase tracking-wider text-primary">
                  <Award className="h-4 w-4" /> Spotlight
                </p>
                <h2 className="mb-3 font-heading text-2xl font-bold text-foreground md:text-3xl">
                  South African skincare brands worth knowing
                </h2>
                <p className="text-muted-foreground">
                  A monthly, review-led ranking — computed from these same review scores, never popularity or payment.
                </p>
              </div>
              <Link to="/spotlight" className="inline-flex items-center gap-2 font-medium text-primary hover:underline">
                See the full ranking
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 sm:grid-cols-3">
              {spotlightTopThree.map((entry) => (
                <SpotlightRankingCard key={entry.slug} entry={entry} />
              ))}
            </div>
          </div>
        </section>

        <ReviewsGrid />
      </main>
      <Footer />
    </div>
  </>
);

export default Reviews;
