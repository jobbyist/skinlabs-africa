import { useState } from "react";
import { Flame, Loader2, Plus, Sun, Moon, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import FirstCheckinNudge from "./FirstCheckinNudge";
import { useRoutine, type RoutineStep } from "@/hooks/use-routine";
import LayeringGuide from "@/components/dashboard/LayeringGuide";
import SmartRoutinePanel from "@/components/dashboard/SmartRoutinePanel";

const StepRow = ({
  step,
  slot,
  checked,
  pending,
  onToggle,
  onRemove,
}: {
  step: RoutineStep;
  slot: "am" | "pm";
  checked: boolean;
  pending: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) => (
  <div className="grid min-w-0 grid-cols-[auto,minmax(0,1fr),auto] items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
    <Checkbox checked={checked} disabled={pending} onCheckedChange={onToggle} id={`${step.id}-${slot}`} className="mt-0.5 self-start" />
    <label htmlFor={`${step.id}-${slot}`} className="min-w-0 flex-1 cursor-pointer">
      <p className={`flex min-w-0 flex-wrap items-start gap-1.5 text-sm font-medium leading-snug ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
        <span className="min-w-0 flex-1 break-words">{step.step_name}</span>
        {step.source === "smart" && <Badge variant="outline" className="shrink-0 text-[9px] px-1.5 py-0 no-underline">Smart</Badge>}
      </p>
      {step.product_name && <p className="mt-0.5 break-words text-xs leading-snug text-muted-foreground">{step.product_name}</p>}
    </label>
    <Button variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </div>
);

const RoutineTrackerTab = () => {
  const { isStarterOnly, saveStarterRoutine, amSteps, pmSteps, loading, streak, firstCheckinJustDone, dismissFirstCheckinNudge, todayDone, todayTotal, isChecked, isPending, addStep, removeStep, toggleCheckin, refresh } =
    useRoutine();
  const [draftName, setDraftName] = useState("");
  const [draftProduct, setDraftProduct] = useState("");
  const [draftTime, setDraftTime] = useState<RoutineStep["time_of_day"]>("both");
  const [adding, setAdding] = useState(false);
  const [savingStarter, setSavingStarter] = useState(false);

  const handleAdd = async () => {
    if (!draftName.trim()) return;
    setAdding(true);
    await addStep(draftName.trim(), draftTime, draftProduct.trim() || undefined);
    setAdding(false);
    setDraftName("");
    setDraftProduct("");
    setDraftTime("both");
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const pct = todayTotal > 0 ? Math.round((todayDone / todayTotal) * 100) : 0;

  return (
    <div id="routine-tracker" className="space-y-5 sm:space-y-6">
      {isStarterOnly && (
        <Card className="border-primary/30 bg-primary/[0.03]">
          <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold">This is a starter routine.</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">Edit the steps below, add your own products, then save it as your routine.</p>
            </div>
            <Button
              className="min-h-10 shrink-0"
              disabled={savingStarter}
              onClick={async () => {
                setSavingStarter(true);
                await saveStarterRoutine();
                setSavingStarter(false);
              }}
            >
              {savingStarter && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save my routine
            </Button>
          </CardContent>
        </Card>
      )}
      {firstCheckinJustDone && <FirstCheckinNudge onDone={dismissFirstCheckinNudge} />}
      <SmartRoutinePanel onSaved={() => void refresh()} />
      <Card>
        <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="min-w-0">
            <CardTitle>Today's routine</CardTitle>
            <CardDescription className="leading-relaxed">Tick off each step as you go. Steps marked Smart come from your Smart Routine; the rest are yours.</CardDescription>
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="shrink-0 gap-1.5 self-start">
              <Flame className="h-3.5 w-3.5 text-orange-500" /> {streak} day{streak === 1 ? "" : "s"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4 p-4 sm:p-6">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{todayDone} of {todayTotal} steps done today</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          <div className="grid gap-5 md:grid-cols-2 md:gap-4">
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold leading-snug text-foreground">
                <Sun className="h-4 w-4 shrink-0 text-amber-500" /> Morning
              </p>
              <div className="space-y-2">
                {amSteps.length === 0 && <p className="text-xs text-muted-foreground">No AM steps yet.</p>}
                {amSteps.map((step) => (
                  <StepRow
                    key={`am-${step.id}`}
                    step={step}
                    slot="am"
                    checked={isChecked(step.id, "am")}
                    pending={isPending(step.id, "am")}
                    onToggle={() => toggleCheckin(step.id, "am")}
                    onRemove={() => removeStep(step.id)}
                  />
                ))}
              </div>
            </div>
            <div className="min-w-0">
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold leading-snug text-foreground">
                <Moon className="h-4 w-4 shrink-0 text-indigo-500" /> Evening
              </p>
              <div className="space-y-2">
                {pmSteps.length === 0 && <p className="text-xs text-muted-foreground">No PM steps yet.</p>}
                {pmSteps.map((step) => (
                  <StepRow
                    key={`pm-${step.id}`}
                    step={step}
                    slot="pm"
                    checked={isChecked(step.id, "pm")}
                    pending={isPending(step.id, "pm")}
                    onToggle={() => toggleCheckin(step.id, "pm")}
                    onRemove={() => removeStep(step.id)}
                  />
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add a routine step</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto_auto] sm:p-6">
          <div>
            <Label className="text-xs">Step</Label>
            <Input value={draftName} onChange={(e) => setDraftName(e.target.value)} placeholder="e.g. Vitamin C serum" />
          </div>
          <div>
            <Label className="text-xs">Product (optional)</Label>
            <Input value={draftProduct} onChange={(e) => setDraftProduct(e.target.value)} placeholder="Brand & product" />
          </div>
          <div>
            <Label className="text-xs">When</Label>
            <Select value={draftTime} onValueChange={(v) => setDraftTime(v as RoutineStep["time_of_day"])}>
              <SelectTrigger className="w-full sm:w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="am">AM</SelectItem>
                <SelectItem value="pm">PM</SelectItem>
                <SelectItem value="both">AM & PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={adding || !draftName.trim()} className="w-full self-end sm:w-auto">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>
      <LayeringGuide amSteps={amSteps} pmSteps={pmSteps} />
    </div>
  );
};

export default RoutineTrackerTab;
