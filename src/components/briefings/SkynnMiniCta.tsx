import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { trackConversionEvent } from "@/lib/analytics-events";
import { BASIC_NAME, SKYNN_PRODUCT } from "@/lib/skynn/terminology";

interface SkynnMiniCtaProps {
  /** Where the card sits, for analytics (e.g. "briefing_article"). */
  source?: string;
  /** Headline override for pages where "this" isn't an article. */
  headline?: string;
}

/**
 * Compact in-article card that points readers at SKYNN AI. Free, no account
 * needed to start. Copy stays within the SKYNN AI v2.1 rules: the Basic
 * analysis is a free quiz-based skin profile, nothing about it is a diagnosis,
 * and nothing here implies dermatologist review.
 */
const SkynnMiniCta = ({ source = "briefing_article", headline = "Curious how this applies to your skin?" }: SkynnMiniCtaProps) => (
  <aside
    aria-label={`${SKYNN_PRODUCT} skin analysis`}
    className="not-prose my-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5"
  >
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-start gap-3">
        <span className="gradient-bg-soft flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border">
          <Sparkles className="h-5 w-5 text-foreground" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{SKYNN_PRODUCT} · Free</p>
          <p className="mt-0.5 font-heading text-base font-semibold leading-snug text-foreground">
            {headline}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
            Take the free {BASIC_NAME}: a short quiz, about two minutes, and a skin profile and routine matched to your
            skin type and concerns.
          </p>
        </div>
      </div>
      <Link
        to="/skynn-ai"
        onClick={() => trackConversionEvent("skynn_cta_clicked", { source, kind: "briefing_mini_cta" })}
        className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
      >
        Start my analysis
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>
  </aside>
);

export default SkynnMiniCta;
