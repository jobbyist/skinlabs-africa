import { useCallback, useState } from "react";
import { toast } from "sonner";
import { trackConversionEvent } from "@/lib/analytics-events";
import { notifyMembershipUpdated } from "@/hooks/use-membership";
import { getPersistedPricingVariant } from "@/lib/pricing-config";
import { TIER_LABELS } from "@/lib/entitlements";
import { startFreeTrial } from "@/lib/trial";

export type TrialPlan = "insider" | "glow_lite";

export interface StartTrialOptions {
  /** Defaults to Glow Insider — it unlocks every trial-able feature. */
  plan?: TrialPlan;
  /** Analytics source, e.g. "product_review_gate". */
  source?: string;
  /** Called after a successful start. Omit to stay on the page (gates unlock in place). */
  onStarted?: () => void;
}

/**
 * The single no-card free-trial path. Wraps startFreeTrial() (start_free_trial
 * RPC — eligibility, length and one-trial-per-account are enforced
 * server-side) with loading/error state, trial_activation_* events and a
 * membership refresh, so every mounted gate on the page re-renders unlocked.
 *
 * Onboarding overhaul 03 introduced this ahead of prompt 05, which moves
 * Pricing/Hero onto it and may add a post-trial destination via `onStarted`.
 */
export const useStartTrial = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async ({ plan = "insider", source, onStarted }: StartTrialOptions = {}) => {
    setLoading(true);
    setError(null);
    trackConversionEvent("trial_activation_started", { plan, source });
    const { error: startError } = await startFreeTrial(plan, getPersistedPricingVariant());
    setLoading(false);
    if (startError) {
      setError(startError.message);
      trackConversionEvent("trial_activation_failed", { plan, reason: startError.message, source });
      toast.error(startError.message);
      // A stale "trial available" view (e.g. used in another tab) corrects itself.
      notifyMembershipUpdated();
      return false;
    }
    toast.success(`Your ${TIER_LABELS[plan]} free trial is live — no card needed.`);
    notifyMembershipUpdated();
    onStarted?.();
    return true;
  }, []);

  return { start, loading, error };
};
