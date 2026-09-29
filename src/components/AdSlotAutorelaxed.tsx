import AdFrame from "@/components/ads/AdFrame";
import { ADSENSE_CLIENT, useAdSenseUnit } from "@/components/ads/useAdSenseUnit";
import { useShouldShowAd } from "@/hooks/use-viewer-context";
import type { AdPriority } from "@/lib/viewerContext";

/** Google AdSense autorelaxed (matched content) unit for SkinLabs feeds and articles. */
export const ADSENSE_AUTORELAXED_SLOT = "3800151306";

interface AdSlotAutorelaxedProps {
  placement: string;
  className?: string;
  compact?: boolean;
  priority?: AdPriority;
}

const AdSlotAutorelaxed = ({ priority = "secondary", ...props }: AdSlotAutorelaxedProps) =>
  useShouldShowAd(priority) ? <AutorelaxedUnit {...props} /> : null;

const AutorelaxedUnit = ({ placement, className, compact = false }: Omit<AdSlotAutorelaxedProps, "priority">) => {
  const { insRef, collapsed } = useAdSenseUnit();

  return (
    <AdFrame placement={placement} label="Advertisement" collapsed={collapsed} className={className}>
      <div className={compact ? "min-h-[90px]" : "min-h-[250px]"}>
        <ins
          ref={insRef}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-format="autorelaxed"
          data-ad-client={ADSENSE_CLIENT}
          data-ad-slot={ADSENSE_AUTORELAXED_SLOT}
        />
      </div>
    </AdFrame>
  );
};

export default AdSlotAutorelaxed;
