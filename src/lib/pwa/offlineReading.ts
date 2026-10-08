/**
 * Offline reading queue: a member taps "Save offline" on a briefing or an ingredient profile and the text is kept in
 * IndexedDB (`reading` store) for load-shedding or a commute. It extends the offline podcast pattern but is simpler:
 * only PUBLIC article text is stored (no account data, no images, no tokens), and it is readable without a network at
 * /offline-reading. Capped so it can never grow without bound.
 */
import { idbDelete, idbGet, idbGetAll, idbPut } from "./idb";
import { trackPwaEvent } from "./analytics";

export type ReadingKind = "briefing" | "ingredient";

export interface BriefingSnapshot {
  title: string;
  excerpt?: string | null;
  body_markdown: string;
  key_takeaways?: string[];
  published_at?: string | null;
}

export interface IngredientSnapshot {
  name: string;
  inci_name?: string | null;
  category?: string | null;
  description?: string | null;
  function_summary?: string | null;
  typical_concentration_range?: string | null;
  formulation_notes?: string | null;
  evidence_level?: string | null;
  irritancy_risk?: string | null;
}

export interface ReadingRecord {
  /** `${kind}:${slug}` (store key). */
  id: string;
  kind: ReadingKind;
  slug: string;
  title: string;
  savedAt: number;
  bytes: number;
  briefing?: BriefingSnapshot;
  ingredient?: IngredientSnapshot;
}

export const MAX_READING_ITEMS = 40;
/** A single saved article above this is refused (keeps IndexedDB quota for the podcast metadata and queue). */
export const MAX_READING_BYTES = 400_000;

export const readingId = (kind: ReadingKind, slug: string) => `${kind}:${slug}`;
export const readingPath = (kind: ReadingKind, slug: string) => (kind === "briefing" ? `/briefings/${slug}` : `/ingredients/${slug}`);

const SLUG = /^[a-z0-9][a-z0-9-]{0,120}$/i;

export type SaveResult = "saved" | "too_large" | "invalid" | "unsupported";

/** Pure: which stored items to drop so that adding one more keeps the queue at the cap (oldest first). */
export const evictionForCap = (existing: Pick<ReadingRecord, "id" | "savedAt">[], max = MAX_READING_ITEMS): string[] =>
  existing.length < max ? [] : [...existing].sort((a, b) => a.savedAt - b.savedAt).slice(0, existing.length - max + 1).map((r) => r.id);

export const saveForOffline = async (input: { kind: ReadingKind; slug: string; title: string; briefing?: BriefingSnapshot; ingredient?: IngredientSnapshot }): Promise<SaveResult> => {
  if (!SLUG.test(input.slug) || !input.title.trim()) return "invalid";
  const payload = JSON.stringify({ b: input.briefing, i: input.ingredient });
  const bytes = new Blob([payload]).size;
  if (bytes > MAX_READING_BYTES) return "too_large";
  const existing = await idbGetAll<ReadingRecord>("reading");
  for (const id of evictionForCap(existing.filter((r) => r.id !== readingId(input.kind, input.slug)))) await idbDelete("reading", id);
  const ok = await idbPut("reading", {
    id: readingId(input.kind, input.slug), kind: input.kind, slug: input.slug, title: input.title.slice(0, 200), savedAt: Date.now(), bytes,
    briefing: input.briefing, ingredient: input.ingredient,
  } satisfies ReadingRecord);
  if (!ok) return "unsupported";
  trackPwaEvent("offline_reading_saved", { kind: input.kind });
  notifyReadingChanged();
  // Fetch the reader's code now, while online, so it opens with no network.
  void import("@/pages/OfflineReading").catch(() => undefined);
  return "saved";
};

export const removeFromOffline = async (kind: ReadingKind, slug: string) => {
  await idbDelete("reading", readingId(kind, slug));
  notifyReadingChanged();
};

export const getOfflineReading = (kind: ReadingKind, slug: string) => idbGet<ReadingRecord>("reading", readingId(kind, slug));

export const listOfflineReading = async (): Promise<ReadingRecord[]> => (await idbGetAll<ReadingRecord>("reading")).sort((a, b) => b.savedAt - a.savedAt);

export const READING_CHANGED_EVENT = "skinlabs:offline-reading-changed";
const notifyReadingChanged = () => {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(READING_CHANGED_EVENT));
};
