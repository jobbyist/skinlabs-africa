/**
 * The one place that touches the Notification and Push APIs. Components call
 * these functions; none of them call `Notification.requestPermission()` or
 * `pushManager` directly.
 *
 *  - Permission is only ever requested from `requestPermission()`, which the
 *    UI calls from an explicit button press (components/pwa/NotificationPermissionPrompt.tsx).
 *  - Web Push (VAPID): the public key is `VITE_VAPID_PUBLIC_KEY` (safe in the bundle). The private key
 *    is an Edge Function secret and is never in client code.
 *  - Subscriptions are stored through the SECURITY DEFINER RPCs in
 *    20261005100000_pwa_push_and_playback.sql (RLS: members only ever touch their own rows).
 *  - Lifecycle: permission revoked → server rows removed; subscription expired/rotated → re-registered on next
 *    sync; sign-out → this device is detached from the account; several devices per member are supported.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { trackPwaEvent } from "./analytics";
import { detectBrowser, detectPlatform, readDetectionEnv } from "./detection";
import {
  markEndpointRegistered,
  PUSH_STATE_CHANGED_EVENT,
  readBrowserPermission,
  readPushInputs,
  resolvePushCapability,
} from "./pushCapability";
import { enqueueAction, queueKey, registerQueueHandler, type QueuedAction } from "./offlineQueue";
import { isNetworkError } from "./network";
import { getReadyRegistration } from "./serviceWorker";
import { local } from "./storageUtil";

/** Where in the product a push opt-in happened (a prop on the existing push events, so the funnel splits by surface). */
export type PushSurface = "welcome" | "checklist" | "settings" | "prompt" | "report_pending" | "first_checkin";

export type PermissionState = NotificationPermission | "unsupported";

export type SubscribeFailure = "unsupported" | "needs_install" | "not_configured" | "not_signed_in" | "denied" | "failed";
export type SubscribeResult = { ok: true } | { ok: false; reason: SubscribeFailure };

/** Every category a member can switch (the engine's ten). Order here is the order the Settings card shows. */
export const PREFERENCE_CATEGORIES = [
  "report_ready",
  "account_update",
  "service",
  "routine_reminder",
  "briefing",
  "skin_weather",
  "journal_reminder",
  "podcast_episode",
  "promotional",
  "price_alert",
  "community",
] as const;
export type PreferenceCategory = (typeof PREFERENCE_CATEGORIES)[number];

export type NotificationPreferences = Record<PreferenceCategory, boolean>;

/** The six the first-run permission dialog shows (the rest live in Settings → Notifications). */
export const PROMPT_CATEGORIES: readonly PreferenceCategory[] = ["podcast_episode", "briefing", "routine_reminder", "account_update", "promotional", "service"];

/** Same as the live column defaults: essential messages on, everything else (marketing most of all) off. */
export const DEFAULT_PREFERENCES: NotificationPreferences = {
  report_ready: true,
  account_update: true,
  service: true,
  routine_reminder: false,
  briefing: false,
  skin_weather: false,
  journal_reminder: false,
  podcast_episode: false,
  promotional: false,
  price_alert: false,
  community: true,
};

export interface PreferenceMeta {
  label: string;
  /** What it is, in plain language. */
  description: string;
  /** A concrete example of what arrives. Never contains health detail: lock-screen copy stays generic. */
  example: string;
  defaultOn: boolean;
}

