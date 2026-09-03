import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import SpotlightRankingCard from "@/components/SpotlightRankingCard";
import { spotlightTopThisWeek, SPOTLIGHT_EDITION_MONTH } from "@/data/spotlight";

const SpotlightTeaser = () => {
  return (
    <section id="spotlight" className="bg-background py-20">
      <div className="container mx-auto px-4">
        <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Spotlight · {SPOTLIGHT_EDITION_MONTH}</p>
            <h2 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-4xl">
              Top 3 South African skincare brands this week
            </h2>
            <p className="text-muted-foreground">
              Ranked by real, published review scores — not popularity, not payment. This trio rotates every Friday
              at 12am SAST among the highest-scoring brands; the full ranking refreshes monthly.
            </p>
          </div>
          <Link to="/spotlight" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
            See the full ranking
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {spotlightTopThisWeek.map((entry) => (
            <SpotlightRankingCard key={entry.slug} entry={entry} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SpotlightTeaser;
