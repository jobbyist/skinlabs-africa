/**
 * Pure rules for the member inbox (the `notifications` table), unit tested in notificationInbox.test.ts.
 * Rows are written server-side only (triggers + the notification engine); the client may read them and set
 * read_at / archived_at on its own rows.
 */
import { isSafeReturnTo } from "./pendingIntent";

export interface InboxRow {
  id: string;
  category: string;
  title: string;
  body: string | null;
  link: string | null;
  read_at: string | null;
  created_at: string;
  archived_at: string | null;
  expires_at: string | null;
  image_url: string | null;
  action_label: string | null;
}

export const INBOX_COLUMNS = "id, category, title, body, link, read_at, created_at, archived_at, expires_at, image_url, action_label";
export const INBOX_PAGE_SIZE = 50;
/** Fired after every local change to the inbox so the app-icon badge (PWAProvider) re-counts. */
export const NOTIFICATIONS_CHANGED_EVENT = "skinlabs:notifications-changed";

/** Hidden from the inbox: archived by the member, or past its expiry. */
export const isVisibleRow = (row: Pick<InboxRow, "archived_at" | "expires_at">, now: number = Date.now()): boolean => {
  if (row.archived_at) return false;
  if (row.expires_at) {
    const t = Date.parse(row.expires_at);
    if (Number.isFinite(t) && t <= now) return false;
  }
  return true;
};

export const unreadOf = (rows: readonly InboxRow[], now: number = Date.now()): number => rows.filter((r) => !r.read_at && isVisibleRow(r, now)).length;

/** Newest first, hidden rows dropped, capped. */
export const visibleRows = (rows: readonly InboxRow[], now: number = Date.now()): InboxRow[] =>
  rows
    .filter((r) => isVisibleRow(r, now))
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, INBOX_PAGE_SIZE);

/** Merge a realtime INSERT/UPDATE into the list (idempotent: the same id never appears twice). */
export const mergeRow = (rows: readonly InboxRow[], incoming: InboxRow, now: number = Date.now()): InboxRow[] =>
  visibleRows([incoming, ...rows.filter((r) => r.id !== incoming.id)], now);

/** Coerces a realtime payload (`payload.new`) into an InboxRow, or null when it is not one. */
export const toInboxRow = (raw: unknown): InboxRow | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.id !== "string" || typeof r.title !== "string" || typeof r.created_at !== "string") return null;
  const str = (v: unknown): string | null => (typeof v === "string" && v.length > 0 ? v : null);
  return {
    id: r.id,
    category: typeof r.category === "string" ? r.category : "system",
    title: r.title,
    body: str(r.body),
    link: str(r.link),
    read_at: str(r.read_at),
    created_at: r.created_at,
    archived_at: str(r.archived_at),
    expires_at: str(r.expires_at),
    image_url: str(r.image_url),
    action_label: str(r.action_label),
  };
};

const sameOriginPath = (value: string, origin: string): string | null => {
  if (isSafeReturnTo(value)) return value;
  try {
    const url = new URL(value);
    if (url.origin !== origin) return null;
    const path = `${url.pathname}${url.search}${url.hash}`;
    return isSafeReturnTo(path) ? path : null;
  } catch {
    return null;
  }
};

/** An in-app path for the row's link, or null. Anything cross-origin or malformed is dropped (never navigated to). */
export const safeLinkTarget = (link: string | null | undefined, origin: string): string | null =>
  typeof link === "string" && link.length > 0 ? sameOriginPath(link, origin) : null;

/** An image URL we may render: our own origin only (a relative path or an absolute URL on `origin`). */
export const safeImageUrl = (url: string | null | undefined, origin: string): string | null => {
  if (typeof url !== "string" || url.length === 0) return null;
  const path = sameOriginPath(url, origin);
  return path ? path : null;
};

export const CATEGORY_LABEL: Record<string, string> = {
  system: "System",
  billing: "Billing",
  analysis: "Skin Analysis",
  community: "Community",
  security: "Security",
};
