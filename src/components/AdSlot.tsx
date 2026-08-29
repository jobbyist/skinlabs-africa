import { useEffect, useRef } from "react";
import AffiliateBanner from "@/components/AffiliateBanner";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export const ADSENSE_CLIENT = "ca-pub-1237323355260727";

export const AD_SLOTS = {
  inArticle: "0000000001",
  inFeed: "0000000002",
  sidebar: "0000000003",
} as const;

type AdFormat = "auto" | "fluid" | "rectangle";

interface AdSlotProps {
  placement: string;
  adSlot?: string;
  format?: AdFormat;
  className?: string;
  showAffiliateFallback?: boolean;
  compact?: boolean;
}

const AdSlot = ({
  placement,
  adSlot = AD_SLOTS.inFeed,
  format = "auto",
  className = "",
  showAffiliateFallback = true,
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
          style={{ display: "block", textAlign: "center" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        {showAffiliateFallback && (
          <div className="mt-2">
            <AffiliateBanner placement={`fallback-${placement}`} compact={compact} />
          </div>
        )}
      </div>
    </aside>
  );
};

export default AdSlot;
