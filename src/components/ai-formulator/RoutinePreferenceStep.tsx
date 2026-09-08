import { PRIORITY_PREFERENCE_QUESTION } from "@/data/starter-analysis/contextQuestions";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { PriorityPreference } from "@/lib/starter-analysis/types";

interface RoutinePreferenceStepProps {
  value: PriorityPreference | null;
  onChange: (value: PriorityPreference) => void;
}

/**
 * "What matters most to you in a routine?" — Routine Reality Check's one
 * genuinely new question (routine complexity is instead derived from the
 * existing q13 — see normalize.ts's deriveRoutineComplexityFromQuiz).
 */
const RoutinePreferenceStep = ({ value, onChange }: RoutinePreferenceStepProps) => (
  <div className="space-y-6">
    <div className="text-center mb-4">
      <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground">{PRIORITY_PREFERENCE_QUESTION.title}</h3>
      <p className="text-sm text-muted-foreground mt-1">This shapes how we balance simplicity against results.</p>
    </div>
    <RadioGroup value={value ?? ""} onValueChange={(val) => onChange(val as PriorityPreference)} className="grid gap-3">
      {PRIORITY_PREFERENCE_QUESTION.options.map((option) => (
        <div key={option.value}>
          <RadioGroupItem value={option.value} id={`priority-pref-${option.value}`} className="peer sr-only" />
          <Label
            htmlFor={`priority-pref-${option.value}`}
            className="flex flex-col gap-0.5 p-4 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all"
          >
            <span className="font-medium text-card-foreground">{option.label}</span>
            <span className="text-xs text-muted-foreground">{option.description}</span>
          </Label>
        </div>
      ))}
    </RadioGroup>
  </div>
);

export default RoutinePreferenceStep;
