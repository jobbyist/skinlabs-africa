import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, Plus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { buildAudience, describeAudience, emptyAudience, formatSast, type AudienceForm } from "@/lib/notificationAdmin";
import { toClock } from "@/lib/pwa/notificationManager";
import { useAdminCall } from "./adminRpc";
import AudienceBuilder from "./AudienceBuilder";

interface Automation {
  id: string;
  key: string;
  name: string;
  description: string | null;
  trigger_kind: string;
  frequency: string | null;
  send_time: string | null;
  weekday: number | null;
  month_day: number | null;
  template_key: string | null;
  audience: unknown;
  system: boolean;
  enabled: boolean;
  last_run_at: string | null;
  last_run_count: number | null;
  stats?: { enqueued: number; sent: number; skipped: number; clicks: number };
  template?: { title: string; body: string; category: string } | null;
}

interface TemplateOption {
  key: string;
  name: string;
  enabled: boolean;
}

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const KEY_PATTERN = /^[a-z0-9_]{3,60}$/;

const scheduleLabel = (a: Automation): string => {
  if (a.trigger_kind === "event") return "When it happens";
  if (a.trigger_kind === "lifecycle") return "At a point in the member’s journey";
  if (a.frequency === "per_member_time") return "At each member’s own routine time";
  const time = toClock(a.send_time) ?? "—";
  if (a.frequency === "weekly") return `Every ${WEEKDAYS[(a.weekday ?? 1) - 1] ?? "week"} at ${time} SAST`;
  if (a.frequency === "monthly") return `Day ${a.month_day ?? 1} of each month at ${time} SAST`;
  return `Every day at ${time} SAST`;
};

