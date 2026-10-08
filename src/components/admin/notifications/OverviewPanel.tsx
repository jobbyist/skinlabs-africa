import { useState } from "react";
import { FlaskConical, Loader2, Minus, Plus } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { SKIP_REASON_LABEL } from "@/lib/notificationAdmin";
import { PREFERENCE_LABELS, type PreferenceCategory } from "@/lib/pwa/notificationManager";
import { useAdminCall } from "./adminRpc";

export interface Overview {
  window_days: number;
  settings: { push_enabled: boolean; default_daily_cap: number } | null;
  totals: Record<string, number>;
  skip_reasons: { reason: string | null; count: number }[];
  subscriptions: { active_devices: number; members_with_push: number; installed_members: number; by_platform: { label: string | null; count: number }[]; by_browser: { label: string | null; count: number }[] };
  opt_ins: Record<string, number>;
  daily: { day: string; enqueued: number; sent: number; clicks: number }[];
}

interface Props {
  overview: Overview | null;
  loading: boolean;
  days: number;
  onDays: (d: number) => void;
  onChanged: () => void;
}

const TOTAL_LABELS: [string, string][] = [
  ["enqueued", "Queued"],
  ["push_sent", "Push sent"],
  ["devices_delivered", "Devices reached"],
  ["clicks", "Taps"],
  ["push_skipped", "Skipped"],
  ["push_failed", "Failed"],
  ["pending", "Waiting to send"],
  ["inbox_written", "Inbox messages"],
];

