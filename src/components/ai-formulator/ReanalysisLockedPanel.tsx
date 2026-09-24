import { useEffect, useId, useRef } from "react";
import { Link } from "react-router-dom";
import { Lock, RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatUnlockDate } from "@/lib/formulator/limits";
import { trackConversionEvent } from "@/lib/analytics-events";
import { useInsiderMonthlyPrice } from "@/hooks/use-formulator-allowance";

interface ReanalysisLockedPanelProps {
  nextUnlockAt: Date | null;
  /** Where the panel is shown, for analytics. */
  source: "formulator_intro" | "formulator_save" | "dashboard";
  /** Purchased Analysis Passes the user could spend instead of waiting. */
  passBalance?: number;
  onUsePass?: () => void;
  /** The formulator intro sits on a dark surface. */
  tone?: "default" | "inverted";
  className?: string;
}

/**
 * Shown when a Glow Explorer / Lite account has used its free starter analysis
 * for the current rolling window. The Re-analyse button is rendered but
 * aria-disabled (not removed), so screen-reader users hear that it exists,
 * that it's locked, and why — via aria-describedby on the unlock date.
 */
const ReanalysisLockedPanel = ({
  nextUnlockAt,
  source,
  passBalance = 0,
  onUsePass,
  tone = "default",
  className,
}: ReanalysisLockedPanelProps) => {
  const reasonId = useId();
  const price = useInsiderMonthlyPrice();
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackConversionEvent("reanalysis_blocked", { source });
  }, [source]);

  const inverted = tone === "inverted";
  const dateText = nextUnlockAt ? formatUnlockDate(nextUnlockAt) : null;

  return (
    <div
      className={cn(
        "rounded-2xl border p-5 sm:p-6 space-y-4",
        inverted ? "border-background/20 bg-background/5" : "border-border bg-card",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
            inverted ? "bg-background/10" : "bg-brand-cream text-brand-cream-foreground",
          )}
          aria-hidden="true"
        >
          <Lock className="h-5 w-5" />
        </span>
        <div className="space-y-1">
          <h3 className={cn("font-heading font-semibold", inverted ? "text-background" : "text-card-foreground")}>
            You've used your free analysis
          </h3>
          <p id={reasonId} className={cn("text-sm", inverted ? "text-background/80" : "text-secondary-text")}>
            {dateText ? (
              <>
                Your next free analysis is available on <strong className="font-semibold">{dateText}</strong>.
              </>
            ) : (
              "Your next free analysis will be available soon."
            )}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <Button
          type="button"
          variant="outline"
          aria-disabled="true"
          aria-describedby={reasonId}
          onClick={(e) => e.preventDefault()}
          className={cn(
            "min-h-11 gap-2 cursor-not-allowed opacity-60 active:scale-100",
            inverted && "border-background/30 bg-transparent text-background hover:bg-transparent hover:text-background",
          )}
        >
          <Lock className="h-4 w-4" aria-hidden="true" />
          Re-analyse
          <span className="sr-only">(locked)</span>
        </Button>

        {passBalance > 0 && onUsePass && (
          <Button type="button" variant="secondary" onClick={onUsePass} className="min-h-11 gap-2">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Use an Analysis Pass ({passBalance})
          </Button>
        )}

        <Button
          asChild
          className={cn(
            "h-auto min-h-11 gap-2 whitespace-normal py-2 text-center",
            inverted && "bg-background text-foreground hover:bg-background/90",
          )}
        >
          <Link
            to="/pricing"
            onClick={() => trackConversionEvent("upgrade_clicked_from_formulator", { source })}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            Unlimited re-analysis with Glow Insider{price !== null ? ` · R${price}/mo` : ""}
          </Link>
        </Button>
      </div>
    </div>
  );
};

export default ReanalysisLockedPanel;
