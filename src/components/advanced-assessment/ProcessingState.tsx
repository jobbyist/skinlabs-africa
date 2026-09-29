import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Product language, never model names (section 33) — SKYNN is the product
// surface. SKYNN AI v2 really does run these as separate stages in the
// background worker (intake -> safety -> scoring -> fairness -> reasoning ->
// writing -> QA), but the member can't see per-stage progress, so this is a
// paced affordance, not a live progress bar.
const STAGES = [
  "Reading your answers",
  "Running safety checks",
  "Calculating your scores",
  "Tailoring guidance to your skin tone",
  "Matching guidance to published evidence",
  "Writing your report",
  "Running quality and compliance checks",
];

const ProcessingState = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6">
      <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500">
        <Loader2 className="h-6 w-6 text-white animate-spin" />
      </div>
      <div>
        <p className="text-lg font-heading font-semibold gradient-text">SKYNN AI is building your report</p>
        <p className="text-sm text-muted-foreground mt-2">{STAGES[stageIndex]}...</p>
      </div>
      <div className="flex justify-center gap-1.5">
        {STAGES.map((stage, idx) => (
          <div key={stage} className={"h-1.5 w-6 rounded-full transition-colors " + (idx <= stageIndex ? "bg-primary" : "bg-secondary")} />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">
        This usually takes a few minutes. Every report is then checked by the SkinLabs team before it&apos;s released —
        you can close this page, and we&apos;ll email you when yours is ready.
      </p>
    </div>
  );
};

export default ProcessingState;
