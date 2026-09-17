import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

// Product language, never "Claude is thinking..." (section 33) — SKYNN is
// the product surface, the model is an implementation detail. Generation is
// actually one synchronous request/response (see the edge function's
// documented lack of a background worker), so these stages are a paced UI
// affordance rather than a literal 1:1 mapping to separate model calls —
// intentionally, per section 33's "do not imply... unless it does".
const STAGES = [
  "Reviewing your skin profile",
  "Understanding your concerns",
  "Analysing your routine",
  "Building your personalised recommendations",
  "Preparing your report",
];

const ProcessingState = () => {
  const [stageIndex, setStageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setStageIndex((i) => Math.min(i + 1, STAGES.length - 1));
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-md mx-auto text-center py-16 space-y-6">
      <div className="mx-auto h-14 w-14 rounded-full flex items-center justify-center bg-gradient-to-br from-emerald-500 via-blue-500 to-purple-500">
        <Loader2 className="h-6 w-6 text-white animate-spin" />
      </div>
      <div>
        <p className="text-lg font-heading font-semibold gradient-text">SKYNN is analysing your profile</p>
        <p className="text-sm text-muted-foreground mt-2">{STAGES[stageIndex]}...</p>
      </div>
      <div className="flex justify-center gap-1.5">
        {STAGES.map((stage, idx) => (
          <div key={stage} className={"h-1.5 w-6 rounded-full transition-colors " + (idx <= stageIndex ? "bg-primary" : "bg-secondary")} />
        ))}
      </div>
    </div>
  );
};

export default ProcessingState;
