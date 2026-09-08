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
import { useRoutine, type RoutineStep } from "@/hooks/use-routine";

const StepRow = ({
  step,
  slot,
  checked,
  onToggle,
  onRemove,
}: {
  step: RoutineStep;
  slot: "am" | "pm";
  checked: boolean;
  onToggle: () => void;
  onRemove: () => void;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-background px-3 py-2.5">
    <Checkbox checked={checked} onCheckedChange={onToggle} id={`${step.id}-${slot}`} />
    <label htmlFor={`${step.id}-${slot}`} className="min-w-0 flex-1 cursor-pointer">
      <p className={`truncate text-sm font-medium ${checked ? "text-muted-foreground line-through" : "text-foreground"}`}>
        {step.step_name}
      </p>
      {step.product_name && <p className="truncate text-xs text-muted-foreground">{step.product_name}</p>}
    </label>
    <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive" onClick={onRemove}>
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  </div>
);

const RoutineTrackerTab = () => {
  const { amSteps, pmSteps, loading, streak, todayDone, todayTotal, isChecked, addStep, removeStep, toggleCheckin } = useRoutine();
  const [draftName, setDraftName] = useState("");
  const [draftProduct, setDraftProduct] = useState("");
  const [draftTime, setDraftTime] = useState<RoutineStep["time_of_day"]>("both");
  const [adding, setAdding] = useState(false);

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
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <div>
            <CardTitle>Today's routine</CardTitle>
            <CardDescription>Tick off each step as you go — your own routine, not a fabricated one.</CardDescription>
          </div>
          {streak > 0 && (
            <Badge variant="secondary" className="gap-1.5">
              <Flame className="h-3.5 w-3.5 text-orange-500" /> {streak} day{streak === 1 ? "" : "s"}
            </Badge>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
              <span>{todayDone} of {todayTotal} steps done today</span>
              <span>{pct}%</span>
            </div>
            <Progress value={pct} />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Sun className="h-4 w-4 text-amber-500" /> Morning
              </p>
              <div className="space-y-2">
                {amSteps.length === 0 && <p className="text-xs text-muted-foreground">No AM steps yet.</p>}
                {amSteps.map((step) => (
                  <StepRow
                    key={`am-${step.id}`}
                    step={step}
                    slot="am"
                    checked={isChecked(step.id, "am")}
                    onToggle={() => toggleCheckin(step.id, "am")}
                    onRemove={() => removeStep(step.id)}
                  />
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                <Moon className="h-4 w-4 text-indigo-500" /> Evening
              </p>
              <div className="space-y-2">
                {pmSteps.length === 0 && <p className="text-xs text-muted-foreground">No PM steps yet.</p>}
                {pmSteps.map((step) => (
                  <StepRow
                    key={`pm-${step.id}`}
                    step={step}
                    slot="pm"
                    checked={isChecked(step.id, "pm")}
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
        <CardContent className="grid gap-3 sm:grid-cols-[1fr_1fr_auto_auto]">
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
              <SelectTrigger className="w-28"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="am">AM</SelectItem>
                <SelectItem value="pm">PM</SelectItem>
                <SelectItem value="both">AM & PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAdd} disabled={adding || !draftName.trim()} className="self-end">
            <Plus className="mr-1 h-4 w-4" /> Add
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoutineTrackerTab;