export const PREFERENCE_LABELS: Record<PreferenceCategory, PreferenceMeta> = {
  report_ready: { label: "Report ready", description: "When your Advanced analysis is released to you.", example: "e.g. “Your SkinLabs® report is ready”", defaultOn: true },
  account_update: { label: "Account updates", description: "Membership, billing and security notices.", example: "e.g. “Your Glow Insider trial ends in 3 days”", defaultOn: true },
  service: { label: "Account and analysis updates", description: "Outages and policy changes, and a heads-up when your free Basic AI Skin Analysis is available again.", example: "e.g. “Your Basic AI Skin Analysis is ready”", defaultOn: true },
  routine_reminder: { label: "Routine reminders", description: "A nudge at your routine time, only on days you haven’t checked in.", example: "e.g. “Time for your morning routine”", defaultOn: false },
  briefing: { label: "SkinLabs® briefings", description: "When the day’s Daily Skinny briefing is published.", example: "e.g. “Today’s SkinLabs® briefing · 4 min read”", defaultOn: false },
  skin_weather: { label: "Skin weather alerts", description: "On days with high UV, very dry or hot and humid conditions in your city.", example: "e.g. “High UV today in Johannesburg”", defaultOn: false },
  journal_reminder: { label: "Progress check-ins", description: "A reminder when a progress photo is due, plus a monthly check-in on the 1st. We stop after 3 you haven't answered.", example: "e.g. “Time for a progress photo”", defaultOn: false },
  podcast_episode: { label: "New podcast episodes", description: "When a new episode of The Skin Deep is published.", example: "e.g. “New episode: Sunscreen myths”", defaultOn: false },
  promotional: { label: "Offers and news", description: "Offers and news - you can turn this off any time.", example: "e.g. “Member offer: 20% off Analysis Passes”", defaultOn: false },
  price_alert: { label: "Price alerts", description: "When a product you follow drops in price at a South African retailer.", example: "e.g. “A product you saved is cheaper at Clicks”", defaultOn: false },
  community: { label: "Community activity", description: "When someone likes or comments on your post or comment in the SkinLabs® Community. Replies stay in your inbox either way.", example: "e.g. “Cole commented on your post”", defaultOn: true },
};

/** Delivery settings, bound to the real `time` / smallint columns of notification_preferences. */
export interface DeliveryPreferences {
  quiet_hours_enabled: boolean;
  /** "HH:MM" (the column is `time`; the database returns "HH:MM:SS"). */
  quiet_hours_start: string;
  quiet_hours_end: string;
  /** 0 to 10 (a CHECK on the column). */
  daily_cap: number;
  /** null = use the time from the member's routine profile. */
  routine_reminder_time: string | null;
}

export const DEFAULT_DELIVERY: DeliveryPreferences = {
  quiet_hours_enabled: true,
  quiet_hours_start: "21:00",
  quiet_hours_end: "07:00",
  daily_cap: 10,
  routine_reminder_time: null,
};

export const MAX_DAILY_CAP = 10;
export const clampDailyCap = (n: unknown): number => {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) ? Math.max(0, Math.min(MAX_DAILY_CAP, Math.round(v))) : DEFAULT_DELIVERY.daily_cap;
};
/** "21:00:00" -> "21:00"; anything that is not a clock time -> null. */
export const toClock = (value: unknown): string | null => {
  const m = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(typeof value === "string" ? value : "");
  if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) return null;
  return `${m[1].padStart(2, "0")}:${m[2]}`;
};

type RegisterPushArgs = Database["public"]["Functions"]["register_push_subscription"]["Args"];
type UnregisterPushArgs = Database["public"]["Functions"]["unregister_push_subscription"]["Args"];

interface Deps {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { code?: string; message: string } | null }>;
  getUserId: () => Promise<string | null>;
  getRegistration: () => Promise<ServiceWorkerRegistration | null>;
}
const realDeps: Deps = {
  rpc: (fn, args) =>
    fn === "register_push_subscription"
      ? supabase.rpc("register_push_subscription", args as RegisterPushArgs)
      : supabase.rpc("unregister_push_subscription", args as UnregisterPushArgs),
  getUserId: async () => (await supabase.auth.getSession()).data.session?.user.id ?? null,
  getRegistration: getReadyRegistration,
};
let deps: Deps = realDeps;
/** Test hook: swap the backend/browser seams (pass null to restore). */
export const __setNotificationDepsForTests = (next: Partial<Deps> | null) => {
  deps = next ? { ...realDeps, ...next } : realDeps;
};

const ENABLED_KEY = "skinlabs_push_enabled_user";
export const VAPID_PUBLIC_KEY: string = (import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined)?.trim() ?? "";

/** Web Push applicationServerKey is the base64url VAPID public key as bytes. */
export const urlBase64ToUint8Array = (base64: string): Uint8Array => {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
};

