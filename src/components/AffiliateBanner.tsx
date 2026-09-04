import { useEffect, useRef } from "react";
import AdDisclosure from "@/components/AdDisclosure";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

const ADSENSE_CLIENT = "ca-pub-1237323355260727";
const ADSENSE_SLOT = "2940635869";

interface AffiliateBannerProps {
  /** Optional placement label for analytics */
  placement?: string;
  className?: string;
  compact?: boolean;
}

/**
 * In-page Google AdSense unit (replaces previous affiliate placeholder).
 * Clearly labelled free / ad-supported experience with upgrade messaging.
 */
const AffiliateBanner = ({
  placement = "default",
  className = "",
  compact = false,
}: AffiliateBannerProps) => {
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
      data-affiliate-placement={placement}
      aria-label="Advertisement"
    >
      <div className={`mx-auto max-w-4xl ${compact ? "min-h-[90px]" : "min-h-[120px]"}`}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_SLOT}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
        <AdDisclosure />
      </div>
    </aside>
  );
};

export default AffiliateBanner;
