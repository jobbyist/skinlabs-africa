/**
 * Pure rules for /start — the installed app's entry point (manifest start_url).
 * The page itself is src/pages/Start.tsx.
 */
import { isSafeReturnTo } from "@/lib/pendingIntent";
import { PWA_START_PATH } from "./constants";

export type StartState =
  /** Waiting for the stored Supabase session to be restored. */
  | "restoring"
  /** Signed in and online: route into the member experience. */
  | "member"
  /** No session (or it could not be restored in time): show the existing sign-in. */
  | "signin"
  /** No connection: nothing that needs the network can run. */
  | "offline";

export interface StartInputs {
  authLoading: boolean;
  hasUser: boolean;
  offline: boolean;
  /** The 12 s ceiling passed while the session was still restoring (slow network / refresh in flight). */
  timedOut: boolean;
}

export const resolveStartState = ({ authLoading, hasUser, offline, timedOut }: StartInputs): StartState => {
  if (offline) return "offline";
  if (authLoading && !timedOut) return "restoring";
  return hasUser ? "member" : "signin";
};

/** Where a restored member lands. `?next=` (a validated same-origin path) wins; default is the dashboard. */
export const resolveStartDestination = (search: string): string => {
  const next = new URLSearchParams(search).get("next");
  if (next && isSafeReturnTo(next) && next.split(/[?#]/)[0] !== PWA_START_PATH) return next;
  return "/dashboard";
};
