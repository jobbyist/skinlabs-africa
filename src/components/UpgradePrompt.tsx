import { useEffect, useRef } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeeAllPlansLink } from "@/components/GatedOverlay";
import { useConversionAction } from "@/hooks/use-conversion-action";
import { useEntitlements } from "@/hooks/use-entitlements";
import { TIER_LABELS, minimumTierFor, type FeatureKey } from "@/lib/entitlements";
import { trackConversionEvent } from "@/lib/analytics-events";

interface UpgradePromptProps {
  feature: FeatureKey;
  headline?: string;
  body?: string;
  className?: string;
  /** Analytics source for `upgrade_click`; defaults to `upgrade_prompt:<feature>`. */
  source?: string;
}

/**
 * A non-blocking inline upgrade nudge — for surfaces where hiding content
 * outright (FeatureGate) would be too aggressive, e.g. a dashboard banner or
 * an end-of-article CTA. Renders nothing once the account already has the
 * feature. Fires the same `upgrade_viewed` event as FeatureGate (tagged
 * `style: "inline"`). The CTA comes from useConversionAction (sign up / start
 * a trial in place / subscribe); "See all plans" is a secondary link.
 */
const UpgradePrompt = ({ feature, headline, body, className, source }: UpgradePromptProps) => {
  const { accountState } = useEntitlements();
  const action = useConversionAction(feature, source ?? `upgrade_prompt:${feature}`);
  const firedRef = useRef(false);
  const show = !action.entitled && (action.kind !== null || action.unavailable);

  useEffect(() => {
    if (show && !firedRef.current) {
      firedRef.current = true;
      trackConversionEvent("upgrade_viewed", { feature, accountState, style: "inline" });
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
        <p className="text-sm text-muted-foreground">{body ?? action.sublabel ?? "Cancel or change plans any time from your dashboard."}</p>
      </div>
      <div className="flex shrink-0 flex-col items-start gap-1.5 sm:items-end">
        {action.unavailable ? (
          <Button size="sm" variant="outline" disabled>
            {action.label}
          </Button>
        ) : (
          <Button size="sm" className="gap-2" onClick={action.run} disabled={action.busy}>
            {action.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {action.label}
          </Button>
        )}
        <SeeAllPlansLink className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground" />
      </div>
    </div>
  );
};

export default UpgradePrompt;
