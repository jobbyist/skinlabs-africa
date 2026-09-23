import AdFrame from "@/components/ads/AdFrame";
import { ADSENSE_CLIENT, useAdSenseUnit } from "@/components/ads/useAdSenseUnit";

/** Google AdSense in-page ad unit for the free (ad-supported) SkinLabs experience. */
export { ADSENSE_CLIENT };
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

const AdSlot = ({ placement, adSlot = ADSENSE_SLOT, format = "auto", className, compact = false }: AdSlotProps) => {
  const { insRef, collapsed } = useAdSenseUnit();

  return (
    <AdFrame placement={placement} label="Advertisement" collapsed={collapsed} className={className}>
      <div className={compact ? "min-h-[90px]" : "min-h-[120px]"}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={adSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      </div>
    </AdFrame>
  );
};

export default AdSlot;
