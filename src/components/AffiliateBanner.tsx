import AdSlot from "@/components/AdSlot";

interface AffiliateBannerProps {
  /** Optional placement label for analytics */
  placement?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Despite the name, this has only ever been the standard AdSense unit (same
 * client and slot as AdSlot) since the old affiliate placeholder was retired.
 * Kept as a thin alias so existing call sites don't change; prefer AdSlot.
 */
const AffiliateBanner = ({ placement = "default", className, compact = false }: AffiliateBannerProps) => (
  <AdSlot placement={placement} className={className} compact={compact} />
);

export default AffiliateBanner;
