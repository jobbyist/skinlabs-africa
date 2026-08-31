import { useEffect, useMemo } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { getActiveCampaign } from "@/lib/affiliate/campaigns";
import {
  buildAffiliateHref,
  hasReachedFrequencyCap,
  recordFrequencyCapImpression,
  trackAffiliateClick,
  trackAffiliateImpression,
} from "@/lib/affiliate/tracking";
import { useInView } from "@/hooks/use-in-view";
import type { AffiliatePartner, AffiliatePlacement } from "@/lib/affiliate/types";

interface AffiliateAdSlotProps {
  partner: AffiliatePartner;
  placement: AffiliatePlacement;
  className?: string;
}

/**
 * Reusable SkinLabs Affiliate Ad System slot.
 *
 * Looks up the active campaign for `partner` + `placement` from the campaign
 * registry (`src/lib/affiliate/campaigns.ts`) and renders it as a native,
 * clearly-labelled "Partner Offer" card — or renders nothing if no campaign
 * is active, the campaign is outside its date range, or the visitor has
 * already hit the session frequency cap for it.
 *
 * No Shopify-specific (or any partner-specific) logic lives here — swapping
 * or adding a partner is a campaign-registry change only.
 */
const AffiliateAdSlot = ({ partner, placement, className }: AffiliateAdSlotProps) => {
  const shouldReduceMotion = useReducedMotion();
  const campaign = useMemo(() => getActiveCampaign(placement, partner), [placement, partner]);
  const capped = campaign ? hasReachedFrequencyCap(campaign) : true;
  const { ref, inView } = useInView<HTMLDivElement>();

  const creative = campaign
    ? campaign.creatives.desktop /* intrinsic size for the reserved aspect-ratio box; <picture> below swaps the actual source per breakpoint */
    : null;
  const tabletCreative = campaign?.creatives.tablet ?? creative;
  const mobileCreative = campaign?.creatives.mobile ?? tabletCreative;

  useEffect(() => {
    if (!campaign || capped || !inView) return;
    trackAffiliateImpression(campaign, creative?.id ?? "unknown");
    recordFrequencyCapImpression(campaign);
    // Only ever fire once per mount — `inView` latches true via useInView and campaign/creative are stable per render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaign, capped, inView]);

  if (!campaign || capped || !creative) return null;

  const href = buildAffiliateHref(campaign);

  const handleClick = () => {
    trackAffiliateClick(campaign, creative.id);
  };

  return (
    <motion.aside
      ref={ref}
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 12 }}
      whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5 }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-xs transition-shadow duration-300 hover:shadow-md sm:p-6",
        className,
      )}
      data-affiliate-partner={campaign.partner}
      data-affiliate-placement={campaign.placement}
      data-affiliate-subid={campaign.subId}
      aria-label={`Advertisement: ${campaign.heading}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
      />

      <div className="relative flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border">
            {campaign.eyebrow}
          </span>
        </div>

        <div>
          <h3 className="font-heading text-lg font-bold leading-snug text-foreground sm:text-xl">
            {campaign.heading}
          </h3>
          {campaign.body && <p className="mt-1 text-sm text-muted-foreground">{campaign.body}</p>}
        </div>

        <a
          href={href}
          target="_blank"
          rel="noopener sponsored"
          onClick={handleClick}
          className="block overflow-hidden rounded-xl border border-border/70"
          style={{ aspectRatio: `${creative.width} / ${creative.height}` }}
        >
          <picture>
            {mobileCreative && (
              <source media="(max-width: 639px)" srcSet={mobileCreative.src} width={mobileCreative.width} height={mobileCreative.height} />
            )}
            {tabletCreative && (
              <source media="(max-width: 1023px)" srcSet={tabletCreative.src} width={tabletCreative.width} height={tabletCreative.height} />
            )}
            <img
              src={creative.src}
              alt={creative.alt}
              width={creative.width}
              height={creative.height}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.02]"
            />
          </picture>
        </a>

        <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
          <a
            href={href}
            target="_blank"
            rel="noopener sponsored"
            onClick={handleClick}
            className="inline-flex w-fit items-center gap-1.5 rounded-full border border-foreground/15 bg-background px-4 py-2 text-sm font-semibold text-foreground transition-all duration-200 hover:gap-2.5 hover:border-foreground/30"
          >
            {campaign.ctaLabel}
            <ArrowRight className="h-3.5 w-3.5" aria-hidden />
          </a>
          {campaign.disclosure && (
            <p className="text-[11px] text-muted-foreground/80">{campaign.disclosure}</p>
          )}
        </div>
      </div>
    </motion.aside>
  );
};

export default AffiliateAdSlot;
