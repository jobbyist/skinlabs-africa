import AdSlot from "@/components/AdSlot";
import type { AdPriority } from "@/lib/viewerContext";

interface AffiliateBannerProps {
  /** Optional placement label for analytics */
  placement?: string;
  className?: string;
  compact?: boolean;
  priority?: AdPriority;
}

/**
 * Despite the name, this has only ever been the standard AdSense unit (same
 * client and slot as AdSlot) since the old affiliate placeholder was retired.
 * Kept as a thin alias so existing call sites don't change; prefer AdSlot.
 */
const AffiliateBanner = ({ placement = "default", className, compact = false, priority }: AffiliateBannerProps) => (
  <AdSlot placement={placement} className={className} compact={compact} priority={priority} />
);

export default AffiliateBanner;
