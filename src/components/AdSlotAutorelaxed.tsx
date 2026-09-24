import AdFrame from "@/components/ads/AdFrame";
import { ADSENSE_CLIENT, useAdSenseUnit } from "@/components/ads/useAdSenseUnit";

/** Google AdSense autorelaxed (matched content) unit for SkinLabs feeds and articles. */
export const ADSENSE_AUTORELAXED_SLOT = "3800151306";

interface AdSlotAutorelaxedProps {
  placement: string;
  className?: string;
  compact?: boolean;
}

const AdSlotAutorelaxed = ({ placement, className, compact = false }: AdSlotAutorelaxedProps) => {
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
