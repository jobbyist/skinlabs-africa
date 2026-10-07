/**
 * "When was this member last here?" — a device-local timestamp per account, used only to tell a returning
 * member who has been away (INACTIVE_USER) from one who simply hasn't checked in or re-analysed lately.
 * Server-visible activity (check-ins, analyses) can't see someone who reads every day, so without this a
 * daily reader would be greeted with "welcome back, it's been 20 days". Counters and a timestamp only.
 *
 * The previous visit is captured ONCE per page load (the first caller), because the same load then
 * records "now" as the new last visit.
 */
const PREFIX = "skinlabs:last-visit:";

let captured: { userId: string; previous: string | null } | null = null;

export const captureLastVisit = (
  userId: string,
  now: string,
  storage?: Pick<Storage, "getItem" | "setItem">,
): string | null => {
  if (captured && captured.userId === userId) return captured.previous;
  let previous: string | null = null;
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    const raw = s?.getItem(PREFIX + userId) ?? null;
    previous = raw && !Number.isNaN(Date.parse(raw)) ? raw : null;
    s?.setItem(PREFIX + userId, now);
  } catch {
    /* private mode: no visit memory, the server-side signals still work */
  }
  captured = { userId, previous };
  return previous;
};

/** Test seam. */
export const __resetLastVisitForTests = () => {
  captured = null;
};
