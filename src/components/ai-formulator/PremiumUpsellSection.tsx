import { CalendarCheck2, Layers, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeeAllPlansLink } from "@/components/GatedOverlay";
import { useConversionAction } from "@/hooks/use-conversion-action";
import { useEntitlements } from "@/hooks/use-entitlements";

interface PremiumUpsellSectionProps {
  hasGroundedMatches: boolean;
}

/**
 * The Starter Analysis result screen's primary conversion surface (Section:
 * "Build an optimized sales acquisition system"). Named/priced grounded
 * products and the interactive Routine Builder are real SkinLabs capabilities
 * already gated to VIP via `ai_analysis.routine_builder` in entitlements.ts —
 * this surfaces them honestly (real existing perks, no fabricated scarcity)
 * rather than inventing a new gate. Renders nothing once the visitor already
 * has the capability.
 */
const PremiumUpsellSection = ({ hasGroundedMatches }: PremiumUpsellSectionProps) => {
  const { can, loading } = useEntitlements();
  // The CTA targets what a one-tap Glow Insider trial actually unlocks (the
  // named product matches); the VIP-only perks below are revisited in
  // onboarding overhaul prompt 10.
  const action = useConversionAction("ai_analysis.live_weekly", "starter_results_upsell");
  if (loading || can("ai_analysis.routine_builder")) return null;

  const perks = [
    {
      icon: Sparkles,
      title: "Your exact product matches",
      body: hasGroundedMatches
        ? "We found real SkinLabs-reviewed products for your routine — Insider and VIP see the names, prices and scores."
        : "Insider and VIP members get named, priced SkinLabs-reviewed picks matched to their exact profile.",
    },
    {
      icon: Layers,
      title: "Interactive Routine Builder",
      body: "Swap products in and out of your routine and see how the SkinLabs score changes — a VIP-only tool.",
    },
    {
      icon: CalendarCheck2,
      title: "Discounted dermatologist bookings",
      body: "Insider and VIP unlock our HPCSA-registered practitioner directory, with priority booking on VIP.",
    },
    {
      icon: ShieldCheck,
      title: "Quarterly human-verified audits",
      body: "Active VIP subscribers get a quarterly routine review — a real person checking your routine still fits.",
    },
  ];

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-accent/50 to-transparent p-5 sm:p-6 space-y-4">
      <div>
        <h4 className="font-heading font-semibold text-card-foreground">See the rest of what SkinLabs can do for your skin</h4>
        <p className="text-sm text-muted-foreground mt-1">These build directly on the analysis you just completed — nothing to redo.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {perks.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3 rounded-xl bg-card/60 border border-border p-3.5">
            <Icon className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-card-foreground">{title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{body}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-start gap-2">
        {action.kind && (
          <Button className="gap-2" onClick={action.run} disabled={action.busy}>
            {action.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
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
