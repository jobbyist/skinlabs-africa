/**
 * Podcast resume positions.
 *
 * Local store (always): `skinlabs-podcast-positions` (slug → seconds, the key the player has always used)
 * plus `skinlabs-podcast-position-times` (slug → ms timestamp of the last local update).
 * Account store (signed-in members): public.podcast_playback_progress through upsert_podcast_progress(),
 * which keeps the NEWEST client timestamp, so an offline device can never overwrite newer progress from
 * elsewhere. Writes made offline are queued (offlineQueue.ts) and replayed in order when connectivity
 * returns.
 */
import { supabase } from "@/integrations/supabase/client";
import { local } from "./storageUtil";
import { enqueueAction, queueKey, registerQueueHandler, type QueuedAction } from "./offlineQueue";
import { isNetworkError } from "./network";

export const POSITION_KEY = "skinlabs-podcast-positions";
export const POSITION_TIMES_KEY = "skinlabs-podcast-position-times";
/** Don't write to the server more often than this per episode while playing. */
export const REMOTE_SYNC_INTERVAL_MS = 20_000;

type NumberMap = Record<string, number>;

const readMap = (key: string): NumberMap => {
  try {
    const parsed = JSON.parse(local.get(key) || "{}");
    return parsed && typeof parsed === "object" ? (parsed as NumberMap) : {};
  } catch {
    return {};
  }
};

export const readPositions = (): NumberMap => readMap(POSITION_KEY);
export const getSavedPosition = (slug: string): number | undefined => readPositions()[slug];
export const getPositionTime = (slug: string): number => readMap(POSITION_TIMES_KEY)[slug] ?? 0;

export const saveLocalPosition = (slug: string, seconds: number, at: number = Date.now()) => {
  if (!Number.isFinite(seconds) || seconds < 0) return;
  const positions = readPositions();
  const times = readMap(POSITION_TIMES_KEY);
  positions[slug] = seconds;
  times[slug] = at;
  local.set(POSITION_KEY, JSON.stringify(positions));
  local.set(POSITION_TIMES_KEY, JSON.stringify(times));
};

/** Pure merge rule: take the remote position only when it is strictly newer than the local one. */
export const shouldAdoptRemote = (localTime: number, remoteTime: number): boolean => remoteTime > localTime;

const lastRemoteWrite = new Map<string, number>();

interface ProgressPayload {
  slug: string;
  position: number;
  duration: number | null;
  clientUpdatedAt: string;
}

const sendProgress = async (p: ProgressPayload) =>
  supabase.rpc("upsert_podcast_progress", {
    p_slug: p.slug,
    p_position: Math.round(p.position * 10) / 10,
    // The function accepts NULL (unknown duration); the generated arg type just has no DEFAULT to mark it optional.
    p_duration: (p.duration === null ? null : Math.round(p.duration * 10) / 10) as number,
    p_client_updated_at: p.clientUpdatedAt,
  });

/** Writes the member's progress to their account (or queues it offline). `force` bypasses the per-episode throttle. */
export const syncProgressToAccount = async (userId: string, slug: string, position: number, duration: number | null, force = false) => {
  const now = Date.now();
  if (!force && now - (lastRemoteWrite.get(slug) ?? 0) < REMOTE_SYNC_INTERVAL_MS) return;
  lastRemoteWrite.set(slug, now);
  const payload: ProgressPayload = { slug, position, duration, clientUpdatedAt: new Date(now).toISOString() };

  const offline = typeof navigator !== "undefined" && navigator.onLine === false;
  if (!offline) {
    try {
      const { error } = await sendProgress(payload);
      if (!error) return;
      if (!isNetworkError(error)) return; // a permanent server-side refusal: don't retry forever
    } catch (error) {
      if (!isNetworkError(error)) return;
    }
  }
  await enqueueAction({ key: queueKey("podcast_progress", `${userId}:${slug}`), type: "podcast_progress", userId, payload: { ...payload } });
};

registerQueueHandler("podcast_progress", async (action: QueuedAction) => {
  const { data } = await supabase.auth.getSession();
  // Not signed in (yet) or a different member now: keep for the right user / drop for the wrong one.
  if (!data.session) return "retry";
  if (data.session.user.id !== action.userId) return "drop";
  const { error } = await sendProgress(action.payload as unknown as ProgressPayload);
  if (!error) return "done";
  return isNetworkError(error) ? "retry" : "drop";
});

/** On sign-in: adopt account progress that is newer than what this device has. Returns how many slugs changed. */
export const hydrateProgressFromAccount = async (userId: string): Promise<number> => {
  const { data, error } = await supabase
    .from("podcast_playback_progress")
    .select("episode_slug, position_seconds, client_updated_at")
    .eq("user_id", userId);
  if (error || !Array.isArray(data)) return 0;
  let changed = 0;
  for (const row of data) {
    const remoteTime = Date.parse(row.client_updated_at);
    if (!Number.isFinite(remoteTime)) continue;
    if (shouldAdoptRemote(getPositionTime(row.episode_slug), remoteTime)) {
      saveLocalPosition(row.episode_slug, Number(row.position_seconds), remoteTime);
      changed++;
    }
  }
  return changed;
};
