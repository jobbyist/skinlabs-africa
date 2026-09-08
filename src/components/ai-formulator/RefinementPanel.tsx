import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Sparkles, ThumbsDown, ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { priorityLabel } from "@/lib/starter-analysis/priorityEngine";
import type { ConcernKey, RefinementAccuracy, RefinementReason } from "@/lib/starter-analysis/types";

interface RefinementPanelProps {
  onSubmit: (event: { accuracy: RefinementAccuracy; reason: RefinementReason | null; otherConcern?: ConcernKey | null }) => void;
  lastAppliedAt: string | null;
}

const ACCURACY_OPTIONS: Array<{ value: RefinementAccuracy; label: string }> = [
  { value: "very_accurate", label: "Very accurate" },
  { value: "mostly_accurate", label: "Mostly accurate" },
  { value: "not_quite", label: "Not quite" },
];

const REASON_OPTIONS: Array<{ value: RefinementReason; label: string }> = [
  { value: "too_many_products", label: "Too many products" },
  { value: "too_few_products", label: "Too few products" },
  { value: "too_focused_acne", label: "Too focused on acne" },
  { value: "too_focused_pigmentation", label: "Too focused on pigmentation" },
  { value: "too_gentle", label: "Too gentle" },
  { value: "too_aggressive", label: "Too aggressive" },
  { value: "too_expensive", label: "Too expensive" },
  { value: "too_complicated", label: "Too complicated" },
  { value: "doesnt_match_skin", label: "Doesn't match my skin" },
  { value: "another_concern", label: "I have another concern" },
];

const OTHER_CONCERNS: ConcernKey[] = ["breakouts", "dryness", "dehydration", "uneven_tone", "pigmentation", "texture", "oiliness", "visible_pores"];

/**
 * Interactive Result Refinement (Section 8) — a closed chip selection, never
 * free text, so every possible answer maps to a known deterministic
 * adjustment (see refinement.ts). Re-submitting after a first refinement is
 * allowed — each submission re-runs the pipeline from the current state.
 */
const RefinementPanel = ({ onSubmit, lastAppliedAt }: RefinementPanelProps) => {
  const [accuracy, setAccuracy] = useState<RefinementAccuracy | null>(null);
  const [reason, setReason] = useState<RefinementReason | null>(null);
  const [otherConcern, setOtherConcern] = useState<ConcernKey | null>(null);

  const handleAccuracy = (value: RefinementAccuracy) => {
    setAccuracy(value);
    setReason(null);
    setOtherConcern(null);
    if (value !== "not_quite") {
      onSubmit({ accuracy: value, reason: null });
    }
  };

  const handleReason = (value: RefinementReason) => {
    setReason(value);
    if (value !== "another_concern") {
      onSubmit({ accuracy: "not_quite", reason: value });
    }
  };

  const handleOtherConcern = (concern: ConcernKey) => {
    setOtherConcern(concern);
    onSubmit({ accuracy: "not_quite", reason: "another_concern", otherConcern: concern });
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-4">
      <h4 className="font-heading font-semibold text-card-foreground">How close is this to what you need?</h4>
      <div className="flex flex-wrap gap-2">
        {ACCURACY_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleAccuracy(opt.value)}
            className={cn(
              "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full border-2 text-sm font-medium transition-all",
              accuracy === opt.value ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-primary/40",
            )}
          >
            {opt.value === "very_accurate" && <ThumbsUp className="h-3.5 w-3.5" />}
            {opt.value === "not_quite" && <ThumbsDown className="h-3.5 w-3.5" />}
            {opt.label}
          </button>
        ))}
      </div>

      <AnimatePresence>
        {accuracy === "not_quite" && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3">
            <p className="text-sm text-muted-foreground">What should we change?</p>
            <div className="flex flex-wrap gap-2">
              {REASON_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => handleReason(opt.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all",
                    reason === opt.value ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-primary/40",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {reason === "another_concern" && (
              <div className="flex flex-wrap gap-2 pt-1">
                {OTHER_CONCERNS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => handleOtherConcern(c)}
                    className={cn(
                      "px-3 py-1.5 rounded-full border-2 text-xs font-medium transition-all",
                      otherConcern === c ? "border-primary bg-accent text-accent-foreground" : "border-border hover:border-primary/40",
                    )}
                  >
                    {priorityLabel(c)}
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {lastAppliedAt && (
        <div className="flex items-center gap-2 text-xs text-primary pt-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Updated your result based on your feedback
        </div>
      )}
      {accuracy === "very_accurate" && (
        <div className="flex items-center gap-2 text-xs text-primary pt-1">
          <Sparkles className="h-3.5 w-3.5" />
          Great — glad this matched what you needed.
        </div>
      )}
    </div>
  );
};

export default RefinementPanel;
