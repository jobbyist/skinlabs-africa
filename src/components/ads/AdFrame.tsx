import { forwardRef, type ReactNode } from "react";
import AdDisclosure from "@/components/AdDisclosure";
import { cn } from "@/lib/utils";

interface AdFrameProps {
  placement: string;
  /** "Advertisement" for AdSense units, "Sponsored" for direct partner placements. */
  label: "Advertisement" | "Sponsored";
  ariaLabel?: string;
  /** Collapse entirely (unfilled or blocked) instead of leaving a blank gap. */
  collapsed?: boolean;
  className?: string;
  children: ReactNode;
  dataAttributes?: Record<`data-${string}`, string>;
}

/**
 * The single wrapper every ad and sponsored unit renders inside, so placement
 * is consistent site-wide: generous vertical breathing room from surrounding
 * content (my-12 / sm:my-16 — call sites should NOT add their own vertical
 * margin or padding around an ad), a small centred label so an ad never
 * reads as editorial content, the standard disclosure, and a readable max
 * width. Placement rules for callers: one unit per break, never two units
 * adjacent, never directly under a hero, and always with real content on
 * both sides.
 */
const AdFrame = forwardRef<HTMLElement, AdFrameProps>(
  ({ placement, label, ariaLabel, collapsed = false, className, children, dataAttributes }, ref) => (
    <aside
      ref={ref}
      className={cn("mx-auto my-12 w-full max-w-4xl sm:my-16", collapsed && "hidden", className)}
      data-ad-placement={placement}
      aria-label={ariaLabel ?? label}
      {...dataAttributes}
    >
      <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground/70" aria-hidden="true">
        {label}
      </p>
      {children}
      <AdDisclosure />
    </aside>
  ),
);
AdFrame.displayName = "AdFrame";

export default AdFrame;
