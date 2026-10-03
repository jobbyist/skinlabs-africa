/**
 * A small, deliberately conservative offline action queue.
 *
 * Only low-risk, idempotent, last-write-wins actions are queued (podcast
 * playback progress, notification preferences). Anything involving money,
 * identity, health data or reports is NEVER queued: those need the server's
 * answer immediately and have no safe conflict-resolution story.
 *
 * Each action has a stable `key`, so queuing the same thing again replaces the
 * pending one (no duplicates, newest wins) and replays are harmless. The
 * queue holds no credentials: handlers re-read the live Supabase session when
 * they run, and drop actions that belong to a different user.
 */
import { BACKGROUND_SYNC_TAG } from "./constants";
import { idbDelete, idbGetAll, idbPut } from "./idb";
import { isNetworkError } from "./network";

export type QueuedActionType = "podcast_progress" | "notification_preferences";

export interface QueuedAction {
  /** `${type}:${entity}` — the idempotency key. */
  key: string;
  type: QueuedActionType;
  userId: string;
  payload: Record<string, unknown>;
  createdAt: number;
  attempts: number;
}

/** done → remove; retry → keep (network/transient); drop → remove without success (permanent failure). */
export type HandlerResult = "done" | "retry" | "drop";
export type QueueHandler = (action: QueuedAction) => Promise<HandlerResult>;

const MAX_ATTEMPTS = 8;
const MAX_QUEUE_LENGTH = 200;
const handlers = new Map<QueuedActionType, QueueHandler>();
let flushing: Promise<number> | null = null;

export const registerQueueHandler = (type: QueuedActionType, handler: QueueHandler) => {
  handlers.set(type, handler);
};

export const queueKey = (type: QueuedActionType, entity: string) => `${type}:${entity}`;

export const enqueueAction = async (action: Omit<QueuedAction, "createdAt" | "attempts">): Promise<boolean> => {
  const all = await idbGetAll<QueuedAction>("queue");
  if (all.length >= MAX_QUEUE_LENGTH && !all.some((a) => a.key === action.key)) {
    // Drop the oldest rather than grow without bound.
    const oldest = [...all].sort((a, b) => a.createdAt - b.createdAt)[0];
    if (oldest) await idbDelete("queue", oldest.key);
  }
  const stored = await idbPut("queue", { ...action, createdAt: Date.now(), attempts: 0 } satisfies QueuedAction);
  if (stored) void requestBackgroundSync();
  return stored;
};

export const pendingQueueLength = async (): Promise<number> => (await idbGetAll<QueuedAction>("queue")).length;

/** Runs every queued action once. Concurrent calls share one run. Returns how many completed. */
export const flushQueue = (): Promise<number> => {
  if (flushing) return flushing;
  flushing = (async () => {
    let completed = 0;
    const actions = (await idbGetAll<QueuedAction>("queue")).sort((a, b) => a.createdAt - b.createdAt);
    for (const action of actions) {
      const handler = handlers.get(action.type);
      if (!handler) continue; // handler module not loaded yet: keep for the next flush
      let result: HandlerResult;
      try {
        result = await handler(action);
      } catch (error) {
        result = isNetworkError(error) ? "retry" : "drop";
      }
      if (result === "done") {
        await idbDelete("queue", action.key);
        completed++;
      } else if (result === "drop" || action.attempts + 1 >= MAX_ATTEMPTS) {
        await idbDelete("queue", action.key);
      } else {
        await idbPut("queue", { ...action, attempts: action.attempts + 1 });
        // Still offline/unreachable: stop early, later items would fail the same way.
        break;
      }
    }
    return completed;
  })().finally(() => {
    flushing = null;
  });
  return flushing;
};

/** Chromium only: lets the browser wake a window to flush later. Silently skipped elsewhere (iOS, Firefox). */
export const requestBackgroundSync = async () => {
  try {
    if (!("serviceWorker" in navigator) || !("SyncManager" in window)) return;
    const reg = await navigator.serviceWorker.ready;
    await (reg as ServiceWorkerRegistration & { sync?: { register(tag: string): Promise<void> } }).sync?.register(BACKGROUND_SYNC_TAG);
  } catch {
    /* not supported / permission: the online-event flush covers it */
  }
};
