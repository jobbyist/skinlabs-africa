import { useEffect, useState } from "react";
import { isPromoActive, PROMO_BANNER_ID } from "@/lib/promo";

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
 */
export const usePromoBar = () => {
  const [dismissed, setDismissed] = useState(readDismissed);

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

  return { visible: isPromoActive() && !dismissed, dismiss };
};
