import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { trackConversionEvent } from "@/lib/analytics-events";
import { notifyMembershipUpdated } from "@/hooks/use-membership";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import { TIER_LABELS } from "@/lib/entitlements";
import { startFreeTrial } from "@/lib/trial";
import { TRIAL_STARTED_PATH } from "@/lib/intentRouting";
import { openMembershipCheckout } from "@/lib/conversionDialogs";
import { isTrialAlreadyUsedError } from "@/lib/trialErrors";

export type TrialPlan = "insider" | "glow_lite";

export interface StartTrialOptions {
  /** Defaults to Glow Insider — it unlocks every trial-able feature. */
  plan?: TrialPlan;
  /** Analytics source, e.g. "pricing_card" or "product_review_gate". */
  source?: string;
  /**
   * Where to go once the trial is live. Defaults to TRIAL_STARTED_PATH (the
   * welcome flow). Pass null to stay on the page — gates do, so the content
   * unlocks in place.
   */
  destination?: string | null;
}

export type StartTrialError = "trial_used" | "failed";

/**
 * The single no-card free-trial path — one tap for a signed-in free account.
 * Wraps startFreeTrial() (start_free_trial RPC: eligibility, length and one
 * trial per account are enforced server-side) with loading/error state,
 * trial_activation_* events and a membership refresh, then navigates with the
 * router (never window.location). An account that has already used its trial
 * gets a friendly message with a Subscribe action instead of a raw error.
 */
export const useStartTrial = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<StartTrialError | null>(null);

  const start = useCallback(
    async ({ plan = "insider", source, destination = TRIAL_STARTED_PATH }: StartTrialOptions = {}) => {
      setLoading(true);
      setError(null);
      trackConversionEvent("trial_activation_started", { plan, source });
      const { error: startError } = await startFreeTrial(plan, getPersistedPricingVariant());
      setLoading(false);
      // Either way the membership may have changed (e.g. trial used in another
      // tab): refresh every mounted useMembership(), so gates and plan cards
      // re-render from the live state.
      notifyMembershipUpdated();

      if (startError) {
        const trialUsed = isTrialAlreadyUsedError(startError.message);
        setError(trialUsed ? "trial_used" : "failed");
        trackConversionEvent("trial_activation_failed", { plan, reason: startError.message, source });
        if (trialUsed) {
          toast("You've already used your free trial", {
            description: `Subscribe to keep ${TIER_LABELS[plan]} — cancel any time from your dashboard.`,
            action: {
              label: "Subscribe",
              onClick: () =>
                openMembershipCheckout({
                  plan: { planId: plan, name: TIER_LABELS[plan], interval: "monthly" },
                  variantKey: getPersistedPricingVariant(),
                }),
            },
          });
        } else {
          toast.error(startError.message);
        }
        return false;
      }

      toast.success(`Your ${TIER_LABELS[plan]} free trial is live — no card needed.`);
      if (destination) navigate(destination);
      return true;
    },
    [navigate],
  );

  return { start, loading, error };
};
