import { Check } from "lucide-react";

const STEP_LABELS = ["Contact", "Products", "Formulation", "Branding", "Packaging", "Timeline", "Review"] as const;

interface QuoteStepperProps {
  step: number; // 1-indexed
}

const QuoteStepper = ({ step }: QuoteStepperProps) => (
  <div className="mb-10">
    <div
      className="flex items-center justify-center gap-1 sm:gap-2 flex-wrap"
      aria-label={`Step ${step} of ${STEP_LABELS.length}: ${STEP_LABELS[step - 1]}`}
    >
      {STEP_LABELS.map((label, idx) => {
        const stepNum = idx + 1;
        const state = stepNum < step ? "done" : stepNum === step ? "current" : "upcoming";
        return (
          <div key={label} className="flex items-center gap-1 sm:gap-2">
            <div className="flex flex-col items-center gap-1">
              <div
                className={
                  "h-6 w-6 sm:h-7 sm:w-7 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 transition-colors " +
                  (state === "done"
                    ? "bg-primary text-primary-foreground"
                    : state === "current"
                      ? "bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500 text-white shadow-md shadow-primary/20"
                      : "bg-secondary text-muted-foreground")
                }
              >
                {state === "done" ? <Check className="h-3 w-3" /> : stepNum}
              </div>
              <span
                className={
                  "hidden sm:block text-[10px] uppercase tracking-wide whitespace-nowrap " +
                  (state === "current"
                    ? "font-semibold text-foreground"
                    : state === "upcoming"
                      ? "text-muted-foreground/60"
                      : "text-muted-foreground")
                }
              >
                {label}
              </span>
            </div>
            {stepNum < STEP_LABELS.length && (
              <div className={"h-px w-3 sm:w-6 -mt-4 sm:-mt-4 " + (stepNum < step ? "bg-primary" : "bg-border")} />
            )}
          </div>
        );
      })}
    </div>
    <p className="sm:hidden text-center text-xs font-medium text-muted-foreground mt-2">{STEP_LABELS[step - 1]}</p>
  </div>
);

export default QuoteStepper;
