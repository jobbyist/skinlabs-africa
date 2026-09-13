import { useEffect, useRef } from "react";
import AdDisclosure from "@/components/AdDisclosure";

const AFFILIATE_HREF = "https://c.trackmytarget.com/?a=s1d2fa&i=r344bf";
const IMPRESSION_SRC = "https://i.trackmytarget.com/?a=s1d2fa&i=r344bf";
const BANNER_SRC = "/affiliates/faithful-to-nature.jpg";

/** Fire a 1×1 impression pixel exactly once. Cache-busted so each fire is a unique request. */
const fireImpressionPixel = () => {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(IMPRESSION_SRC);
    url.searchParams.set("_t", String(Date.now()));
    const img = new Image(1, 1);
    img.referrerPolicy = "no-referrer-when-downgrade";
    img.src = url.toString();
  } catch {
    // Network / ad-blocker — silent fail
  }
};

interface FaithfulToNatureProps {
  /** Optional placement label for analytics */
  placement?: string;
  className?: string;
  compact?: boolean;
  /**
   * When true (default), only fire the impression once the banner is at least
   * 50% visible in the viewport. When false, fire on mount.
   */
  trackWhenVisible?: boolean;
}

/**
 * Faithful to Nature affiliate banner.
 * Tracks viewable impressions via the trackmytarget pixel and routes clicks
 * through the affiliate URL. Clearly labelled as an advertisement.
 */
const FaithfulToNature = ({
  placement = "default",
  className = "",
  compact = false,
  trackWhenVisible = true,
}: FaithfulToNatureProps) => {
  const containerRef = useRef<HTMLElement>(null);
  const impressionFired = useRef(false);

  useEffect(() => {
    if (impressionFired.current) return;

    const fireOnce = () => {
      if (impressionFired.current) return;
      impressionFired.current = true;
      fireImpressionPixel();
    };

    // Fire immediately on mount when viewability tracking is disabled
    if (!trackWhenVisible) {
      fireOnce();
      return;
    }

    const el = containerRef.current;
    if (!el) {
      // Fallback: no element yet — fire on next tick
      fireOnce();
      return;
    }

    // Prefer IntersectionObserver for viewable impressions (≥50% visible)
    if (typeof IntersectionObserver === "undefined") {
      fireOnce();
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
            fireOnce();
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: [0.5] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [trackWhenVisible, placement]);

  return (
    <aside
      ref={containerRef}
      className={`relative w-full overflow-hidden ${className}`}
      data-ad-placement={placement}
      data-affiliate-placement={placement}
      data-affiliate-partner="faithful-to-nature"
      aria-label="Advertisement — Faithful to Nature"
    >
      <div className={`mx-auto max-w-4xl ${compact ? "min-h-[90px]" : "min-h-[140px]"}`}>
        <a
          href={AFFILIATE_HREF}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block overflow-hidden rounded-2xl border border-border bg-card transition-shadow hover:shadow-md"
          data-affiliate-click="faithful-to-nature"
          data-placement={placement}
        >
          <img
            src={BANNER_SRC}
            alt="Faithful to Nature — natural and organic products"
            className="h-auto w-full object-cover"
            loading="lazy"
            width={1200}
            height={400}
          />
        </a>
        <AdDisclosure />
      </div>
    </aside>
  );
};

export default FaithfulToNature;
