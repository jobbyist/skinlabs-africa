import { Check } from "lucide-react";

const PHASES = ["Consent", "Profile", "Assessment", "Results"] as const;

interface StepperHeaderProps {
  /** 1-indexed current phase (1 = Consent .. 4 = Results). */
  phase: 1 | 2 | 3 | 4;
}

/**
 * Compact 4-phase progress stepper shown across the SKYNN AI (beta) consent, photo,
 * MST and profile-question screens — mirrors the beta reference design's persistent
 * "where am I in this flow" affordance without inventing a dashboard/sidebar that
 * doesn't otherwise exist in the app.
 */
const StepperHeader = ({ phase }: StepperHeaderProps) => (
  <div className="flex items-center justify-center gap-1.5 sm:gap-2 mb-8" aria-label={`Step ${phase} of 4: ${PHASES[phase - 1]}`}>
    {PHASES.map((label, idx) => {
      const stepNum = idx + 1;
      const state = stepNum < phase ? "done" : stepNum === phase ? "current" : "upcoming";
      return (
        <div key={label} className="flex items-center gap-1.5 sm:gap-2">
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={
                "h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors " +
                (state === "done"
                  ? "bg-primary text-primary-foreground"
                  : state === "current"
                    ? "border-2 border-primary text-primary bg-background"
                    : "bg-secondary text-muted-foreground")
              }
            >
              {state === "done" ? <Check className="h-3.5 w-3.5" /> : stepNum}
            </div>
            <span
              className={
                "text-[10px] uppercase tracking-wide whitespace-nowrap " +
                (state === "upcoming" ? "text-muted-foreground/60" : "text-muted-foreground")
              }
            >
              {label}
            </span>
          </div>
          {stepNum < PHASES.length && <div className={"h-px w-4 sm:w-8 -mt-4 " + (stepNum < phase ? "bg-primary" : "bg-border")} />}
        </div>
      );
    })}
  </div>
);

export default StepperHeader;
