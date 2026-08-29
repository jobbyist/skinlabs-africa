import { ExternalLink } from "lucide-react";

interface AffiliateBannerProps {
  /** Optional placement label for analytics / future ad slots */
  placement?: string;
  className?: string;
  compact?: boolean;
}

/**
 * Placeholder slot for future affiliate / partner creatives.
 * Non-intrusive, clearly labelled as advertising so editorial trust is preserved.
 */
const AffiliateBanner = ({ placement = "default", className = "", compact = false }: AffiliateBannerProps) => {
  return (
    <aside
      className={`w-full ${className}`}
      data-affiliate-placement={placement}
      aria-label="Advertisement placeholder"
    >
      <div
        className={`relative overflow-hidden rounded-2xl border border-dashed border-border/80 bg-muted/40 ${
          compact ? "px-4 py-3" : "px-5 py-5 sm:px-8 sm:py-6"
        }`}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className={`relative flex flex-col items-center justify-center gap-1 text-center ${compact ? "" : "gap-2"}`}>
          <span className="rounded-full bg-background/80 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ring-1 ring-border">
            Ad · Partner slot
          </span>
          <p className={`font-heading font-semibold text-foreground ${compact ? "text-sm" : "text-base sm:text-lg"}`}>
            Affiliate banner placeholder
          </p>
          {!compact && (
            <p className="max-w-md text-xs text-muted-foreground sm:text-sm">
              Partner creatives will appear here. SkinLabs editorial remains independent — no gifted samples, no paid rankings.
            </p>
          )}
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] text-muted-foreground/80">
            Reserved for verified SA retail partners
            <ExternalLink className="h-3 w-3" aria-hidden />
          </span>
        </div>
      </div>
    </aside>
  );
};

export default AffiliateBanner;
