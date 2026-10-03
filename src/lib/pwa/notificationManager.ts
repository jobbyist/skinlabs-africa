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
import { trackPwaEvent } from "./analytics";
import { detectBrowser, detectPlatform, detectPushSupport, readCapabilityProbe, readDetectionEnv } from "./detection";
import { enqueueAction, queueKey, registerQueueHandler, type QueuedAction } from "./offlineQueue";
import { isNetworkError } from "./network";
import { getReadyRegistration } from "./serviceWorker";
import { local } from "./storageUtil";
import { isMissingBackend, untypedSupabase } from "./untypedSupabase";
import { NOTIFICATION_CATEGORIES, type NotificationCategory } from "./pushPayload";

export type PermissionState = NotificationPermission | "unsupported";

export type SubscribeFailure = "unsupported" | "needs_install" | "not_configured" | "not_signed_in" | "denied" | "failed";
export type SubscribeResult = { ok: true } | { ok: false; reason: SubscribeFailure };

export interface NotificationPreferences {
  podcast_episode: boolean;
  briefing: boolean;
  routine_reminder: boolean;
  account_update: boolean;
  promotional: boolean;
  service: boolean;
}

/** Defaults for a member who has not chosen: essential messages on, everything else (marketing most of all) off. */
export const DEFAULT_PREFERENCES: NotificationPreferences = {
  podcast_episode: false,
  briefing: false,
  routine_reminder: false,
  account_update: true,
  promotional: false,
  service: true,
};

export const PREFERENCE_LABELS: Record<NotificationCategory, { label: string; description: string }> = {
  podcast_episode: { label: "New podcast episodes", description: "When a new episode of The Skin Deep is published." },
  briefing: { label: "SkinLabs® briefings", description: "When a new Daily Skinny briefing is published." },
  routine_reminder: { label: "Routine reminders", description: "A nudge at your preferred routine time." },
  account_update: { label: "Account updates", description: "Membership, billing and security notices." },
  promotional: { label: "Offers and promotions", description: "Occasional offers. Off unless you turn it on." },
  service: { label: "Important service notices", description: "Outages, policy changes and other things you need to know." },
};

interface Deps {
  rpc: (fn: string, args: Record<string, unknown>) => PromiseLike<{ error: { code?: string; message: string } | null }>;
  getUserId: () => Promise<string | null>;
  getRegistration: () => Promise<ServiceWorkerRegistration | null>;
}
const realDeps: Deps = {
  rpc: (fn, args) => untypedSupabase.rpc(fn, args),
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

export const getPushSupport = () => detectPushSupport(readDetectionEnv(), readCapabilityProbe());
export const isSupported = (): boolean => getPushSupport().supported;

export const getPermissionState = (): PermissionState => (typeof Notification === "undefined" ? "unsupported" : Notification.permission);

/** Wraps both the promise and the legacy callback form of requestPermission (older Safari). */
export const requestPermission = (): Promise<PermissionState> => {
  if (typeof Notification === "undefined") return Promise.resolve("unsupported");
  return new Promise((resolve) => {
    try {
      const result = Notification.requestPermission((p) => resolve(p));
      if (result && typeof result.then === "function") result.then(resolve, () => resolve(Notification.permission));
    } catch {
      resolve(Notification.permission);
    }
  }).then((permission) => {
    trackPwaEvent(permission === "granted" ? "push_permission_granted" : "push_permission_denied", { state: String(permission) });
    return permission as PermissionState;
  });
};

export const getSubscription = async (): Promise<PushSubscription | null> => {
  try {
    const reg = await deps.getRegistration();
    return (await reg?.pushManager?.getSubscription()) ?? null;
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
  return !error;
};

/** Subscribes this device (permission must already be granted) and registers it with the signed-in member's account. */
export const subscribe = async (): Promise<SubscribeResult> => {
  const support = getPushSupport();
  if (!support.supported) return { ok: false, reason: support.requiresInstall ? "needs_install" : "unsupported" };
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
    trackPwaEvent("push_subscribed");
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
  if (!isSupported() || !isConfigured()) return;
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

/** Whether this device is currently receiving pushes for the signed-in member. */
export const isEnabledOnThisDevice = async (): Promise<boolean> => getPermissionState() === "granted" && (await getSubscription()) !== null;

// --- preferences ---------------------------------------------------------------

type PrefRow = Partial<NotificationPreferences>;

export const normalizePreferences = (row: PrefRow | null | undefined): NotificationPreferences => {
  const out = { ...DEFAULT_PREFERENCES };
  if (!row) return out;
  for (const key of NOTIFICATION_CATEGORIES) if (typeof row[key] === "boolean") out[key] = row[key] as boolean;
  return out;
};

export const loadPreferences = async (userId: string): Promise<NotificationPreferences> => {
  const { data, error } = await untypedSupabase
    .from<PrefRow>("notification_preferences")
    .select("podcast_episode, briefing, routine_reminder, account_update, promotional, service")
    .eq("user_id", userId)
    .maybeSingle();
  if (error && !isMissingBackend(error)) console.warn("[pwa] could not load notification preferences:", error.message);
  return normalizePreferences(data);
};

const writePreferences = (userId: string, prefs: NotificationPreferences) =>
  untypedSupabase.from("notification_preferences").upsert({ user_id: userId, ...prefs }, { onConflict: "user_id" });

/** Saves preferences; offline or unreachable writes are queued and replayed (last write wins). */
export const savePreferences = async (userId: string, prefs: NotificationPreferences): Promise<"saved" | "queued" | "failed"> => {
  if (typeof navigator === "undefined" || navigator.onLine !== false) {
    try {
      const { error } = await writePreferences(userId, prefs);
      if (!error) return "saved";
      if (isMissingBackend(error) || !isNetworkError(error)) return "failed";
    } catch (error) {
      if (!isNetworkError(error)) return "failed";
    }
  }
  const queued = await enqueueAction({
    key: queueKey("notification_preferences", userId),
    type: "notification_preferences",
    userId,
    payload: { ...prefs },
  });
  return queued ? "queued" : "failed";
};

registerQueueHandler("notification_preferences", async (action: QueuedAction) => {
  const { data } = await supabase.auth.getSession();
  if (!data.session) return "retry";
  if (data.session.user.id !== action.userId) return "drop";
  const { error } = await writePreferences(action.userId, normalizePreferences(action.payload as PrefRow));
  if (!error || isMissingBackend(error)) return "done";
  return isNetworkError(error) ? "retry" : "drop";
});

/** Asks the push-send Edge Function to deliver a test notification to the signed-in member's own devices only. */
export const sendTestNotification = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke("push-send", { body: { action: "test" } });
    return !error && (data as { sent?: number } | null)?.sent !== 0;
  } catch {
    return false;
  }
};
