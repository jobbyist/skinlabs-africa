import { useEffect, useRef } from "react";
import AdDisclosure from "@/components/AdDisclosure";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * Google AdSense in-page ad unit for SkinLabs free (ad-supported) experience.
 * Renders the official AdSense unit and a short disclosure about the free plan.
 */
export const ADSENSE_CLIENT = "ca-pub-1237323355260727";
export const ADSENSE_SLOT = "2940635869";

export const AD_SLOTS = {
  inArticle: ADSENSE_SLOT,
  inFeed: ADSENSE_SLOT,
  sidebar: ADSENSE_SLOT,
} as const;

type AdFormat = "auto" | "fluid" | "rectangle";

interface AdSlotProps {
  placement: string;
  adSlot?: string;
  format?: AdFormat;
  className?: string;
  /** Kept for API compatibility; affiliate fallback is no longer used. */
  showAffiliateFallback?: boolean;
  compact?: boolean;
}

const AdSlot = ({
  placement,
  adSlot = ADSENSE_SLOT,
  format = "auto",
  className = "",
  compact = false,
}: AdSlotProps) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== "undefined") {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        pushed.current = true;
      }
    } catch {
      // Ad blockers or missing script
    }
  }, []);

  return (
    <aside
      className={`w-full overflow-hidden ${className}`}
      data-ad-placement={placement}
      aria-label="Advertisement"
    >
      <div className={`mx-auto max-w-4xl ${compact ? "min-h-[90px]" : "min-h-[120px]"}`}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        <AdDisclosure />
      </div>
    </aside>
  );
};

export default AdSlot;
