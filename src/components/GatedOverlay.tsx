import { ReactNode, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useConversionAction } from "@/hooks/use-conversion-action";
import type { FeatureKey } from "@/lib/entitlements";
import { currentReturnTo } from "@/lib/pendingIntent";

interface GatedOverlayProps {
  locked: boolean;
  title?: string;
  message?: string;
  /** The entitlement that unlocks this content; decides the CTA (see useConversionAction). */
  feature?: FeatureKey;
  /** Analytics source for `upgrade_click`, e.g. "product_review_gate". */
  source: string;
  children: ReactNode;
}

/** Secondary "See all plans" text link, carrying this page as returnTo. Plain <a> so it also works in the SSR routes' MemoryRouter. */
export const SeeAllPlansLink = ({ className }: { className?: string }) => {
  // Resolved after mount: server render has no location, and React doesn't
  // patch a mismatched href on hydration.
  const [href, setHref] = useState("/pricing");
  useEffect(() => setHref(`/pricing?returnTo=${encodeURIComponent(currentReturnTo())}`), []);
  return (
    <a href={href} className={className ?? "text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"}>
      See all plans
    </a>
  );
};

/**
 * Wraps content and blurs it behind a membership prompt when `locked` is true.
 * The primary action comes from useConversionAction — create an account,
 * start a free trial in place, or subscribe — never a detour to /pricing;
 * "See all plans" is a secondary text link.
 */
const GatedOverlay = ({
  locked,
  title = "Members only",
  message = "Upgrade to a SkinLabs membership to see the rest.",
  feature,
  source,
  children,
}: GatedOverlayProps) => {
  const action = useConversionAction(feature, source);
  if (!locked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div aria-hidden="true" className="pointer-events-none select-none blur-md">
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 px-6 text-center backdrop-blur-sm"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
          <Lock className="h-5 w-5 text-foreground" />
        </span>
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold text-foreground">{title}</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col items-center gap-2">
          {action.unavailable ? (
            <Button disabled variant="outline">{action.label}</Button>
          ) : action.kind ? (
            <Button className="gap-2" onClick={action.run} disabled={action.busy}>
              {action.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {action.label}
            </Button>
          ) : action.busy ? (
            <Button disabled className="gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Checking your membership…
            </Button>
          ) : null}
          {action.sublabel && !action.unavailable && <p className="text-xs text-muted-foreground">{action.sublabel}</p>}
          <SeeAllPlansLink />
        </div>
      </motion.div>
    </div>
  );
};

export default GatedOverlay;
