import { useMemo, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Layers, Moon, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { layerSteps } from "@/lib/layering";

type Step = { id: string; step_name: string; product_name?: string | null };

/** Step-through guide showing the right order to apply the member's own routine. */
const LayeringGuide = ({ amSteps, pmSteps }: { amSteps: Step[]; pmSteps: Step[] }) => {
  const [slot, setSlot] = useState<"am" | "pm">(new Date().getHours() < 14 ? "am" : "pm");
  const [index, setIndex] = useState(0);
  const layered = useMemo(() => layerSteps(slot === "am" ? amSteps : pmSteps, slot), [slot, amSteps, pmSteps]);
  const current = layered[Math.min(index, layered.length - 1)];

  const switchSlot = (s: "am" | "pm") => { setSlot(s); setIndex(0); };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="p-4 pb-3 sm:p-6 sm:pb-3">
        <CardTitle className="flex items-center gap-2 text-base"><Layers className="h-4 w-4 text-primary" /> Layering guide</CardTitle>
        <CardDescription>The order to apply your steps, thinnest to thickest. General guidance, not medical advice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 p-4 sm:p-6">
        <div className="flex w-full max-w-full overflow-x-auto rounded-full border border-border p-1 sm:w-auto" role="tablist">
          {(["am", "pm"] as const).map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={slot === s}
              onClick={() => switchSlot(s)}
              className={cn("flex min-h-9 shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors", slot === s ? "bg-primary text-primary-foreground" : "text-muted-foreground")}
            >
              {s === "am" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />} {s === "am" ? "Morning" : "Evening"}
            </button>
          ))}
        </div>

        {layered.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add steps to your routine to see the order.</p>
        ) : (
          <>
            <ol className="flex flex-wrap gap-1.5">
              {layered.map((s, i) => (
                <li key={s.id}>
                  <button
                    onClick={() => setIndex(i)}
                    aria-current={i === index}
                    className={cn("rounded-full border px-2.5 py-1 text-xs transition-colors", i === index ? "border-primary bg-accent font-medium text-foreground" : "border-border text-muted-foreground", s.warning && "border-destructive/50")}
                  >
                    {i + 1}. {s.label}
                  </button>
                </li>
              ))}
            </ol>

            {current && (
              <div key={current.id} className="animate-in fade-in rounded-xl border border-border bg-muted/30 p-4 duration-200">
                <p className="text-xs text-muted-foreground">Step {index + 1} of {layered.length}</p>
                <p className="mt-1 text-sm font-semibold">{current.label}{current.product ? ` · ${current.product}` : ""}</p>
                <p className="mt-1.5 text-sm text-foreground/80">{current.tip}</p>
                {current.warning && (
                  <p className="mt-2 flex items-start gap-1.5 text-xs text-destructive"><AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />{current.warning}</p>
                )}
                <div className="mt-3 flex justify-between">
                  <Button size="sm" variant="ghost" disabled={index === 0} onClick={() => setIndex((i) => i - 1)} className="gap-1"><ChevronLeft className="h-3.5 w-3.5" /> Back</Button>
                  <Button size="sm" variant="outline" disabled={index >= layered.length - 1} onClick={() => setIndex((i) => i + 1)} className="gap-1">Next <ChevronRight className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default LayeringGuide;
