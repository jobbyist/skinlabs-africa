import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Hourglass, Loader2, Plus, Trash2, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { addShelfItem, deleteShelfItem, listShelf, updateShelfItem, type ShelfRow } from "@/lib/shelf/db";
import {
  CHECKIN_WINDOW_DAYS, DEFAULT_ML_PER_USE, PAO_OPTIONS, SHELF_CATEGORIES, UNSTABLE_ACTIVES, addMonths, detectActives, estimateRunout,
  expiresBeforeRunout, summarisePao, type ActiveTag, type ShelfCategory,
} from "@/lib/shelf/pao";
import type { RoutineStep } from "@/hooks/use-routine";
import { haptic } from "@/lib/haptics";
import { cn } from "@/lib/utils";

const todayLocal = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const fmt = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" });
const NO_STEP = "none";

const STATE_STYLE = { ok: "bg-muted text-foreground", soon: "bg-amber-500/15 text-amber-700 dark:text-amber-300", expired: "bg-destructive/15 text-destructive" } as const;

/** Check-in counts per linked routine step: last 28 days and since the bottle was opened. */
const useCheckinCounts = (items: ShelfRow[]) => {
  const { user } = useAuth();
  const linked = items.filter((i) => i.routine_step_id);
  const ids = [...new Set(linked.map((i) => i.routine_step_id as string))];
  const earliest = linked.reduce((min, i) => (i.opened_on < min ? i.opened_on : min), todayLocal());
  return useQuery({
    queryKey: ["shelf-checkins", user?.id, ids.join(","), earliest],
    enabled: Boolean(user) && ids.length > 0,
    staleTime: 60_000,
    queryFn: async () => {
      const { data } = await supabase.from("routine_checkins").select("step_id, checkin_date").in("step_id", ids).gte("checkin_date", earliest).limit(5000);
      return data ?? [];
    },
  });
};

