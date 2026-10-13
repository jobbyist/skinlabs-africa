/**
 * CTA fatigue ledger. Pure functions over a plain record, so the rules are
 * testable; `loadLedger` / `saveLedger` are the only browser-touching bits and
 * take an injectable Storage. The ledger holds action ids and counters only
 * (never skin data, never content) and is keyed by account on this device, so
 * one member's history can't shape another's UI.
 */
export interface LedgerEntry {
  /** SAST calendar days (YYYY-MM-DD) on which the action was shown, newest last, capped. */
  shownDays: string[];
  clicks: number;
  lastClickedAt: string | null;
  dismissedAt: string | null;
  /** Set once the member did the thing the action asks for (e.g. opened their Advanced result). */
  completedAt: string | null;
}

export type CtaLedger = Record<string, LedgerEntry>;

export interface FatigueRule {
  /** Never suppress (the single step the member needs to finish, like "save your results"). */
  essential?: boolean;
  /** Show on at most `maxDays` distinct days within the last `windowDays`. */
  maxDays?: number;
  windowDays?: number;
  /** After a dismissal, stay away for this many days. */
  dismissCooldownDays?: number;
  /** After a click that didn't complete the action, give it this many days before repeating it. */
  clickCooldownDays?: number;
}

const MAX_TRACKED_DAYS = 30;

export const emptyEntry = (): LedgerEntry => ({ shownDays: [], clicks: 0, lastClickedAt: null, dismissedAt: null, completedAt: null });

/** SAST (UTC+2, no DST) calendar day for an ISO instant. */
export const sastDay = (iso: string): string => new Date(Date.parse(iso) + 2 * 3_600_000).toISOString().slice(0, 10);

const dayDiff = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 86_400_000);

export const isFatigued = (entry: LedgerEntry | undefined, rule: FatigueRule | undefined, now: string): "dismissed" | "fatigued" | null => {
  if (!entry || !rule || rule.essential) return null;
  const today = sastDay(now);
  if (entry.dismissedAt && rule.dismissCooldownDays !== undefined) {
    if (dayDiff(sastDay(entry.dismissedAt), today) < rule.dismissCooldownDays) return "dismissed";
  }
  if (entry.lastClickedAt && rule.clickCooldownDays !== undefined) {
    if (dayDiff(sastDay(entry.lastClickedAt), today) < rule.clickCooldownDays) return "fatigued";
  }
  if (rule.maxDays !== undefined && rule.windowDays !== undefined) {
    const recent = entry.shownDays.filter((d) => dayDiff(d, today) < rule.windowDays!);
    // Already counted today: keep showing it for the rest of today, so a CTA never vanishes mid-session.
    if (!recent.includes(today) && recent.length >= rule.maxDays) return "fatigued";
  }
  return null;
};

const withEntry = (ledger: CtaLedger, id: string, patch: (e: LedgerEntry) => LedgerEntry): CtaLedger => ({
  ...ledger,
  [id]: patch(ledger[id] ?? emptyEntry()),
});

/** Records an impression at most once per SAST day. Returns the same object when nothing changed. */
export const recordShown = (ledger: CtaLedger, id: string, now: string): CtaLedger => {
  const today = sastDay(now);
  const entry = ledger[id];
  if (entry?.shownDays[entry.shownDays.length - 1] === today) return ledger;
  return withEntry(ledger, id, (e) => ({ ...e, shownDays: [...e.shownDays, today].slice(-MAX_TRACKED_DAYS) }));
};

export const recordClicked = (ledger: CtaLedger, id: string, now: string): CtaLedger =>
  withEntry(ledger, id, (e) => ({ ...e, clicks: e.clicks + 1, lastClickedAt: now }));

export const recordDismissed = (ledger: CtaLedger, id: string, now: string): CtaLedger =>
  withEntry(ledger, id, (e) => ({ ...e, dismissedAt: now }));

export const recordCompleted = (ledger: CtaLedger, id: string, now: string): CtaLedger =>
  ledger[id]?.completedAt ? ledger : withEntry(ledger, id, (e) => ({ ...e, completedAt: now }));

const KEY_PREFIX = "skinlabs:cta-ledger:";

export const loadLedger = (userId: string | null | undefined, storage?: Pick<Storage, "getItem">): CtaLedger => {
  if (!userId) return {};
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    const raw = s?.getItem(KEY_PREFIX + userId);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out: CtaLedger = {};
    for (const [id, v] of Object.entries(parsed as Record<string, Partial<LedgerEntry>>)) {
      out[id] = {
        shownDays: Array.isArray(v.shownDays) ? v.shownDays.filter((d): d is string => typeof d === "string").slice(-MAX_TRACKED_DAYS) : [],
        clicks: typeof v.clicks === "number" ? v.clicks : 0,
        lastClickedAt: typeof v.lastClickedAt === "string" ? v.lastClickedAt : null,
        dismissedAt: typeof v.dismissedAt === "string" ? v.dismissedAt : null,
        completedAt: typeof v.completedAt === "string" ? v.completedAt : null,
      };
    }
    return out;
  } catch {
    return {};
  }
};

export const saveLedger = (userId: string | null | undefined, ledger: CtaLedger, storage?: Pick<Storage, "setItem">) => {
  if (!userId) return;
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    s?.setItem(KEY_PREFIX + userId, JSON.stringify(ledger));
  } catch {
    /* private mode / quota: fatigue then simply resets, nothing breaks */
  }
};
