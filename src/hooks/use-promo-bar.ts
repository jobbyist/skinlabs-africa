import { useEffect, useState } from "react";
import { isPromoActive, PROMO_BANNER_ID } from "@/lib/promo";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";

const STORAGE_KEY = `skinlabs-promo-bar-dismissed:${PROMO_BANNER_ID}`;

const readDismissed = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
};

/**
 * Shared visibility state for the temporary top-of-page promo bar, used by
 * both PromoAnnouncementBar (renders it) and Header (reserves the matching
 * layout space above the fixed nav) so the two never fall out of sync.
 *
 * Context-aware: the offer is "paid plans are free to try", so it's hidden
 * for anyone it no longer applies to — a trialist, a paying member, or an
 * account whose one trial is used. While membership is still loading it keeps
 * the prerendered state (shown), so a visitor's header never shifts.
 */
export const usePromoBar = () => {
  const [dismissed, setDismissed] = useState(readDismissed);
  const { user } = useAuth();
  const membership = useMembership();
  const offerDoesNotApply =
    Boolean(user) && !membership.loading && (membership.isTrialing || membership.trialUsed || membership.tier !== "explorer");

  useEffect(() => {
    setDismissed(readDismissed());
  }, []);

  const dismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Private browsing / storage disabled — dismissal just won't persist across reloads.
    }
  };

  return { visible: isPromoActive() && !dismissed && !offerDoesNotApply, dismiss };
};
