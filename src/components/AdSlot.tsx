import AdFrame from "@/components/ads/AdFrame";
import { ADSENSE_CLIENT, useAdSenseUnit } from "@/components/ads/useAdSenseUnit";
import { useShouldShowAd } from "@/hooks/use-viewer-context";
import type { AdPriority } from "@/lib/viewerContext";

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
  /**
   * "primary" = the one unit per page an ad-light (Glow Insider) viewer still
   * sees. Default "secondary": full-ad viewers only. VIP sees none.
   */
  priority?: AdPriority;
}

/** Renders nothing for viewers whose plan hides this unit (see viewerContext.ts). */
const AdSlot = ({ priority = "secondary", ...props }: AdSlotProps) =>
  useShouldShowAd(priority) ? <AdSlotUnit {...props} /> : null;

const AdSlotUnit = ({ placement, adSlot = ADSENSE_SLOT, format = "auto", className, compact = false }: Omit<AdSlotProps, "priority">) => {
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
