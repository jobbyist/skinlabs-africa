/**
 * "The member did something" signal. Anything that changes what SkinLabs knows about a
 * member (an analysis saved, a routine edited, a submission made, a pass bought) calls
 * notifyMemberContextChanged(); useAppContext() listens and re-reads the shared snapshot,
 * so the dashboard, hero and navigation all catch up at once. Browser-only, no data.
 */
export const MEMBER_CONTEXT_CHANGED_EVENT = "skinlabs:member-context-changed";

export const notifyMemberContextChanged = () => {
  if (typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new Event(MEMBER_CONTEXT_CHANGED_EVENT));
};

const HINT_PREFIX = "skinlabs:has-skin-profile:";
/** Fired when the hint flips, so navigation re-reads it. */
export const SKIN_PROFILE_HINT_EVENT = "skinlabs:skin-profile-hint";

/**
 * A one-bit, per-account hint ("this member has a saved skin profile") so navigation can
 * adapt on every page without running the whole member snapshot site-wide. Written whenever
 * the snapshot loads or an analysis is saved; presentation only.
 */
export const writeSkinProfileHint = (userId: string | null | undefined, has: boolean, storage?: Pick<Storage, "getItem" | "setItem" | "removeItem">) => {
  if (!userId) return;
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    const before = (s as Pick<Storage, "getItem"> | undefined)?.getItem?.(HINT_PREFIX + userId) === "1";
    if (has) s?.setItem(HINT_PREFIX + userId, "1");
    else s?.removeItem(HINT_PREFIX + userId);
    if (before !== has && typeof window !== "undefined" && typeof window.dispatchEvent === "function") window.dispatchEvent(new Event(SKIN_PROFILE_HINT_EVENT));
  } catch {
    /* private mode */
  }
};

export const readSkinProfileHint = (userId: string | null | undefined, storage?: Pick<Storage, "getItem">): boolean => {
  if (!userId) return false;
  try {
    const s = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    return s?.getItem(HINT_PREFIX + userId) === "1";
  } catch {
    return false;
  }
};
