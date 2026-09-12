import { useEffect, useRef } from "react";
import AdDisclosure from "@/components/AdDisclosure";

const AFFILIATE_HREF = "https://c.trackmytarget.com/?a=s1d2fa&i=r344bf";
const IMPRESSION_SRC = "https://i.trackmytarget.com/?a=s1d2fa&i=r344bf";
const BANNER_SRC = "/affiliates/faithful-to-nature.jpg";

interface FaithfulToNatureProps {
  /** Optional placement label for analytics */
  placement?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Faithful to Nature affiliate banner.
 * Renders the brand creative, tracks impressions via the trackmytarget pixel,
 * and links through the affiliate click URL. Clearly labelled as an advertisement.
 */
const FaithfulToNature = ({
  placement = "default",
  className = "",
  compact = false,
}: FaithfulToNatureProps) => {
  const impressionFired = useRef(false);

  useEffect(() => {
    if (impressionFired.current) return;
    impressionFired.current = true;
  }, []);

  return (
    <aside
      className={`w-full overflow-hidden ${className}`}
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
        {/* Impression tracking pixel */}
        <img
          src={IMPRESSION_SRC}
          alt=""
          width={1}
          height={1}
          className="absolute h-px w-px opacity-0"
          aria-hidden="true"
        />
        <AdDisclosure />
      </div>
    </aside>
  );
};

export default FaithfulToNature;
