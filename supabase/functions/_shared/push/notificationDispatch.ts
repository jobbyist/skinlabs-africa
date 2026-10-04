/**
 * Pure rules for notification-dispatcher and push-track (no Deno / network imports, so bun tests can run them).
 * Preferences, quiet hours, caps and guards are NOT here: claim_notification_dispatches() applies them in SQL.
 */
import { isGoneStatus, MAX_CONSECUTIVE_FAILURES } from "./dispatch.ts";

export const CLAIM_BATCH = 100;
export const MAX_ROUNDS = 5;
export const TIME_BUDGET_MS = 40_000;
export const SEND_POOL_SIZE = 20;
export const SEND_TIMEOUT_MS = 10_000;
export const PUSH_TTL_SECONDS = 86_400;

/** What a claimed row looks like (claim_notification_dispatches). */
export interface ClaimedSubscription {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
  failure_count: number;
  platform: string | null;
  browser: string | null;
}
export interface ClaimedDispatch {
  d_id: string;
  d_user_id: string;
  d_category: string;
  d_title: string;
  d_body: string;
  d_url: string;
  d_tag: string | null;
  d_subscriptions: ClaimedSubscription[] | null;
}

const LOW_URGENCY = new Set(["promotional", "briefing", "podcast_episode", "price_alert"]);
export const urgencyFor = (category: string): "low" | "normal" => (LOW_URGENCY.has(category) ? "low" : "normal");

/** The JSON the service worker receives. `d` is the per-device delivery id push-track resolves a tap with. */
export const buildPushPayload = (dispatch: ClaimedDispatch, deliveryId: string) => ({
  title: dispatch.d_title,
  body: dispatch.d_body,
  url: dispatch.d_url,
  tag: dispatch.d_tag ?? undefined,
  category: dispatch.d_category,
  d: deliveryId,
});

export type DeliveryStatus = "sent" | "failed" | "gone";
export interface DeliveryOutcome {
  status: DeliveryStatus;
  httpStatus: number | null;
  /** Short token only: never the endpoint, keys, payload or the push service's response body. */
  error: string | null;
}

/** Classify a web-push result. `error` undefined = success. */
export const classifyDelivery = (error: unknown): DeliveryOutcome => {
  if (error === undefined || error === null) return { status: "sent", httpStatus: null, error: null };
  const e = error as { statusCode?: unknown; code?: unknown; name?: unknown };
  const httpStatus = typeof e.statusCode === "number" ? e.statusCode : null;
  if (isGoneStatus(httpStatus ?? undefined)) return { status: "gone", httpStatus, error: `http_${httpStatus}` };
  const token =
    httpStatus !== null ? `http_${httpStatus}` : typeof e.code === "string" && /^[A-Z_]{3,30}$/.test(e.code) ? e.code : typeof e.name === "string" ? e.name.slice(0, 40) : "error";
  return { status: "failed", httpStatus, error: token };
};

/** What to do to the subscription row after a delivery. */
export type SubscriptionAction =
  | { kind: "touch" }
  | { kind: "delete" }
  | { kind: "fail"; failureCount: number; isActive: boolean };

export const subscriptionActionFor = (outcome: DeliveryOutcome, currentFailures: number): SubscriptionAction => {
  if (outcome.status === "sent") return { kind: "touch" };
  if (outcome.status === "gone") return { kind: "delete" };
  const failureCount = currentFailures + 1;
  return { kind: "fail", failureCount, isActive: failureCount < MAX_CONSECUTIVE_FAILURES };
};

export interface DispatchTotals {
  sent: number;
  failed: number;
  error: string | null;
}
export const summariseOutcomes = (outcomes: DeliveryOutcome[]): DispatchTotals => {
  const sent = outcomes.filter((o) => o.status === "sent").length;
  const failed = outcomes.length - sent;
  const reasons = [...new Set(outcomes.filter((o) => o.error).map((o) => o.error as string))].slice(0, 3);
  return { sent, failed, error: reasons.length ? reasons.join(",") : null };
};

// --- authorisation ---------------------------------------------------------------------------------
export type DispatcherCaller = "cron" | "service" | "admin";
export interface AuthFacts {
  cronSecretMatches: boolean;
  bearerIsServiceRole: boolean;
  isAdminMember: boolean;
}
/** Any ONE of the three authorises; null = 401/403. Order is the cheapest first. */
export const authoriseDispatcher = (facts: AuthFacts): DispatcherCaller | null => {
  if (facts.cronSecretMatches) return "cron";
  if (facts.bearerIsServiceRole) return "service";
  if (facts.isAdminMember) return "admin";
  return null;
};

/** Whether another claim round should run. */
export const shouldClaimAnotherRound = (round: number, lastBatchSize: number, elapsedMs: number): boolean =>
  round < MAX_ROUNDS && lastBatchSize >= CLAIM_BATCH && elapsedMs < TIME_BUDGET_MS;

// --- push-track ------------------------------------------------------------------------------------
export const MAX_TRACK_BODY_BYTES = 512;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (value: unknown): value is string => typeof value === "string" && UUID_RE.test(value);

/** Returns the delivery id when the body is a small JSON object {d: <uuid>}, otherwise null. */
export const parseTrackBody = (text: string): string | null => {
  if (new TextEncoder().encode(text).length > MAX_TRACK_BODY_BYTES) return null;
  try {
    const parsed = JSON.parse(text) as { d?: unknown } | null;
    return parsed && typeof parsed === "object" && isUuid(parsed.d) ? parsed.d : null;
  } catch {
    return null;
  }
};

/** Run `items` through `worker` with at most `size` in flight. Order of results matches input. */
export const runPool = async <T, R>(items: T[], size: number, worker: (item: T) => Promise<R>): Promise<R[]> => {
  const results = new Array<R>(items.length);
  let next = 0;
  const lane = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await worker(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, lane));
  return results;
};
