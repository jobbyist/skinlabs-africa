import { useCallback, useEffect, useState } from "react";
import { BellRing, CheckCircle2, Loader2, Minus, Plus, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import NotificationPreferencesList from "./NotificationPreferencesList";
import { useAuth } from "@/hooks/use-auth";
import { usePushCapability } from "@/hooks/use-push-capability";
import { IOS_HOME_SCREEN_STEPS } from "@/lib/pwa/pushCapability";
import {
  DEFAULT_DELIVERY,
  DEFAULT_PREFERENCES,
  MAX_DAILY_CAP,
  PREFERENCE_CATEGORIES,
  isConfigured,
  listMyPushDevices,
  loadAllPreferences,
  removeMyPushDevice,
  savePreferences,
  sendTestNotification,
  unsubscribe,
  type DeliveryPreferences,
  type NotificationPreferences,
  type PushDevice,
} from "@/lib/pwa/notificationManager";
import { openNotificationPrompt } from "@/lib/pwa/uiEvents";

const deviceLabel = (d: PushDevice): string => [d.browser, d.platform].filter(Boolean).join(" on ") || "Device";
const lastUsed = (d: PushDevice): string => {
  const when = d.last_used_at ?? d.created_at;
  const t = Date.parse(when);
  return Number.isFinite(t) ? new Date(t).toLocaleDateString("en-ZA", { day: "numeric", month: "short", year: "numeric" }) : "";
};

const TimeField = ({ id, label, value, onChange, disabled }: { id: string; label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) => (
  <div className="space-y-1">
    <label htmlFor={id} className="block text-xs font-medium text-muted-foreground">
      {label}
    </label>
    <input
      id={id}
      type="time"
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-50"
    />
  </div>
);

/** Dashboard → Settings → App → Notifications: every category, delivery times, quiet hours, daily cap, devices, test. */
const NotificationSettingsCard = () => {
  const { user } = useAuth();
  const { capability, loading: capabilityLoading, instructions, refresh: refreshCapability } = usePushCapability();
  const [loading, setLoading] = useState(true);
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [delivery, setDelivery] = useState<DeliveryPreferences>(DEFAULT_DELIVERY);
  const [devices, setDevices] = useState<PushDevice[]>([]);
  const [busy, setBusy] = useState(false);
  const userId = user?.id ?? null;

  const loadDevices = useCallback(async () => setDevices(await listMyPushDevices()), []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      if (userId) {
        const [loaded, list] = await Promise.all([loadAllPreferences(userId), listMyPushDevices()]);
        if (cancelled) return;
        setPrefs(loaded.categories);
        setDelivery(loaded.delivery);
        setDevices(list);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const persist = async (patch: Partial<NotificationPreferences & DeliveryPreferences>) => {
    if (!userId) return;
    const result = await savePreferences(userId, patch, Object.keys(patch));
    if (result === "failed") toast.error("Couldn’t save that change. Please try again.");
    else if (result === "queued") toast.message("You’re offline. We’ll save this when you’re back online.");
  };

  const changeCategories = (next: NotificationPreferences) => {
    const changed = PREFERENCE_CATEGORIES.filter((k) => next[k] !== prefs[k]);
    setPrefs(next);
    if (changed.length) void persist(Object.fromEntries(changed.map((k) => [k, next[k]])));
  };

  const changeDelivery = (patch: Partial<DeliveryPreferences>) => {
    setDelivery((d) => ({ ...d, ...patch }));
    void persist(patch);
  };

  const turnOff = async () => {
    setBusy(true);
    const ok = await unsubscribe();
    await Promise.all([refreshCapability(), loadDevices()]);
    setBusy(false);
    if (ok) toast.success("Notifications are off on this device.");
    else toast.error("Couldn’t turn notifications off. Please try again.");
  };

  const sendTest = async () => {
    setBusy(true);
    const result = await sendTestNotification();
    setBusy(false);
    if (result === "sent") toast.success("Test notification sent to your devices.");
    else if (result === "rate_limited") toast.message("You just sent one. Please wait a few seconds before sending another test.");
    else if (result === "no_devices") toast.error("No device is set up for notifications yet.");
    else toast.error("Couldn’t send a test notification right now.");
  };

  const removeDevice = async (device: PushDevice) => {
    setBusy(true);
    const ok = await removeMyPushDevice(device.id);
    const remaining = ok ? (await listMyPushDevices()) : devices;
    setDevices(remaining);
    // No device left on the server: this browser's own subscription (if any) is stale, so drop it too.
    if (ok && remaining.length === 0 && capability === "subscribed") await unsubscribe();
    await refreshCapability();
    setBusy(false);
    if (ok) toast.success("Device removed. It won’t get notifications any more.");
    else toast.error("Couldn’t remove that device. Please try again.");
  };

  const blocked = capability === "unsupported" || capability === "needs_install" || capability === "denied" || !isConfigured();
  const showControls = !blocked || (devices.length > 0 && capability !== "denied");

  return (
    <Card id="notification-settings">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BellRing className="h-4 w-4" aria-hidden="true" /> Notifications
        </CardTitle>
        <CardDescription>Choose what SkinLabs® can notify you about, and when. Essential account messages are on by default; offers and news are always your choice.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {capabilityLoading || loading ? (
          <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
        ) : (
          <>
            {capability === "unsupported" && <p className="text-sm text-muted-foreground">This browser can’t receive push notifications.</p>}
            {capability !== "unsupported" && !isConfigured() && <p className="text-sm text-muted-foreground">Push notifications aren’t switched on for SkinLabs® yet.</p>}
            {isConfigured() && capability === "needs_install" && (
              <div className="text-sm text-muted-foreground" role="status">
                <p>On iPhone and iPad, notifications work from the installed app. To turn them on:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {IOS_HOME_SCREEN_STEPS.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}
            {isConfigured() && capability === "denied" && (
              <div className="text-sm text-muted-foreground" role="status">
                <p>Notifications are blocked for SkinLabs® in your browser or device settings. {instructions.title}:</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5">
                  {instructions.steps.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            )}

            {isConfigured() && (capability === "ready" || capability === "subscribed") && (
              <div className="flex flex-wrap items-center gap-2">
                {capability === "subscribed" ? (
                  <>
                    <span className="inline-flex items-center gap-1.5 text-sm font-medium" role="status">
                      <CheckCircle2 className="h-4 w-4 text-primary" aria-hidden="true" /> On for this device
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => void turnOff()} disabled={busy}>
                      Turn off on this device
                    </Button>
                  </>
                ) : (
                  <Button onClick={openNotificationPrompt}>Enable notifications</Button>
                )}
              </div>
            )}

            {showControls && user && (
              <>
                <section aria-labelledby="notif-what" className="space-y-3">
                  <h4 id="notif-what" className="text-sm font-medium">
                    What to send me
                  </h4>
                  <NotificationPreferencesList value={prefs} onChange={changeCategories} idPrefix="settings-notif" detailed />
                </section>

                <section aria-labelledby="notif-when" className="space-y-4">
                  <h4 id="notif-when" className="text-sm font-medium">
                    When
                  </h4>
                  <div className="flex flex-wrap items-end gap-3">
                    <TimeField
                      id="notif-routine-time"
                      label="Routine reminder time"
                      value={delivery.routine_reminder_time ?? ""}
                      onChange={(v) => changeDelivery({ routine_reminder_time: v || null })}
                    />
                    {delivery.routine_reminder_time && (
                      <Button variant="ghost" size="sm" onClick={() => changeDelivery({ routine_reminder_time: null })}>
                        Use my routine time
                      </Button>
                    )}
                  </div>
                  <p className="-mt-2 text-xs text-muted-foreground">
                    {delivery.routine_reminder_time ? "Only used if Routine reminders are on." : "Using the time from your routine. Only used if Routine reminders are on."}
                  </p>

                  <div className="space-y-3 rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-4">
                      <label htmlFor="notif-quiet" className="min-w-0 flex-1 cursor-pointer">
                        <span className="block text-sm font-medium">Quiet hours</span>
                        <span className="block text-xs text-muted-foreground">No notifications in this window (South African time). Essential account messages can still come through.</span>
                      </label>
                      <Switch id="notif-quiet" checked={delivery.quiet_hours_enabled} onCheckedChange={(checked) => changeDelivery({ quiet_hours_enabled: checked })} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <TimeField id="notif-quiet-start" label="From" value={delivery.quiet_hours_start} disabled={!delivery.quiet_hours_enabled} onChange={(v) => v && changeDelivery({ quiet_hours_start: v })} />
                      <TimeField id="notif-quiet-end" label="Until" value={delivery.quiet_hours_end} disabled={!delivery.quiet_hours_enabled} onChange={(v) => v && changeDelivery({ quiet_hours_end: v })} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                    <div className="min-w-0 flex-1">
                      <p id="notif-cap-label" className="text-sm font-medium">
                        Daily limit
                      </p>
                      <p className="text-xs text-muted-foreground">The most notifications we’ll send you in a day. 0 pauses everything that isn’t essential.</p>
                    </div>
                    <div role="group" aria-labelledby="notif-cap-label" className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" aria-label="Fewer per day" disabled={delivery.daily_cap <= 0} onClick={() => changeDelivery({ daily_cap: delivery.daily_cap - 1 })}>
                        <Minus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                      <output aria-live="polite" data-testid="daily-cap" className="w-6 text-center text-sm font-medium tabular-nums">
                        {delivery.daily_cap}
                      </output>
                      <Button variant="outline" size="icon" className="h-8 w-8" aria-label="More per day" disabled={delivery.daily_cap >= MAX_DAILY_CAP} onClick={() => changeDelivery({ daily_cap: delivery.daily_cap + 1 })}>
                        <Plus className="h-4 w-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </section>
              </>
            )}

            {user && (
              <section aria-labelledby="notif-devices" className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 id="notif-devices" className="text-sm font-medium">
                    Your devices
                  </h4>
                  <Button variant="outline" size="sm" onClick={() => void sendTest()} disabled={busy || devices.length === 0}>
                    Send me a test
                  </Button>
                </div>
                {devices.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No device is set up for notifications yet.</p>
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {devices.map((d) => (
                      <li key={d.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                        <span className="flex min-w-0 flex-1 items-center gap-2">
                          <Smartphone className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <span className="min-w-0">
                            <span className="block truncate text-sm font-medium">{deviceLabel(d)}</span>
                            <span className="block text-xs text-muted-foreground">Last used {lastUsed(d)}</span>
                          </span>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => void removeDevice(d)} disabled={busy} aria-label={`Remove this device: ${deviceLabel(d)}`}>
                          Remove this device
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
                {devices.length > 1 && <p className="text-xs text-muted-foreground">To stop notifications on the device you’re using right now, use “Turn off on this device” above.</p>}
              </section>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationSettingsCard;
