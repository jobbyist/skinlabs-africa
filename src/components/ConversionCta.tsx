import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeeAllPlansLink } from "@/components/GatedOverlay";
import { useConversionAction } from "@/hooks/use-conversion-action";
import type { FeatureKey } from "@/lib/entitlements";
import { cn } from "@/lib/utils";

interface ConversionCtaProps {
  /** Omit for "Glow Insider membership" in general (e.g. unlimited briefings). */
  feature?: FeatureKey;
  source: string;
  className?: string;
  align?: "start" | "center";
  /** Hide the secondary "See all plans" link. */
  hidePlansLink?: boolean;
}

/**
 * The standard standalone conversion button: useConversionAction's one CTA
 * (create account / start trial in place / subscribe), its sublabel, and
 * "See all plans" as a secondary link. Renders nothing for an entitled viewer;
 * a VIP-only feature shows a disabled "coming soon" status instead of a button.
 */
const ConversionCta = ({ feature, source, className, align = "center", hidePlansLink = false }: ConversionCtaProps) => {
  const action = useConversionAction(feature, source);
  if (action.entitled) return null;

  return (
    <div className={cn("flex flex-col gap-2", align === "center" ? "items-center" : "items-start", className)}>
      {action.unavailable ? (
        <Button variant="outline" disabled>
          {action.label}
        </Button>
      ) : action.kind ? (
        <Button className="gap-2" onClick={action.run} disabled={action.busy}>
          {action.busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          {action.label}
        </Button>
      ) : null}
      {action.kind && action.sublabel && <p className="text-xs text-muted-foreground">{action.sublabel}</p>}
      {!hidePlansLink && <SeeAllPlansLink />}
    </div>
  );
};

export default ConversionCta;