const AutomationsPanel = ({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) => {
  const call = useAdminCall();
  const [items, setItems] = useState<Automation[] | null>(null);
  const [templates, setTemplates] = useState<TemplateOption[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [runTarget, setRunTarget] = useState<Automation | null>(null);
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    const [a, t] = await Promise.all([call<Automation[]>("admin_list_notification_automations", { p_days: 30 }), call<TemplateOption[]>("admin_list_notification_templates")]);
    setItems(a.ok ? a.data : []);
    setTemplates(t.ok ? t.data : []);
  }, [call]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  const update = async (a: Automation, patch: Record<string, unknown>, done?: string) => {
    setBusy(a.key);
    const result = await call("admin_update_notification_automation", { p_key: a.key, ...patch } as never);
    setBusy(null);
    if (result.ok) {
      if (done) toast.success(done);
      await load();
      onChanged();
    }
  };

  const runNow = async () => {
    if (!runTarget) return;
    setBusy(runTarget.key);
    const result = await call<number>("admin_run_notification_automation_now", { p_key: runTarget.key });
    setBusy(null);
    if (result.ok) {
      toast.success(`Ran “${runTarget.name}”: ${result.data} queued.`);
      setRunTarget(null);
      await load();
      onChanged();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">Automations send a template on a schedule or when something happens. System ones are built in: you can switch them on or off and change when they run. Anything you create starts switched off.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New scheduled automation
        </Button>
      </div>

      {items === null ? (
        <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No automations.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((a) => {
            const timed = !a.system || a.frequency === "daily" || a.frequency === "weekly" || a.frequency === "monthly";
            const editable = a.trigger_kind === "schedule" && (a.frequency === "daily" || a.frequency === "weekly" || a.frequency === "monthly");
            return (
              <li key={a.key} data-testid="automation-row" data-key={a.key}>
                <Card>
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold">{a.name}</p>
                          {a.system && <Badge variant="secondary">System</Badge>}
                          <Badge variant="outline">{a.trigger_kind}</Badge>
                        </div>
                        {a.description && <p className="mt-0.5 text-xs text-muted-foreground">{a.description}</p>}
                        <p className="mt-1 text-xs text-muted-foreground">{scheduleLabel(a)} · {describeAudience(a.audience)}</p>
                        {a.template && (
                          <p className="mt-1 text-xs">
                            <span className="text-muted-foreground">Sends:</span> “{a.template.title}” <span className="text-muted-foreground">({a.template.category})</span>
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <label htmlFor={`auto-${a.key}`} className="text-xs text-muted-foreground">
                          {a.enabled ? "On" : "Off"}
                        </label>
                        <Switch id={`auto-${a.key}`} aria-label={`${a.name}: enabled`} checked={a.enabled} disabled={busy === a.key} onCheckedChange={(enabled) => void update(a, { p_enabled: enabled }, `${a.name} is ${enabled ? "on" : "off"}.`)} />
                      </div>
                    </div>

                    {editable && timed && (
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="space-y-1">
                          <Label htmlFor={`time-${a.key}`} className="text-xs">
                            Send at (SAST)
                          </Label>
                          <Input id={`time-${a.key}`} type="time" defaultValue={toClock(a.send_time) ?? ""} className="h-9 w-32" onBlur={(e) => e.target.value && e.target.value !== toClock(a.send_time) && void update(a, { p_send_time: e.target.value }, "Time updated.")} />
                        </div>
                        {a.frequency === "weekly" && (
                          <div className="space-y-1">
                            <Label htmlFor={`wd-${a.key}`} className="text-xs">
                              Day
                            </Label>
                            <select id={`wd-${a.key}`} defaultValue={a.weekday ?? 1} onChange={(e) => void update(a, { p_weekday: Number(e.target.value) }, "Day updated.")} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                              {WEEKDAYS.map((d, i) => (
                                <option key={d} value={i + 1}>
                                  {d}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        {a.frequency === "monthly" && (
                          <div className="space-y-1">
                            <Label htmlFor={`md-${a.key}`} className="text-xs">
                              Day of month (1-28)
                            </Label>
                            <Input id={`md-${a.key}`} type="number" min={1} max={28} defaultValue={a.month_day ?? 1} className="h-9 w-24" onBlur={(e) => Number(e.target.value) >= 1 && Number(e.target.value) <= 28 && Number(e.target.value) !== a.month_day && void update(a, { p_month_day: Number(e.target.value) }, "Day updated.")} />
                          </div>
                        )}
                        {!a.system && (
                          <div className="space-y-1">
                            <Label htmlFor={`tpl-${a.key}`} className="text-xs">
                              Template
                            </Label>
                            <select id={`tpl-${a.key}`} defaultValue={a.template_key ?? ""} onChange={(e) => void update(a, { p_template_key: e.target.value }, "Template updated.")} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
                              {templates.map((t) => (
                                <option key={t.key} value={t.key}>
                                  {t.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3 text-xs text-muted-foreground">
                      <span>
                        Last 30 days: {a.stats?.enqueued ?? 0} queued · {a.stats?.sent ?? 0} pushed · {a.stats?.skipped ?? 0} skipped · {a.stats?.clicks ?? 0} taps
                        {a.last_run_at && ` · last run ${formatSast(a.last_run_at)} (${a.last_run_count ?? 0})`}
                      </span>
                      {a.trigger_kind === "schedule" && (
                        <Button variant="outline" size="sm" className="gap-1" disabled={!a.enabled || busy === a.key} onClick={() => setRunTarget(a)} aria-label={`Run now: ${a.name}`}>
                          <Play className="h-3.5 w-3.5" aria-hidden="true" /> Run now
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </li>
            );
          })}
        </ul>
      )}

      <AlertDialog open={runTarget !== null} onOpenChange={(open) => !open && busy === null && setRunTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run “{runTarget?.name}” now?</AlertDialogTitle>
            <AlertDialogDescription>It queues this automation’s messages immediately for everyone it applies to, outside its usual schedule. Members who have switched the category off, or are in quiet hours or over their daily limit, are skipped as usual.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not now</AlertDialogCancel>
            <Button onClick={() => void runNow()} disabled={busy !== null}>
              {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : "Run now"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CreateAutomationDialog open={creating} onOpenChange={setCreating} templates={templates} onCreated={async () => { setCreating(false); await load(); onChanged(); }} />
    </div>
  );
};

const CreateAutomationDialog = ({ open, onOpenChange, templates, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; templates: TemplateOption[]; onCreated: () => void }) => {
  const call = useAdminCall();
  const [key, setKey] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("daily");
  const [time, setTime] = useState("09:00");
  const [weekday, setWeekday] = useState(1);
  const [monthDay, setMonthDay] = useState(1);
  const [templateKey, setTemplateKey] = useState("");
  const [audience, setAudience] = useState<AudienceForm>(emptyAudience());
  const [busy, setBusy] = useState(false);

  const valid = KEY_PATTERN.test(key) && name.trim() !== "" && templateKey !== "" && /^\d{2}:\d{2}$/.test(time);

  const create = async () => {
    setBusy(true);
    const result = await call("admin_create_notification_automation", {
      p_key: key,
      p_name: name.trim(),
      p_description: description.trim(),
      p_frequency: frequency,
      p_send_time: time,
      p_template_key: templateKey,
      p_audience: buildAudience(audience) as never,
      p_weekday: frequency === "weekly" ? weekday : undefined,
      p_month_day: frequency === "monthly" ? monthDay : undefined,
    });
    setBusy(false);
    if (result.ok) {
      toast.success("Automation created. It is switched off until you turn it on.");
      setKey("");
      setName("");
      setDescription("");
      onCreated();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New scheduled automation</DialogTitle>
          <DialogDescription>Sends a template to an audience on a schedule. It starts switched off.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="na-key">Key (lowercase letters, numbers, underscores)</Label>
            <Input id="na-key" value={key} onChange={(e) => setKey(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-name">Name</Label>
            <Input id="na-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="na-desc">Description</Label>
            <Input id="na-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-freq">How often</Label>
            <select id="na-freq" value={frequency} onChange={(e) => setFrequency(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="na-time">At (SAST)</Label>
            <Input id="na-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>
          {frequency === "weekly" && (
            <div className="space-y-1.5">
              <Label htmlFor="na-weekday">Day of the week</Label>
              <select id="na-weekday" value={weekday} onChange={(e) => setWeekday(Number(e.target.value))} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {WEEKDAYS.map((d, i) => (
                  <option key={d} value={i + 1}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          )}
          {frequency === "monthly" && (
            <div className="space-y-1.5">
              <Label htmlFor="na-monthday">Day of the month (1-28)</Label>
              <Input id="na-monthday" type="number" min={1} max={28} value={monthDay} onChange={(e) => setMonthDay(Number(e.target.value))} />
            </div>
          )}
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="na-template">Template to send</Label>
            <select id="na-template" value={templateKey} onChange={(e) => setTemplateKey(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="">Choose a template…</option>
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-sm font-medium">Audience</p>
          <AudienceBuilder value={audience} onChange={setAudience} idPrefix="na-aud" />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void create()} disabled={!valid || busy}>
            {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : "Create automation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AutomationsPanel;
