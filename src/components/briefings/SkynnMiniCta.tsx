import { Link } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { trackConversionEvent } from "@/lib/analytics-events";
import { BASIC_NAME, SKYNN_PRODUCT } from "@/lib/skynn/terminology";
import { useAuth } from "@/hooks/use-auth";
import { useContextualActions } from "@/hooks/use-contextual-actions";
import { readSkinProfileHint } from "@/lib/context/changeEvent";

interface SkynnMiniCtaProps {
  /** Where the card sits, for analytics (e.g. "briefing_article"). */
  source?: string;
  /** Headline override for pages where "this" isn't an article. */
  headline?: string;
}

/**
 * Compact in-article card. Visitors and members without a skin profile see the SKYNN AI
 * invitation (free, no account needed to start). A member who already has a profile gets
 * what is next for them instead (src/lib/context, `content_end`): the card never asks
 * someone to take an analysis they have done. Copy stays within the SKYNN AI v2.1 rules:
 * the Basic analysis is a free quiz-based skin profile, nothing about it is a diagnosis,
 * and nothing here implies dermatologist review.
 */
const SkynnMiniCta = (props: SkynnMiniCtaProps) => {
  const { user } = useAuth();
  // Only members with a known profile pay for the member snapshot; everyone else renders instantly.
  const hasProfile = Boolean(user) && readSkinProfileHint(user?.id);
  return hasProfile ? <MemberNextStep source={props.source ?? "briefing_article"} /> : <InviteCard {...props} />;
};

/**
 * "What's next for you" at the end of an article, review or episode. Renders nothing for visitors and for
 * members without a skin profile (they have the invitation card or nothing), so it can be dropped in anywhere
 * without adding a promo for people it doesn't apply to.
 */
export const MemberNextStepCard = ({ source }: { source: string }) => {
  const { user } = useAuth();
  if (!user || !readSkinProfileHint(user.id)) return null;
  return <MemberNextStep source={source} />;
};

const MemberNextStep = ({ source }: { source: string }) => {
  const { primary, loading, click } = useContextualActions("content_end", { secondaryLimit: 0 });
  if (loading || !primary || !primary.href) return null;
  return (
    <aside aria-label="Suggested next step" className="not-prose my-8 rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">For you</p>
          <p className="mt-0.5 font-heading text-base font-semibold leading-snug text-foreground">{primary.label}</p>
          {primary.reason && <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{primary.reason}</p>}
        </div>
        <Link
          to={primary.href}
          onClick={() => {
            click(primary);
            trackConversionEvent("skynn_cta_clicked", { source, kind: "briefing_member_next_step" });
          }}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
        >
          Open
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </aside>
  );
};

const InviteCard = ({ source = "briefing_article", headline = "Curious how this applies to your skin?" }: SkynnMiniCtaProps) => (
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