export const isConfigured = (): boolean => VAPID_PUBLIC_KEY.length > 20;

/** Tell every usePushCapability() instance to re-read (subscribe / unsubscribe / re-sync happened). */
const notifyPushStateChanged = () => {
  try {
    if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new Event(PUSH_STATE_CHANGED_EVENT));
  } catch {
    /* a UI refresh hint must never fail a subscription */
  }
};

/** Thin alias of the single permission read in pushCapability.ts (kept for the manager's own call sites + tests). */
export const getPermissionState = (): PermissionState => readBrowserPermission() as PermissionState;

/** Wraps both the promise and the legacy callback form of requestPermission (older Safari). */
export const requestPermission = (surface?: PushSurface): Promise<PermissionState> => {
  if (typeof Notification === "undefined") return Promise.resolve("unsupported");
  // After a denial we never ask again (the browser would not show the dialog anyway): the UI shows re-enable steps.
  if (Notification.permission === "denied") return Promise.resolve("denied");
  // Only from a user gesture (our own soft-ask button). Where the browser exposes it, refuse a call with no live activation.
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation;
  if (activation && !activation.isActive) return Promise.resolve(Notification.permission);
  return new Promise((resolve) => {
    try {
      const result = Notification.requestPermission((p) => resolve(p));
      if (result && typeof result.then === "function") result.then(resolve, () => resolve(Notification.permission));
    } catch {
      resolve(Notification.permission);
    }
  }).then((permission) => {
    trackPwaEvent(permission === "granted" ? "push_permission_granted" : "push_permission_denied", { state: String(permission), ...(surface ? { surface } : {}) });
    return permission as PermissionState;
  });
};

/** Where no worker ever registers (dev, automation, blocked) the registration never resolves: don't wait for it forever. */
const REGISTRATION_WAIT_MS = 3_000;

export const getSubscription = async (): Promise<PushSubscription | null> => {
  try {
    const lookup = (async () => {
      const reg = await deps.getRegistration();
      return (await reg?.pushManager?.getSubscription()) ?? null;
    })();
    return await Promise.race([lookup, new Promise<null>((resolve) => setTimeout(() => resolve(null), REGISTRATION_WAIT_MS))]);
  } catch {
    return null;
  }
};

const describeDevice = () => {
  const env = readDetectionEnv();
  return { platform: detectPlatform(env), browser: detectBrowser(env) };
};

const registerWithServer = async (subscription: PushSubscription): Promise<boolean> => {
  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!json.endpoint || !p256dh || !auth) return false;
  const { platform, browser } = describeDevice();
  const { error } = await deps.rpc("register_push_subscription", {
    p_endpoint: json.endpoint,
    p_p256dh: p256dh,
    p_auth: auth,
    p_platform: platform,
    p_browser: browser,
  });
  // The server acknowledged this endpoint: this is what lets the capability resolver say "subscribed".
  markEndpointRegistered(error ? null : json.endpoint);
  notifyPushStateChanged();
  return !error;
};

/** Subscribes this device (permission must already be granted) and registers it with the signed-in member's account. */
export const subscribe = async (surface?: PushSurface): Promise<SubscribeResult> => {
  const capability = resolvePushCapability(readPushInputs(null));
  if (capability === "unsupported") return { ok: false, reason: "unsupported" };
  if (capability === "needs_install") return { ok: false, reason: "needs_install" };
  if (!isConfigured()) return { ok: false, reason: "not_configured" };
  if (getPermissionState() !== "granted") return { ok: false, reason: "denied" };
  const userId = await deps.getUserId();
  if (!userId) return { ok: false, reason: "not_signed_in" };

  try {
    const reg = await deps.getRegistration();
    if (!reg) return { ok: false, reason: "unsupported" };
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
      });
    }
    if (!(await registerWithServer(subscription))) {
      return { ok: false, reason: "failed" };
    }
    local.set(ENABLED_KEY, userId);
    trackPwaEvent("push_subscribed", surface ? { surface } : {});
    return { ok: true };
  } catch (error) {
    console.warn("[pwa] push subscribe failed:", error);
    return { ok: false, reason: "failed" };
  }
};

