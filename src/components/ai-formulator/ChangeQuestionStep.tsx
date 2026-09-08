import { motion } from "framer-motion";
import { CHANGE_QUESTION } from "@/data/starter-analysis/contextQuestions";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { SkinChangeStatus } from "@/lib/starter-analysis/types";

interface ChangeQuestionStepProps {
  status: SkinChangeStatus | null;
  detail: string;
  onStatusChange: (status: SkinChangeStatus) => void;
  onDetailChange: (detail: string) => void;
}

/**
 * "What's happening with your skin right now?" — the one new question from
 * Section 5 of the spec. A follow-up only appears for the handful of statuses
 * that actually have one (product/weather/recurring-triggered), and is a short
 * free-text hint rather than another multi-choice screen, so it stays a single
 * extra tap for most visitors.
 */
const ChangeQuestionStep = ({ status, detail, onStatusChange, onDetailChange }: ChangeQuestionStepProps) => {
  const selected = CHANGE_QUESTION.options.find((o) => o.value === status);

  return (
    <div className="space-y-6">
      <div className="text-center mb-4">
        <h3 className="text-xl md:text-2xl font-heading font-semibold text-card-foreground">{CHANGE_QUESTION.title}</h3>
        <p className="text-sm text-muted-foreground mt-1">This helps us avoid treating a temporary change as a fixed skin type.</p>
      </div>
      <RadioGroup value={status ?? ""} onValueChange={(val) => onStatusChange(val as SkinChangeStatus)} className="grid gap-2.5">
        {CHANGE_QUESTION.options.map((option) => (
          <div key={option.value}>
            <RadioGroupItem value={option.value} id={`change-${option.value}`} className="peer sr-only" />
            <Label
              htmlFor={`change-${option.value}`}
              className="flex items-center gap-3 p-3.5 rounded-xl border-2 border-border cursor-pointer hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent transition-all text-sm"
            >
              <span className="text-card-foreground">{option.label}</span>
            </Label>
          </div>
        ))}
      </RadioGroup>
      {selected?.followUp && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: 0.2 }} className="space-y-2">
          <Label htmlFor="change-detail" className="text-sm text-card-foreground">
            {selected.followUp.prompt}
          </Label>
          <Input
            id="change-detail"
            value={detail}
            onChange={(e) => onDetailChange(e.target.value)}
            placeholder={selected.followUp.placeholder}
            maxLength={120}
          />
        </motion.div>
      )}
    </div>
  );
};

export default ChangeQuestionStep;
