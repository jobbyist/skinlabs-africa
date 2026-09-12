import skinlabsPromiseBadge from "@/assets/skinlabs-promise-badge.png";
import { cn } from "@/lib/utils";

/**
 * The SkinLabs® Promise badge — extracted from its original one-off inline
 * usage in src/pages/ProductReview.tsx so it can be reused anywhere
 * (originally: editorial reviews; now also: every OpenHaus product page).
 */
const DEFAULT_DESCRIPTION =
  "No hype, just evidence — this review is independently researched from publicly available information, ingredient analysis and editorial testing.";

export function SkinLabsPromiseBadge({
  className,
  description = DEFAULT_DESCRIPTION,
}: {
  className?: string;
  description?: string;
}) {
  return (
    <div className={cn("flex items-center gap-4 rounded-2xl border border-border bg-card p-4", className)}>
      <img
        src={skinlabsPromiseBadge}
        alt="SkinLabs Promise — No Hype. Just Evidence."
        className="h-16 w-16 shrink-0 sm:h-20 sm:w-20"
        loading="lazy"
        width={80}
        height={80}
      />
      <div>
        <p className="text-sm font-semibold text-foreground">The SkinLabs Promise</p>
        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
