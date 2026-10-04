/**
 * The reminder opt-in flow shared by every surface (Welcome "Your day", the Getting Started checklist, Settings).
 * Decisions come from pushCapability.ts; this file only sequences the steps and records the funnel events
 * (each carries `surface`, so Admin → Analytics can split the push funnel by where the ask happened).
 *
 * Order: our soft ask (shown by the UI, tracked here) → the member taps "Allow" → native permission prompt
 * (requestPermission is a no-op without a live user activation and never re-asks after "denied") → subscribe →
 * one preference upsert → a confirmation test notification.
 */
import { supabase } from "@/integrations/supabase/client";
import { trackPwaEvent } from "./analytics";
import { local } from "./storageUtil";
import { requestPermission, sendTestNotification, subscribe, type PushSurface, type SubscribeFailure } from "./notificationManager";

export type { PushSurface };

/** Set when an iOS member in a Safari tab asked for reminders: the installed app shows the opt-in on first open. */
export const REMINDER_INTENT_KEY = "skinlabs_reminder_intent";

export { reminderClockTime, reminderLabel, type ReminderTime } from "./reminderTime";

export const trackSoftAskShown = (surface: PushSurface) => trackPwaEvent("push_soft_ask_shown", { surface });
export const trackSoftAskAccepted = (surface: PushSurface) => trackPwaEvent("push_soft_ask_accepted", { surface });

/**
 * One RLS-safe upsert on notification_preferences. `enable` adds routine_reminder = true; without it only the
 * time is stored and the member's existing on/off choice is left alone.
 */
export const saveReminderPreference = async (userId: string, clockTime: string | null, enable: boolean): Promise<boolean> => {
  const row = { user_id: userId, ...(clockTime ? { routine_reminder_time: clockTime } : {}), ...(enable ? { routine_reminder: true } : {}) };
  const { error } = await supabase.from("notification_preferences").upsert(row, { onConflict: "user_id" });
  return !error;
};

/** Make sure the member's report-ready notifications are on (the column defaults to true; this makes it explicit). */
export const saveReportReadyPreference = async (userId: string): Promise<boolean> => {
  const { error } = await supabase.from("notification_preferences").upsert({ user_id: userId, report_ready: true }, { onConflict: "user_id" });
  return !error;
};

export type OptInPurpose = "routine_reminder" | "report_ready";

export type OptInFailure = SubscribeFailure | "blocked";
export type OptInResult = { ok: true; confirmed: boolean } | { ok: false; reason: OptInFailure };

/** Call ONLY from the click handler of our own "Allow reminders" button. */
export const runReminderOptIn = async (opts: { surface: PushSurface; userId: string; clockTime: string | null; purpose?: OptInPurpose }): Promise<OptInResult> => {
  const permission = await requestPermission(opts.surface);
  if (permission === "denied") return { ok: false, reason: "blocked" };
  if (permission !== "granted") return { ok: false, reason: "denied" };
  const subscribed = await subscribe(opts.surface);
  if (!subscribed.ok) return { ok: false, reason: subscribed.reason };
  if (opts.purpose === "report_ready") await saveReportReadyPreference(opts.userId);
  else await saveReminderPreference(opts.userId, opts.clockTime, true);
  local.remove(REMINDER_INTENT_KEY);
  // Confirmation push (best effort; the member sees it arrive on this device).
  const confirmed = await sendTestNotification();
  return { ok: true, confirmed };
};

export const flagReminderIntent = (clockTime: string | null) => local.set(REMINDER_INTENT_KEY, clockTime ?? "routine");
/** The flagged clock time, "routine" (use the saved time), or null when no intent was flagged. */
export const readReminderIntent = (): string | null => local.get(REMINDER_INTENT_KEY);
export const clearReminderIntent = () => local.remove(REMINDER_INTENT_KEY);
