/**
 * Install state + the captured `beforeinstallprompt` event.
 *
 * `initInstall()` is called from main.tsx, before React, because Chromium
 * fires `beforeinstallprompt` early and it is lost if nothing listens yet. The
 * browser's own mini-infobar is suppressed (preventDefault) so SkinLabs can
 * show its branded prompt (components/pwa/PWAInstallPrompt.tsx) at a sensible
 * moment instead — and only on request, never automatically.
 */
import {
  INSTALL_DISMISS_COOLDOWN_DAYS,
  INSTALL_MIN_DELAY_MS,
  INSTALL_MIN_PAGEVIEWS,
  INSTALL_PROMPT_EXCLUDED_PREFIXES,
  STORAGE_KEYS,
} from "./constants";
import { canShowIosInstructions, isInAppBrowser, isStandaloneMode, readDetectionEnv, type DetectionEnv } from "./detection";
import { local, readTimestamp, session, withinDays } from "./storageUtil";
import { trackPwaEvent } from "./analytics";

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms?: string[];
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export interface InstallSnapshot {
  /** A native install prompt has been captured and can be shown on request. */
  canPromptNatively: boolean;
  /** appinstalled fired (or was recorded) on this browser. */
  installedFlag: boolean;
}

let deferred: BeforeInstallPromptEvent | null = null;
let installedFlag = false;
let initialised = false;
let snapshot: InstallSnapshot = { canPromptNatively: false, installedFlag: false };
const listeners = new Set<() => void>();

const emit = () => {
  snapshot = { canPromptNatively: deferred !== null, installedFlag };
  listeners.forEach((l) => l());
};

export const subscribeInstall = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};
export const getInstallSnapshot = (): InstallSnapshot => snapshot;
export const getServerInstallSnapshot = (): InstallSnapshot => ({ canPromptNatively: false, installedFlag: false });

export const initInstall = () => {
  if (initialised || typeof window === "undefined") return;
  initialised = true;
  installedFlag = local.get(STORAGE_KEYS.installed) === "1";

  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferred = event as BeforeInstallPromptEvent;
    emit();
  });

  window.addEventListener("appinstalled", () => {
    deferred = null;
    installedFlag = true;
    local.set(STORAGE_KEYS.installed, "1");
    trackPwaEvent("pwa_installed", { source: "appinstalled" });
    emit();
  });

  // Count in-session page views for the "engaged enough to ask" rule.
  emit();
};

export const countPageView = (): number => {
  const next = Number(session.get(STORAGE_KEYS.installPageViews) ?? 0) + 1;
  session.set(STORAGE_KEYS.installPageViews, String(next));
  return next;
};
export const getPageViews = (): number => Number(session.get(STORAGE_KEYS.installPageViews) ?? 0);

/** Opens the browser's native install dialog. Must be called from a user gesture. */
export const promptNativeInstall = async (): Promise<"accepted" | "dismissed" | "unavailable"> => {
  const event = deferred;
  if (!event) return "unavailable";
  trackPwaEvent("pwa_install_started");
  try {
    await event.prompt();
    const choice = await event.userChoice;
    trackPwaEvent(choice.outcome === "accepted" ? "pwa_install_accepted" : "pwa_install_declined");
    // The event is single-use whatever the outcome.
    deferred = null;
    emit();
    return choice.outcome;
  } catch {
    deferred = null;
    emit();
    return "unavailable";
  }
};

export const recordInstallDismissed = (now: number = Date.now()) => {
  local.set(STORAGE_KEYS.installDismissedAt, String(now));
};
export const readInstallDismissedAt = (): number | null => readTimestamp(local.get(STORAGE_KEYS.installDismissedAt));

export type InstallExperience = "native" | "ios" | null;

export interface InstallOfferContext {
  env: DetectionEnv;
  hasDeferredPrompt: boolean;
  installedFlag: boolean;
  dismissedAt: number | null;
  pageViews: number;
  msSinceLoad: number;
  pathname: string;
  now?: number;
  /** Skip the engagement + cooldown rules (an explicit "Install app" button). */
  explicit?: boolean;
}

/**
 * Which install UI (if any) may be offered right now. Pure and unit tested.
 * Never offered: inside an installed app, in embedded webviews, on routes
 * where an interruption costs a conversion, or inside the dismissal cooldown.
 */
export const resolveInstallExperience = (ctx: InstallOfferContext): InstallExperience => {
  const { env } = ctx;
  if (isStandaloneMode(env) || ctx.installedFlag) return null;
  if (isInAppBrowser(env.userAgent)) return null;

  const experience: InstallExperience = ctx.hasDeferredPrompt ? "native" : canShowIosInstructions(env) ? "ios" : null;
  if (!experience) return null;
  if (ctx.explicit) return experience;

  if (INSTALL_PROMPT_EXCLUDED_PREFIXES.some((p) => ctx.pathname === p || ctx.pathname.startsWith(`${p}/`))) return null;
  if (withinDays(ctx.dismissedAt, INSTALL_DISMISS_COOLDOWN_DAYS, ctx.now)) return null;
  if (ctx.pageViews < INSTALL_MIN_PAGEVIEWS || ctx.msSinceLoad < INSTALL_MIN_DELAY_MS) return null;
  return experience;
};
