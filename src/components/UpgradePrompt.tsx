import { useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEntitlements } from "@/hooks/use-entitlements";
import { TIER_LABELS, minimumTierFor, type FeatureKey } from "@/lib/entitlements";
import { trackConversionEvent } from "@/lib/analytics-events";

interface UpgradePromptProps {
  feature: FeatureKey;
  headline?: string;
  body?: string;
  className?: string;
}

/**
 * A non-blocking inline upgrade nudge — for surfaces where hiding content
 * outright (FeatureGate) would be too aggressive, e.g. a dashboard banner or
 * an end-of-article CTA. Renders nothing once the account already has the
 * feature. Fires the same `upgrade_prompt_view` event as FeatureGate (tagged
 * `style: "inline"`) so both gating styles roll up into one funnel metric,
 * and `upgrade_click` when the CTA itself is used.
 */
const UpgradePrompt = ({ feature, headline, body, className }: UpgradePromptProps) => {
  const { can, loading, accountState } = useEntitlements();
  const firedRef = useRef(false);
  const show = !loading && !can(feature);

  useEffect(() => {
    if (show && !firedRef.current) {
      firedRef.current = true;
      trackConversionEvent("upgrade_prompt_view", { feature, accountState, style: "inline" });
    }
  }, [show, feature, accountState]);

  if (!show) return null;

  const requiredTier = minimumTierFor(feature);
  const tierLabel = requiredTier ? TIER_LABELS[requiredTier] : "a paid membership";

  return (
    <div
      className={`flex flex-col items-start gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between ${className ?? ""}`}
    >
      <div>
        <p className="font-heading text-sm font-bold text-foreground">{headline ?? `Unlock this with ${tierLabel}`}</p>
        <p className="text-sm text-muted-foreground">
          {body ?? "Upgrade any time — cancel or change plans from your dashboard."}
        </p>
      </div>
      <Button
        asChild
        size="sm"
        className="shrink-0 gap-2"
        onClick={() => trackConversionEvent("upgrade_click", { feature, accountState })}
      >
        <Link to="/pricing">
          <Sparkles className="h-4 w-4" />
          View plans
        </Link>
      </Button>
    </div>
  );
};

export default UpgradePrompt;