/** Turns notifications off for THIS device: browser subscription removed and the server row deleted. */
export const unsubscribe = async (): Promise<boolean> => {
  try {
    const subscription = await getSubscription();
    local.remove(ENABLED_KEY);
    if (!subscription) return true;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe().catch(() => false);
    await deps.rpc("unregister_push_subscription", { p_endpoint: endpoint });
    markEndpointRegistered(null);
    notifyPushStateChanged();
    trackPwaEvent("push_unsubscribed");
    return true;
  } catch {
    return false;
  }
};

/**
 * Sign-out: detach THIS device from the account on the server (so the next person using it isn't sent
 * the previous member's notifications) but leave the browser's own permission/subscription alone.
 * Best effort and time-boxed: it must never delay or block signing out.
 */
export const detachDeviceForSignOut = async (): Promise<void> => {
  if (!local.get(ENABLED_KEY)) return;
  try {
    const subscription = await Promise.race([getSubscription(), new Promise<null>((r) => setTimeout(() => r(null), 1500))]);
    if (subscription) await deps.rpc("unregister_push_subscription", { p_endpoint: subscription.endpoint });
  } catch {
    /* ignore */
  } finally {
    local.remove(ENABLED_KEY);
  }
};

/**
 * Reconciles browser and server on app start / sign-in / `pushsubscriptionchange`:
 *  - permission revoked  → drop the server row, forget the local flag
 *  - subscription gone   → re-subscribe if this member had enabled push on this device
 *  - subscription exists → re-register it (idempotent; also re-points a shared device to the current member)
 */
export const syncSubscription = async (userId: string): Promise<void> => {
  const capability = resolvePushCapability(readPushInputs(null));
  if (capability === "unsupported" || capability === "needs_install" || !isConfigured()) return;
  const permission = getPermissionState();
  if (permission === "denied") {
    if (local.get(ENABLED_KEY) === userId) {
      const subscription = await getSubscription();
      if (subscription) await deps.rpc("unregister_push_subscription", { p_endpoint: subscription.endpoint });
      local.remove(ENABLED_KEY);
    }
    return;
  }
  if (permission !== "granted") return;
  const subscription = await getSubscription();
  if (subscription) {
    await registerWithServer(subscription);
    local.set(ENABLED_KEY, userId);
  } else if (local.get(ENABLED_KEY) === userId) {
    await subscribe();
  }
};

// --- preferences ---------------------------------------------------------------

type PrefRow = Partial<NotificationPreferences & DeliveryPreferences>;
const CATEGORY_COLUMNS = PREFERENCE_CATEGORIES.join(", ");
const DELIVERY_COLUMNS = "quiet_hours_enabled, quiet_hours_start, quiet_hours_end, daily_cap, routine_reminder_time";

export const normalizePreferences = (row: PrefRow | null | undefined): NotificationPreferences => {
  const out = { ...DEFAULT_PREFERENCES };
  if (!row) return out;
  for (const key of PREFERENCE_CATEGORIES) if (typeof row[key] === "boolean") out[key] = row[key] as boolean;
  return out;
};

export const normalizeDelivery = (row: Record<string, unknown> | null | undefined): DeliveryPreferences => {
  if (!row) return { ...DEFAULT_DELIVERY };
  return {
    quiet_hours_enabled: typeof row.quiet_hours_enabled === "boolean" ? row.quiet_hours_enabled : DEFAULT_DELIVERY.quiet_hours_enabled,
    quiet_hours_start: toClock(row.quiet_hours_start) ?? DEFAULT_DELIVERY.quiet_hours_start,
    quiet_hours_end: toClock(row.quiet_hours_end) ?? DEFAULT_DELIVERY.quiet_hours_end,
    daily_cap: row.daily_cap === undefined || row.daily_cap === null ? DEFAULT_DELIVERY.daily_cap : clampDailyCap(row.daily_cap),
    routine_reminder_time: toClock(row.routine_reminder_time),
  };
};

