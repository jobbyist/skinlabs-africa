/**
 * Push payload parsing shared by the service worker and tests. A push may
 * carry untrusted-looking JSON (anyone holding the endpoint secrets could
 * send one), so every field is type-checked, clipped, and the click target is
 * constrained to same-origin relative paths.
 */

import { safeClickTarget } from "./swCore";

export const NOTIFICATION_CATEGORIES = [
  "podcast_episode",
  "briefing",
  "routine_reminder",
  "account_update",
  "promotional",
  "service",
] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/** Every category the notification engine can send. The preference UI keeps the six above; the worker accepts all. */
export const ENGINE_NOTIFICATION_CATEGORIES = [...NOTIFICATION_CATEGORIES, "report_ready", "skin_weather", "journal_reminder", "price_alert", "community"] as const;
export type EngineNotificationCategory = (typeof ENGINE_NOTIFICATION_CATEGORIES)[number];

export interface ParsedNotification {
  title: string;
  body: string;
  icon: string;
  badge: string;
  tag: string;
  url: string;
  category: EngineNotificationCategory | "other";
  actions: { action: string; title: string }[];
  badgeCount: number | null;
  /** Per-device delivery id (UUID) the notification-dispatcher put in the payload; null when absent/invalid. */
  deliveryId: string | null;
}

const clip = (value: unknown, max: number): string => (typeof value === "string" ? value.trim().slice(0, max) : "");

/** Same-origin relative path only ("/podcast/ep-1"); anything else becomes the start page. */
export const safeNotificationUrl = (value: unknown, origin: string): string => safeClickTarget(value, origin) ?? "/start";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const ALLOWED_ACTIONS = new Set(["open", "dismiss"]);

export const notificationFromPush = (readJson: () => unknown, origin = "https://skinlabs.co.za"): ParsedNotification => {
  let raw: unknown = null;
  try {
    raw = readJson();
  } catch {
    raw = null;
  }
  const data = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const category = (ENGINE_NOTIFICATION_CATEGORIES as readonly string[]).includes(data.category as string)
    ? (data.category as EngineNotificationCategory)
    : "other";
  const actions = Array.isArray(data.actions)
    ? (data.actions as unknown[])
        .filter((a): a is { action: string; title: string } => {
          const x = a as { action?: unknown; title?: unknown };
          return typeof x?.action === "string" && ALLOWED_ACTIONS.has(x.action) && typeof x?.title === "string";
        })
        .slice(0, 2)
        .map((a) => ({ action: a.action, title: clip(a.title, 24) }))
    : [];
  const badgeCount = typeof data.badge_count === "number" && Number.isFinite(data.badge_count) ? Math.max(0, Math.min(999, Math.floor(data.badge_count))) : null;
  return {
    title: clip(data.title, 80) || "SkinLabs®",
    body: clip(data.body, 240) || "You have a new update.",
    icon: "/pwa-192.png",
    badge: "/pwa-192.png",
    tag: clip(data.tag, 60) || (category === "other" ? "skinlabs" : `skinlabs-${category}`),
    url: safeNotificationUrl(data.url, origin),
    category,
    actions,
    badgeCount,
    deliveryId: typeof data.d === "string" && UUID_RE.test(data.d) ? data.d : null,
  };
};
