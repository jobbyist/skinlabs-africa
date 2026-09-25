/**
 * Public comment handles. Sign-up no longer asks for a username: the profile
 * trigger assigns a `glow_xxxxxx` placeholder (profiles.username_generated =
 * true), and the comment form asks for a real handle the first time a member
 * comments. Pure, unit tested in src/lib/__tests__/commentHandle.test.ts.
 */

/** Same rule as the DB's is_username_available(). */
export const HANDLE_PATTERN = /^[a-zA-Z0-9_]{3,20}$/;

export interface HandleProfile {
  username: string | null;
  username_generated: boolean | null;
}

/** A member needs to choose a handle when they have none, or only the sign-up placeholder. */
export const needsCommentHandle = (profile: HandleProfile | null): boolean =>
  !profile || !profile.username?.trim() || profile.username_generated === true;

/** The handle to show on a comment, or null when one must be chosen first. */
export const commentDisplayName = (profile: HandleProfile | null): string | null =>
  needsCommentHandle(profile) ? null : profile!.username!.trim();

/** Client-side check before the availability RPC. Returns an error message, or null when valid. */
export const handleValidationError = (raw: string): string | null => {
  const handle = raw.trim();
  if (!handle) return "Choose a handle to post with.";
  if (!HANDLE_PATTERN.test(handle)) return "Use 3–20 letters, numbers or underscores.";
  if (/^glow_/i.test(handle)) return "Pick something of your own — glow_ handles are reserved for new accounts.";
  return null;
};