/** Category switches + delivery settings in one read. */
export const loadAllPreferences = async (userId: string): Promise<{ categories: NotificationPreferences; delivery: DeliveryPreferences }> => {
  const { data, error } = await supabase
    .from("notification_preferences")
    .select(`${CATEGORY_COLUMNS}, ${DELIVERY_COLUMNS}`)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) console.warn("[pwa] could not load notification preferences:", error.message);
  const row = (data ?? null) as Record<string, unknown> | null;
  return { categories: normalizePreferences(row as PrefRow | null), delivery: normalizeDelivery(row) };
};

export const loadPreferences = async (userId: string): Promise<NotificationPreferences> => (await loadAllPreferences(userId)).categories;

/**
 * The upsert body. There is NO user_id in it: members hold column grants on the preference columns only, so a body that
 * names user_id (or promotional_opt_in_at) is rejected with 42501; the column default (auth.uid()) fills user_id and RLS
 * pins it to the caller. promotional_opt_in_at is NEVER written from the client: it has no client column grant and the live
 * BEFORE INSERT OR UPDATE trigger (notification_preferences_audit) stamps it when promotional turns on and clears it when off.
 */
export const preferenceRow = (prefs: PrefRow, only?: readonly string[]): Record<string, unknown> => {
  const row: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(prefs)) {
    if (key === "user_id" || key === "promotional_opt_in_at" || value === undefined) continue;
    if (only && !only.includes(key)) continue;
    row[key] = key === "routine_reminder_time" ? (value ? toClock(value) : null) : key === "daily_cap" ? clampDailyCap(value) : value;
  }
  return row;
};

export const writePreferences = (row: Record<string, unknown>) => supabase.from("notification_preferences").upsert(row as never, { onConflict: "user_id" });

/**
 * Saves preferences (categories and/or delivery settings; pass `only` to write a subset). Offline or unreachable writes are
 * queued and replayed (last write wins, so callers that edit several fields pass the full state each time).
 */
export const savePreferences = async (userId: string, prefs: PrefRow, only?: readonly string[]): Promise<"saved" | "queued" | "failed"> => {
  const row = preferenceRow(prefs, only);
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    try {
      const { error } = await writePreferences(row);
      if (!error) return "saved";
      if (!isNetworkError(error)) return "failed";
    } catch (error) {
      if (!isNetworkError(error)) return "failed";
    }
  }
  const queued = await enqueueAction({
    key: queueKey("notification_preferences", userId),
    type: "notification_preferences",
    userId,
    payload: { ...row },
  });
  return queued ? "queued" : "failed";
};

registerQueueHandler("notification_preferences", async (action: QueuedAction) => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return "retry";
  if (data.session.user.id !== action.userId) return "drop";
  const { error } = await writePreferences(preferenceRow(action.payload as PrefRow));
  if (!error) return "done";
  return isNetworkError(error) ? "retry" : "drop";
});

/** The member's push devices (SECURITY DEFINER RPC: members can't read push_subscriptions directly). */
export interface PushDevice {
  id: string;
  platform: string | null;
  browser: string | null;
  is_active: boolean;
  created_at: string;
  last_used_at: string | null;
}
export const listMyPushDevices = async (): Promise<PushDevice[]> => {
  const { data, error } = await supabase.rpc("list_my_push_devices");
  if (error) return [];
  return ((data ?? []) as PushDevice[]).filter((d) => d.is_active);
};
export const removeMyPushDevice = async (id: string): Promise<boolean> => {
  const { data, error } = await supabase.rpc("remove_my_push_device", { p_id: id });
  return !error && data === true;
};

export type TestNotificationResult = "sent" | "rate_limited" | "no_devices" | "failed";

/**
 * The member's own "Send me a test": push-send's self-test action (the engine's enqueue_notification is service-role only, and
 * the copy is the test_push template's). push-send rate-limits it to one per 15 s per member and answers 429.
 */
export const sendTestNotification = async (): Promise<TestNotificationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke("push-send", { body: { action: "test" } });
    if (error) {
      const status = (error as { context?: { status?: number } }).context?.status;
      return status === 429 ? "rate_limited" : "failed";
    }
    return (data as { sent?: number } | null)?.sent === 0 ? "no_devices" : "sent";
  } catch {
    return "failed";
  }
};
