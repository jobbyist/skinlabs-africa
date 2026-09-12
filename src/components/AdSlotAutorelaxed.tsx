import { useEffect, useRef } from "react";
import AdDisclosure from "@/components/AdDisclosure";
import { ADSENSE_CLIENT } from "@/components/AdSlot";

/** Google AdSense autorelaxed (matched content) unit for SkinLabs feeds and articles. */
export const ADSENSE_AUTORELAXED_SLOT = "3800151306";

interface AdSlotAutorelaxedProps {
  placement: string;
  className?: string;
  compact?: boolean;
}

const AdSlotAutorelaxed = ({
  placement,
  className = "",
  compact = false,
}: AdSlotAutorelaxedProps) => {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current) return;
    try {
      if (typeof window !== "undefined") {
        const existing = document.querySelector(
          'script[src*="pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]',
        );
        if (!existing) {
          const s = document.createElement("script");
          s.async = true;
          s.src =
            "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" +
            ADSENSE_CLIENT;
          s.crossOrigin = "anonymous";
          document.head.appendChild(s);
        }
        // @ts-expect-error adsbygoogle is injected globally
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
      <div className={`mx-auto max-w-4xl ${compact ? "min-h-[90px]" : "min-h-[250px]"}`}>
        <ins
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-format="autorelaxed"
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_AUTORELAXED_SLOT}
        />
        <AdDisclosure />
      </div>
    </aside>
  );
};

export default AdSlotAutorelaxed;
