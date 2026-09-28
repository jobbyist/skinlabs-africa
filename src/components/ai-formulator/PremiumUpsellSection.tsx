import { BookOpenCheck, CalendarCheck2, FlaskConical, Loader2, RefreshCw, Sparkles, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeeAllPlansLink } from "@/components/GatedOverlay";
import { useConversionAction } from "@/hooks/use-conversion-action";
import { useEntitlements } from "@/hooks/use-entitlements";
import { TIER_LABELS, purchasableCapabilities, type FeatureKey } from "@/lib/entitlements";
import { usePricingConfig } from "@/lib/pricing-config";

interface PremiumUpsellSectionProps {
  /** Kept for the caller's API. */
  hasGroundedMatches?: boolean;
}

/** Copy for the perks that build on a SKYNN AI analysis. Anything not listed here is never shown. */
const PERKS: Partial<Record<FeatureKey, { icon: LucideIcon; title: string; body: string }>> = {
  "ai_analysis.live_weekly": {
    icon: RefreshCw,
    title: "Unlimited Basic AI Skin Analysis",
    body: "Re-run your Basic AI Skin Analysis whenever your skin changes — no 7-day wait.",
  },
  "ai_analysis.routine_builder": {
    icon: Sparkles,
    title: "Named product matches + Routine Builder",
    body: "See the exact SkinLabs-reviewed products matched to your routine, with real prices and scores, and build a full routine from any review.",
  },
  "routine.conflict_matcher": {
    icon: FlaskConical,
    title: "Active Ingredient Conflict Matcher",
    body: "Checks your SKYNN AI routine for actives that clash, using SkinLabs' sourced interaction data.",
  },
  "reviews.full_body": {
    icon: BookOpenCheck,
    title: "Full product breakdowns",
    body: "The complete ingredient analysis and verdict for every product we've reviewed.",
  },
  practitioner_directory: {
    icon: CalendarCheck2,
    title: "Practitioner directory",
    body: "Find HPCSA-registered skin professionals when you want a second opinion.",
  },
};

/**
 * The Basic AI Skin Analysis result screen's upsell. Honest by construction: it lists
 * only capabilities of tiers that can be bought right now (pricing_plans
 * .is_purchasable ∩ LADDER_CAPABILITIES via purchasableCapabilities()), so a
 * VIP-only perk or consult booking never appears while VIP is "Coming soon",
 * and only perks this visitor doesn't already have. The CTA comes from
 * useConversionAction. Renders nothing when there's nothing left to offer.
 */
const PremiumUpsellSection = (_props: PremiumUpsellSectionProps) => {
  const { can, loading } = useEntitlements();
  const { data: pricing, isLoading: pricingLoading } = usePricingConfig();
  const action = useConversionAction("ai_analysis.live_weekly", "starter_results_upsell");
  if (loading || pricingLoading || !pricing) return null;

  const purchasable = pricing.plans.filter((p) => p.is_purchasable).map((p) => p.plan_id);
  const perks = purchasableCapabilities(purchasable)
    .filter(({ feature }) => PERKS[feature] && !can(feature))
    .map(({ feature, cheapestTier }) => ({ feature, tier: cheapestTier, ...PERKS[feature]! }));
  if (perks.length === 0) return null;

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-accent/50 to-transparent p-5 sm:p-6 space-y-4">
      <div>
        <h4 className="font-heading font-semibold text-card-foreground">See the rest of what SkinLabs can do for your skin</h4>
        <p className="text-sm text-muted-foreground mt-1">These build directly on the analysis you just completed — nothing to redo.</p>
      </div>
      <ul className="grid sm:grid-cols-2 gap-3">
        {perks.map(({ feature, icon: Icon, title, body, tier }) => (
          <li key={feature} className="flex items-start gap-3 rounded-xl bg-card/60 border border-border p-3.5">
            <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium text-card-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
              <p className="text-[11px] font-medium text-muted-foreground mt-1">Included from {TIER_LABELS[tier]}</p>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex flex-col items-start gap-2">
        {action.kind && (
          <Button className="gap-2" onClick={action.run} disabled={action.busy}>
            {action.busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="h-4 w-4" aria-hidden="true" />}
            {action.label}
          </Button>
        )}
        {action.kind && action.sublabel && <p className="text-xs text-muted-foreground">{action.sublabel}</p>}
        <SeeAllPlansLink />
      </div>
    </div>
  );
};

export default PremiumUpsellSection;
