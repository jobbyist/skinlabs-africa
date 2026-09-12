import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { STEP_META, TOTAL_STEPS } from "./formTypes";

interface FormProgressProps {
  step: number;
}

const FormProgress = ({ step }: FormProgressProps) => {
  const current = STEP_META[step - 1];

  return (
    <div className="w-full">
      <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
        Step {step} of {TOTAL_STEPS} — {current.title}
      </p>
      <div
        role="progressbar"
        aria-valuenow={step}
        aria-valuemin={1}
        aria-valuemax={TOTAL_STEPS}
        aria-label={`Application progress: step ${step} of ${TOTAL_STEPS}, ${current.title}`}
        className="mt-2 flex gap-1"
      >
        {Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1).map((s) => (
          <span
            key={s}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-colors",
              s < step ? "bg-primary" : s === step ? "bg-primary" : "bg-border",
            )}
          />
        ))}
      </div>
      <span className="sr-only">
        {STEP_META.map((m, i) => `${i + 1 < step ? "Completed: " : i + 1 === step ? "Current: " : "Upcoming: "}${m.title}`).join(". ")}
      </span>
    </div>
  );
};

export const StepCompleteIcon = Check;
export default FormProgress;
