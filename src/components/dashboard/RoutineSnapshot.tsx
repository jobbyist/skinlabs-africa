import { Droplet, Sparkles, Sun as SunIcon, PenTool, CheckCircle2, Circle } from "lucide-react";
import { useRoutine } from "@/hooks/use-routine";
import { cn } from "@/lib/utils";

const ICONS = [Droplet, Sparkles, PenTool, SunIcon];

/** Compact AM/PM routine snapshot shown on the Overview tab, matching the icon-row pattern. */
const RoutineSnapshot = () => {
  const { steps, loading, isChecked, toggleCheckin } = useRoutine();

  if (loading || steps.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {steps.slice(0, 4).map((step, i) => {
        const slot = step.time_of_day === "pm" ? "pm" : "am";
        const done = isChecked(step.id, slot);
        const Icon = ICONS[i % ICONS.length];
        return (
          <button
            key={step.id}
            onClick={() => toggleCheckin(step.id, slot)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-2xl border p-3 text-center transition-colors",
              done ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/50",
            )}
          >
            <div className="relative">
              <Icon className={cn("h-6 w-6", done ? "text-primary" : "text-muted-foreground")} />
              {done ? (
                <CheckCircle2 className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-background text-primary" />
              ) : (
                <Circle className="absolute -right-1.5 -top-1.5 h-3.5 w-3.5 rounded-full bg-background text-muted-foreground/40" />
              )}
            </div>
            <span className="truncate text-xs font-medium text-foreground">{step.step_name}</span>
            <span className="text-[10px] uppercase text-muted-foreground">{slot}</span>
          </button>
        );
      })}
    </div>
  );
};

export default RoutineSnapshot;
