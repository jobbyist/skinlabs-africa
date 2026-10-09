import { useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";
import { cadenceForConcern, DAY_LABELS } from "@/lib/starter-analysis/resultsView";
import type { FormulaConcern } from "@/data/formulaResults";

interface WeeklyCadenceTrackerProps {
  concern: FormulaConcern;
  /** The analysis's own "Weekly Actives Schedule" text, kept readable underneath. */
  fullText: string | null;
}

/** Visual titration schedule: pacing tabs + a 7-day strip with the active days lit. */
const WeeklyCadenceTracker = ({ concern, fullText }: WeeklyCadenceTrackerProps) => {
  const phases = cadenceForConcern(concern);
  const [phaseId, setPhaseId] = useState(phases[0].id);
  const phase = phases.find((p) => p.id === phaseId) ?? phases[0];

  return (
    <section aria-labelledby="cadence-heading" className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h4 id="cadence-heading" className="font-heading font-semibold text-card-foreground">Weekly actives schedule</h4>

      <div role="tablist" aria-label="Pacing" className="grid grid-cols-3 gap-1 rounded-xl bg-muted p-1">
        {phases.map((p) => (
          <button
            key={p.id}
            type="button"
            role="tab"
            aria-selected={p.id === phaseId}
            onClick={() => setPhaseId(p.id)}
            className={cn(
              "min-h-11 rounded-lg px-1 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              p.id === phaseId ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <span className="block text-xs font-semibold">{p.tab}</span>
            <span className="block text-[11px]">{p.sub}</span>
          </button>
        ))}
      </div>

      <div role="tabpanel" className="space-y-3 animate-in fade-in-0 duration-200" key={phase.id}>
        {phase.rows.map((row) => (
          <div key={row.label}>
            <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-card-foreground">
              {row.time === "am" ? <Sun className="h-3.5 w-3.5" aria-hidden="true" /> : <Moon className="h-3.5 w-3.5" aria-hidden="true" />}
              {row.label} · {row.time === "am" ? "mornings" : "evenings"}
            </p>
            <ul className="grid grid-cols-7 gap-1.5" aria-label={`${row.label}: ${row.days.map((d) => DAY_LABELS[d]).join(", ")}`}>
              {DAY_LABELS.map((label, d) => {
                const on = row.days.includes(d);
                return (
                  <li
                    key={label}
                    className={cn(
                      "rounded-full py-2 text-center text-[11px] font-medium",
                      on ? "gradient-bg text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    <span aria-hidden="true">{label}</span>
                    <span className="sr-only">{label}{on ? " — active" : " — rest"}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
        <p className="text-sm text-muted-foreground">{phase.note}</p>
      </div>

      {fullText && <p className="border-t border-border pt-3 text-xs text-muted-foreground leading-relaxed">{fullText}</p>}
    </section>
  );
};

export default WeeklyCadenceTracker;
