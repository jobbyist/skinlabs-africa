import { useEffect, useId, useRef } from "react";
import { Loader2, Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeeAllPlansLink } from "@/components/GatedOverlay";
import { cn } from "@/lib/utils";
import { formatUnlockDate } from "@/lib/formulator/limits";
import { trackConversionEvent } from "@/lib/analytics-events";
import { useConversionAction } from "@/hooks/use-conversion-action";
import { BASIC_LIMIT_MESSAGE, BASIC_NAME } from "@/lib/skynn/terminology";
import { trackSkynnEvent } from "@/lib/skynn/analytics";

interface ReanalysisLockedPanelProps {
  nextUnlockAt: Date | null;
  /** Where the panel is shown, for analytics. */
  source: "formulator_intro" | "formulator_save" | "dashboard";
  /** The formulator intro sits on a dark surface. */
  tone?: "default" | "inverted";
  className?: string;
}

/**
 * Shown when a Glow Explorer / Lite account has used its Basic AI Skin Analysis
 * for the current rolling 7-day window. There is deliberately no "use an
 * Analysis Pass" option: Passes are for the Advanced AI Dermatology Analysis
 * only, and save_starter_analysis() never spends one. The Re-analyse button is rendered but
 * aria-disabled (not removed), so screen-reader users hear that it exists,
 * that it's locked, and why — via aria-describedby on the unlock date.
 */
const ReanalysisLockedPanel = ({
  nextUnlockAt,
  source,
  tone = "default",
  className,
}: ReanalysisLockedPanelProps) => {
  const reasonId = useId();
  // Unlimited re-analysis is a Glow Insider perk (ai_analysis.live_weekly).
  const action = useConversionAction("ai_analysis.live_weekly", `reanalysis_locked:${source}`);
  const firedRef = useRef(false);

  useEffect(() => {
    if (firedRef.current) return;
    firedRef.current = true;
    trackConversionEvent("reanalysis_blocked", { source });
    // The formulator reports its own pre-check / save refusals; this covers the
    // intro and dashboard, where the panel itself is the first signal.
    if (source !== "formulator_save") trackSkynnEvent("skynn_basic_limit_reached", { mode: "basic", source });
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
            You've used this week's {BASIC_NAME}
          </h3>
          <p id={reasonId} className={cn("text-sm", inverted ? "text-background/80" : "text-secondary-text")}>
            {dateText ? (
              <>
                {BASIC_LIMIT_MESSAGE} Your next one is available on <strong className="font-semibold">{dateText}</strong>.
              </>
            ) : (
              `${BASIC_LIMIT_MESSAGE} Your next one will be available soon.`
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

        {action.kind && (
          <Button
            type="button"
            onClick={() => {
              trackConversionEvent("upgrade_clicked_from_formulator", { source });
              action.run();
            }}
            disabled={action.busy}
            className={cn(
              "h-auto min-h-11 gap-2 whitespace-normal py-2 text-center",
              inverted && "bg-background text-foreground hover:bg-background/90",
            )}
          >
            {action.busy ? (
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="h-4 w-4" aria-hidden="true" />
            )}
            {action.label}
          </Button>
        )}
      </div>
      {action.kind && (
        <p className={cn("text-xs", inverted ? "text-background/70" : "text-muted-foreground")}>
          Unlimited {BASIC_NAME} re-analysis is included with Glow Insider. {action.sublabel}
        </p>
      )}
      <SeeAllPlansLink
        className={cn(
          "text-sm underline underline-offset-4",
          inverted ? "text-background/80 hover:text-background" : "text-muted-foreground hover:text-foreground",
        )}
      />
    </div>
  );
};

export default ReanalysisLockedPanel;