const ShelfPanel = ({ steps }: { steps: RoutineStep[] }) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [adding, setAdding] = useState(false);
  const { data: items, isLoading } = useQuery({ queryKey: ["shelf-items", user?.id], enabled: Boolean(user), queryFn: listShelf, staleTime: 60_000 });
  const rows = Array.isArray(items) ? items : [];
  const { data: checkins } = useCheckinCounts(rows);
  const refresh = () => qc.invalidateQueries({ queryKey: ["shelf-items", user?.id] });
  const today = todayLocal();

  const remove = useMutation({ mutationFn: deleteShelfItem, onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });
  const patch = useMutation({ mutationFn: ({ id, p }: { id: string; p: Partial<ShelfRow> }) => updateShelfItem(id, p), onSuccess: refresh, onError: (e: Error) => toast.error(e.message) });

  // Table not applied yet: say nothing rather than show a half-working feature.
  if (!user || items === "unavailable") return null;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 pb-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="min-w-0">
          <CardTitle>My skincare shelf</CardTitle>
          <CardDescription className="leading-relaxed">
            Log open bottles to see when they pass their Period After Opening (PAO), get a heads-up on actives that lose strength, and estimate when you'll run out. Your brand's own PAO and expiry date always come first.
          </CardDescription>
        </div>
        {!adding && (
          <Button size="sm" variant="outline" className="shrink-0 gap-1.5 self-start" onClick={() => setAdding(true)}>
            <Plus className="h-4 w-4" /> Add a bottle
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-3 p-4 sm:p-6">
        {adding && <AddForm steps={steps} onDone={() => { setAdding(false); void refresh(); }} onCancel={() => setAdding(false)} userId={user.id} />}
        {isLoading && <p className="text-sm text-muted-foreground">Loading your shelf…</p>}
        {!isLoading && rows.length === 0 && !adding && <p className="text-sm text-muted-foreground">Nothing on your shelf yet. Add a bottle when you open it, and check the PAO symbol (the open-jar icon with a number like 12M) on the pack.</p>}
        {rows.map((item) => {
          const pao = summarisePao(item, today);
          const step = steps.find((s) => s.id === item.routine_step_id);
          const mine = (checkins ?? []).filter((c) => c.step_id === item.routine_step_id);
          const windowStart = new Date(`${today}T00:00:00`);
          windowStart.setDate(windowStart.getDate() - CHECKIN_WINDOW_DAYS);
          const cutoff = `${windowStart.getFullYear()}-${String(windowStart.getMonth() + 1).padStart(2, "0")}-${String(windowStart.getDate()).padStart(2, "0")}`;
          const estimate = estimateRunout({
            openedOn: item.opened_on,
            today,
            sizeMl: item.size_ml,
            mlPerUse: item.amount_per_use_ml ?? DEFAULT_ML_PER_USE[item.category],
            recentCheckins: item.routine_step_id && checkins ? mine.filter((c) => c.checkin_date >= cutoff).length : null,
            checkinsSinceOpened: item.routine_step_id && checkins ? mine.filter((c) => c.checkin_date >= item.opened_on).length : null,
            usesPerWeek: item.uses_per_week,
          });
          return (
            <div key={item.id} className="min-w-0 rounded-2xl border border-border bg-background p-3.5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words text-sm font-semibold leading-snug text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">{[item.brand, SHELF_CATEGORIES.find((c) => c.value === item.category)?.label, `Opened ${fmt(item.opened_on)}`].filter(Boolean).join(" · ")}</p>
                </div>
                <Badge className={cn("shrink-0 border-transparent", STATE_STYLE[pao.state])}>
                  {pao.state === "expired" ? `Past PAO ${Math.abs(pao.daysLeft)}d` : pao.state === "soon" ? `${pao.daysLeft}d left` : `Use by ${fmt(pao.expiresOn)}`}
                </Badge>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">PAO {item.pao_months}M · label window ends {fmt(pao.expiresOn)}</p>

              {(pao.oxidised || pao.pastTypicalWindow.length > 0) && (
                <p role="alert" className="mt-2 flex items-start gap-2 rounded-xl bg-amber-500/10 p-2.5 text-xs leading-relaxed text-amber-800 dark:text-amber-200">
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>
                    {pao.oxidised ? "You marked this as changed colour or smell: replace it rather than keep using it. " : ""}
                    {pao.pastTypicalWindow.map((w) => `${w.label} is usually best used within about ${UNSTABLE_ACTIVES[w.tag].typicalMonths} months of opening (since ${fmt(w.since)}). `)}
                  </span>
                </p>
              )}

              {pao.warnings.map((w) => (
                <details key={w.tag} className="mt-2 text-xs text-muted-foreground">
                  <summary className="cursor-pointer font-medium text-foreground">{w.label}: what to watch for</summary>
                  <p className="mt-1 leading-relaxed">{w.warning} {w.sign}</p>
                </details>
              ))}

              <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
                <Hourglass className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>
                  {estimate
                    ? `About ${estimate.remainingMl} ml left at ~${estimate.usesPerWeek} uses a week (${estimate.basis === "check-ins" ? `from your last ${CHECKIN_WINDOW_DAYS} days of check-ins` : "your own estimate"}): likely finished around ${fmt(estimate.runOutOn)}.`
                    : item.size_ml ? "Link a routine step or set uses per week to estimate when you'll run out." : "Add the bottle size to estimate when you'll run out."}
                  {expiresBeforeRunout(pao.expiresOn, estimate) && " It may pass its PAO before you finish it."}
                  {step ? ` Linked to “${step.step_name}”.` : ""}
                </span>
              </p>

              <div className="mt-3 flex flex-wrap gap-2">
                {!pao.oxidised && item.actives.length > 0 && (
                  <Button size="sm" variant="outline" className="h-9" onClick={() => patch.mutate({ id: item.id, p: { looks_oxidised: true } })}>It looks or smells different</Button>
                )}
                <Button size="sm" variant="outline" className="h-9 gap-1.5" onClick={() => { haptic(); patch.mutate({ id: item.id, p: { finished_on: today } }); }}>
                  <CheckCheck className="h-3.5 w-3.5" /> Finished
                </Button>
                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground hover:text-destructive" aria-label={`Remove ${item.name}`} onClick={() => remove.mutate(item.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

const AddForm = ({ steps, userId, onDone, onCancel }: { steps: RoutineStep[]; userId: string; onDone: () => void; onCancel: () => void }) => {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<ShelfCategory>("serum");
  const [opened, setOpened] = useState(todayLocal());
  const [pao, setPao] = useState<number>(12);
  const [size, setSize] = useState("");
  const [perUse, setPerUse] = useState("");
  const [usesWeek, setUsesWeek] = useState("");
  const [stepId, setStepId] = useState(NO_STEP);
  const [picked, setPicked] = useState<ActiveTag[] | null>(null);
  const suggested = useMemo(() => detectActives(name), [name]);
  const actives = picked ?? suggested;
  const save = useMutation({
    mutationFn: () =>
      addShelfItem(userId, {
        name: name.trim(), brand: brand.trim() || null, category, actives, opened_on: opened, pao_months: pao,
        size_ml: size ? Number(size) : null, amount_per_use_ml: perUse ? Number(perUse) : null,
        uses_per_week: stepId === NO_STEP && usesWeek ? Number(usesWeek) : null, routine_step_id: stepId === NO_STEP ? null : stepId,
      }),
    onSuccess: onDone,
    onError: (e: Error) => toast.error(e.message),
  });
  const valid = name.trim().length > 0 && opened <= todayLocal() && opened >= addMonths(todayLocal(), -60);
  const toggle = (t: ActiveTag) => setPicked((cur) => { const base = cur ?? suggested; return base.includes(t) ? base.filter((x) => x !== t) : [...base, t]; });

  return (
    <form className="space-y-3 rounded-2xl border border-dashed border-border p-3.5" onSubmit={(e) => { e.preventDefault(); if (valid) save.mutate(); }}>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5"><Label htmlFor="shelf-name">Product</Label><Input id="shelf-name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} placeholder="e.g. 15% L-ascorbic acid serum" /></div>
        <div className="space-y-1.5"><Label htmlFor="shelf-brand">Brand (optional)</Label><Input id="shelf-brand" value={brand} maxLength={80} onChange={(e) => setBrand(e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label>Type</Label>
          <Select value={category} onValueChange={(v) => setCategory(v as ShelfCategory)}>
            <SelectTrigger aria-label="Product type"><SelectValue /></SelectTrigger>
            <SelectContent>{SHELF_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="shelf-opened">Date opened</Label><Input id="shelf-opened" type="date" value={opened} max={todayLocal()} onChange={(e) => setOpened(e.target.value)} /></div>
        <div className="space-y-1.5">
          <Label>Period After Opening</Label>
          <Select value={String(pao)} onValueChange={(v) => setPao(Number(v))}>
            <SelectTrigger aria-label="Period after opening"><SelectValue /></SelectTrigger>
            <SelectContent>{PAO_OPTIONS.map((m) => <SelectItem key={m} value={String(m)}>{m}M{m === 3 ? " (3 months)" : ""}</SelectItem>)}</SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5"><Label htmlFor="shelf-size">Size in ml (optional)</Label><Input id="shelf-size" inputMode="decimal" value={size} onChange={(e) => setSize(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="30" /></div>
        <div className="space-y-1.5"><Label htmlFor="shelf-peruse">ml per use (optional)</Label><Input id="shelf-peruse" inputMode="decimal" value={perUse} onChange={(e) => setPerUse(e.target.value.replace(/[^0-9.]/g, ""))} placeholder={`~${DEFAULT_ML_PER_USE[category]} typical`} /></div>
        <div className="space-y-1.5">
          <Label>Track use from</Label>
          <Select value={stepId} onValueChange={setStepId}>
            <SelectTrigger aria-label="Linked routine step"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_STEP}>I'll set uses per week</SelectItem>
              {steps.map((s) => <SelectItem key={s.id} value={s.id}>{s.step_name} ({s.time_of_day.toUpperCase()})</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        {stepId === NO_STEP && (
          <div className="space-y-1.5"><Label htmlFor="shelf-uses">Uses per week (optional)</Label><Input id="shelf-uses" inputMode="decimal" value={usesWeek} onChange={(e) => setUsesWeek(e.target.value.replace(/[^0-9.]/g, ""))} placeholder="7" /></div>
        )}
      </div>
      <div>
        <p className="mb-1.5 text-xs font-medium text-foreground">Contains an active that loses strength? {picked === null && suggested.length > 0 && <span className="font-normal text-muted-foreground">(suggested from the name — confirm)</span>}</p>
        <div className="flex flex-wrap gap-2">
          {(Object.keys(UNSTABLE_ACTIVES) as ActiveTag[]).map((t) => (
            <button key={t} type="button" aria-pressed={actives.includes(t)} data-haptic onClick={() => toggle(t)}
              className={cn("rounded-full border px-3 py-1.5 text-xs font-medium touch-manipulation", actives.includes(t) ? "border-foreground bg-foreground text-background" : "border-border bg-background text-foreground/80")}>
              {UNSTABLE_ACTIVES[t].label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="submit" size="sm" disabled={!valid || save.isPending} className="gap-1.5">{save.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />} Save bottle</Button>
        <Button type="button" size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </form>
  );
};

export default ShelfPanel;