const OverviewPanel = ({ overview, loading, days, onDays, onChanged }: Props) => {
  const call = useAdminCall();
  const [busy, setBusy] = useState(false);
  const [pauseOpen, setPauseOpen] = useState(false);
  const [cap, setCap] = useState<number | null>(null);

  const pushOn = overview?.settings?.push_enabled ?? true;
  const savedCap = overview?.settings?.default_daily_cap ?? 10;
  const shownCap = cap ?? savedCap;

  const setPush = async (enabled: boolean) => {
    setBusy(true);
    const result = await call("admin_set_notification_settings", { p_push_enabled: enabled });
    setBusy(false);
    if (result.ok) {
      toast.success(enabled ? "Push delivery is back on." : "Push delivery is paused.");
      onChanged();
    }
  };

  const saveCap = async () => {
    setBusy(true);
    const result = await call("admin_set_notification_settings", { p_default_daily_cap: shownCap });
    setBusy(false);
    if (result.ok) {
      toast.success(`Default daily limit is now ${shownCap}.`);
      setCap(null);
      onChanged();
    }
  };

  const sendTest = async () => {
    setBusy(true);
    const result = await call("admin_send_test_notification", {});
    setBusy(false);
    if (result.ok) toast.success("Test queued for your own devices.");
  };

  if (loading && !overview) return <Loader2 className="h-5 w-5 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />;
  if (!overview) return <p className="text-sm text-muted-foreground">The overview isn’t available right now.</p>;

  const maxDaily = Math.max(1, ...overview.daily.map((d) => d.enqueued));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery controls</CardTitle>
          <CardDescription>The global switch for push. Inbox messages are always written; only the device push stops.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
            <label htmlFor="push-kill" className="min-w-0 flex-1 cursor-pointer">
              <span className="block text-sm font-medium">Push delivery</span>
              <span className="block text-xs text-muted-foreground">{pushOn ? "On. Queued pushes are being delivered." : "Paused. Queued pushes wait, and are dropped if still unsent after 24 hours."}</span>
            </label>
            <Switch id="push-kill" checked={pushOn} disabled={busy} onCheckedChange={(next) => (next ? void setPush(true) : setPauseOpen(true))} />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border p-4">
            <div>
              <p className="text-sm font-medium">Default daily limit</p>
              <p className="text-xs text-muted-foreground">Pushes per member per day, for members who haven’t chosen their own.</p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Lower default limit" disabled={shownCap <= 0} onClick={() => setCap(shownCap - 1)}>
                <Minus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <output data-testid="default-cap" className="w-6 text-center text-sm font-medium tabular-nums">
                {shownCap}
              </output>
              <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Raise default limit" disabled={shownCap >= 10} onClick={() => setCap(shownCap + 1)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
              </Button>
              <Button size="sm" disabled={busy || cap === null || cap === savedCap} onClick={() => void saveCap()}>
                Save limit
              </Button>
            </div>
          </div>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void sendTest()} disabled={busy}>
            <FlaskConical className="h-4 w-4" aria-hidden="true" /> Send a test push to me
          </Button>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Last {overview.window_days} days</h3>
        <div role="group" aria-label="Window" className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <Button key={d} size="sm" variant={days === d ? "default" : "outline"} onClick={() => onDays(d)} aria-pressed={days === d}>
              {d} days
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {TOTAL_LABELS.map(([key, label]) => (
          <Card key={key}>
            <CardContent className="p-4">
              <p className="text-2xl font-semibold tabular-nums" data-testid={`total-${key}`}>
                {overview.totals[key] ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Why messages weren’t pushed</CardTitle>
          </CardHeader>
          <CardContent>
            {overview.skip_reasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nothing skipped in this window.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {overview.skip_reasons.map((r) => (
                  <li key={r.reason ?? "none"} className="flex justify-between py-1.5">
                    <span>{SKIP_REASON_LABEL[r.reason ?? ""] ?? r.reason ?? "Unknown"}</span>
                    <span className="tabular-nums">{r.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Devices</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold tabular-nums">{overview.subscriptions.active_devices}</span> active devices across <span className="font-semibold tabular-nums">{overview.subscriptions.members_with_push}</span> members. <span className="tabular-nums">{overview.subscriptions.installed_members}</span> members have installed the app.
            </p>
            <p className="text-xs text-muted-foreground">Platforms: {overview.subscriptions.by_platform.map((p) => `${p.label ?? "unknown"} ${p.count}`).join(" · ") || "none"}</p>
            <p className="text-xs text-muted-foreground">Browsers: {overview.subscriptions.by_browser.map((p) => `${p.label ?? "unknown"} ${p.count}`).join(" · ") || "none"}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Opt-ins</CardTitle>
          <CardDescription>Members with a saved preference row: {overview.opt_ins.members_with_preferences ?? 0}. Counts are of members who have each category on.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {(Object.keys(PREFERENCE_LABELS) as PreferenceCategory[]).map((key) => (
              <li key={key} className="flex justify-between">
                <span>{PREFERENCE_LABELS[key].label}</span>
                <span className="tabular-nums">{overview.opt_ins[key] ?? 0}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per day</CardTitle>
          <CardDescription>Queued (grey), pushed (dark) and tapped, in South African time.</CardDescription>
        </CardHeader>
        <CardContent>
          {overview.daily.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity in this window.</p>
          ) : (
            <ul className="space-y-1.5">
              {overview.daily.map((d) => (
                <li key={d.day} className="flex items-center gap-3 text-xs" aria-label={`${d.day}: ${d.enqueued} queued, ${d.sent} pushed, ${d.clicks} taps`}>
                  <span className="w-20 shrink-0 text-muted-foreground">{d.day}</span>
                  <span className="relative h-3 flex-1 overflow-hidden rounded bg-muted" aria-hidden="true">
                    <span className="absolute inset-y-0 left-0 bg-muted-foreground/30" style={{ width: `${(d.enqueued / maxDaily) * 100}%` }} />
                    <span className="absolute inset-y-0 left-0 bg-foreground/70" style={{ width: `${(d.sent / maxDaily) * 100}%` }} />
                  </span>
                  <span className="w-24 shrink-0 text-right tabular-nums">{d.sent}/{d.enqueued} · {d.clicks} taps</span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={pauseOpen} onOpenChange={setPauseOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Pause all push notifications?</AlertDialogTitle>
            <AlertDialogDescription>
              Nothing is delivered to any device while this is off. Inbox messages are still written. Pushes already queued wait, and any still unsent after 24 hours are dropped. Turn it back on from this page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep push on</AlertDialogCancel>
            <AlertDialogAction onClick={() => void setPush(false)}>Pause push</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default OverviewPanel;
