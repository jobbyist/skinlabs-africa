import { lazy, type ComponentType } from "react";

/**
 * Recovery for "deployment skew": this site redeploys many times a day, and
 * every deploy replaces the hashed /assets/*.js chunks. A tab that loaded the
 * previous build then fails to lazy-load a route chunk that no longer exists.
 * Without this, navigation either hangs on the route spinner or blanks the
 * page until a manual refresh. The fix is a single guarded full reload, which
 * picks up the new build's HTML and chunk names.
 */

const RELOAD_KEY = "skinlabs-chunk-reload-at";
// A second chunk failure inside this window means the reload didn't help
// (e.g. the user is offline) — surface the error UI instead of looping.
const RELOAD_COOLDOWN_MS = 30_000;

const CHUNK_ERROR_PATTERN =
  /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (CSS )?chunk .* failed|ChunkLoadError|Unable to preload CSS|is not a valid JavaScript MIME type/i;

export const isChunkLoadError = (error: unknown): boolean => {
  if (!error) return false;
  const text = error instanceof Error ? `${error.name} ${error.message}` : String(error);
  return CHUNK_ERROR_PATTERN.test(text);
};

/** Reloads the page at most once per cooldown window. Returns whether a reload was triggered. */
export const reloadForNewDeployment = (): boolean => {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(window.sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_COOLDOWN_MS) return false;
    window.sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // No sessionStorage means no loop guard — let the error boundary handle it instead.
    return false;
  }
  window.location.reload();
  return true;
};

/** Drop-in replacement for `lazy(() => import(...))` that self-heals across deploys. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const lazyWithRetry = <T extends ComponentType<any>>(factory: () => Promise<{ default: T }>) =>
  lazy(() =>
    factory().catch((error: unknown) => {
      if (isChunkLoadError(error) && reloadForNewDeployment()) {
        // Keep Suspense's fallback up while the reload happens instead of flashing an error.
        return new Promise<{ default: T }>(() => {});
      }
      throw error;
    }),
  );
