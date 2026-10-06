/**
 * Presentation helpers for the admin "App & installs" panel (components/admin/PwaAnalyticsPanel.tsx),
 * which reads admin_pwa_overview(). Pure and unit tested (src/lib/__tests__/pwaAnalytics.test.ts).
 */

export interface LabelCount {
  label: string;
  count: number;
}
export interface StageCount {
  stage: string;
  count: number;
}

export interface PwaOverviewTotals {
  installs: number;
  launches: number;
  launch_users: number;
  prompts_viewed: number;
  offline_sessions: number;
  updates_available: number;
  updates_applied: number;
  push_subscribed: number;
  downloads_completed: number;
  offline_plays: number;
  events: number;
}

export interface PwaOverview {
  window_days: number;
  totals: PwaOverviewTotals;
  install_funnel: StageCount[];
  prompt_outcomes: { outcome: string; count: number }[];
  prompt_by_kind: { kind: string; viewed: number; dismissed: number }[];
  installs_by_platform: LabelCount[];
  installs_by_device: LabelCount[];
  installs_by_browser: LabelCount[];
  launches_by_platform: LabelCount[];
  launches_by_device: LabelCount[];
  prompts_by_device: LabelCount[];
  push_funnel: StageCount[];
  push_by_platform: LabelCount[];
  offline_podcasts: StageCount[];
  daily: { day: string; installs: number; launches: number; prompts: number; push: number; downloads: number }[];
  by_event: { event_name: string; count: number; users: number; last_seen: string }[];
  display_mode: LabelCount[];
}

const PLATFORM_LABELS: Record<string, string> = {
  ios: "iPhone (iOS)",
  ipados: "iPad (iPadOS)",
  android: "Android",
  windows: "Windows",
  macos: "macOS",
  linux: "Linux",
  chromeos: "ChromeOS",
  unknown: "Unknown",
};
const BROWSER_LABELS: Record<string, string> = {
  safari: "Safari",
  chrome: "Chrome",
  edge: "Edge",
  firefox: "Firefox",
  samsung: "Samsung Internet",
  opera: "Opera",
  other: "Other",
};
const DEVICE_LABELS: Record<string, string> = { phone: "Phone", tablet: "Tablet", desktop: "Desktop", unknown: "Unknown" };
const KIND_LABELS: Record<string, string> = { native: "Browser install dialog", ios: "iOS Add to Home Screen steps", unknown: "Unknown" };

export type BreakdownKind = "platform" | "browser" | "device" | "kind";

export const prettyLabel = (kind: BreakdownKind, value: string): string => {
  const map = kind === "platform" ? PLATFORM_LABELS : kind === "browser" ? BROWSER_LABELS : kind === "device" ? DEVICE_LABELS : KIND_LABELS;
  return map[value] ?? value;
};

/** Whole-number percentage, or null when the denominator is zero (the UI shows "—", never 0% or NaN). */
export const percent = (part: number, whole: number): number | null =>
  whole > 0 ? Math.min(100, Math.round((part / whole) * 100)) : null;

export const formatPercent = (value: number | null): string => (value === null ? "—" : `${value}%`);

/** Conversion between consecutive stages of a funnel (null when the earlier stage is empty). */
export const stageRates = (stages: StageCount[]): (number | null)[] =>
  stages.map((s, i) => (i === 0 ? null : percent(Number(s.count), Number(stages[i - 1].count))));

export const sumCounts = (rows: LabelCount[]): number => rows.reduce((total, r) => total + Number(r.count), 0);

/** Relabels a breakdown for display and turns raw counts into shares of the total. */
export const withShares = (kind: BreakdownKind, rows: LabelCount[]): { label: string; count: number; share: number | null }[] => {
  const total = sumCounts(rows);
  return rows.map((r) => ({ label: prettyLabel(kind, r.label), count: Number(r.count), share: percent(Number(r.count), total) }));
};

/** Install prompts → installs over the window. The two come from different devices' sessions, so it's indicative. */
export const installRate = (t: Pick<PwaOverviewTotals, "installs" | "prompts_viewed">): number | null => percent(t.installs, t.prompts_viewed);

export const EVENT_DESCRIPTIONS: Record<string, string> = {
  pwa_install_prompt_viewed: "Branded install dialog shown",
  pwa_install_prompt_dismissed: "“Not now” / dialog closed",
  pwa_install_started: "Native install dialog opened",
  pwa_install_accepted: "Accepted the browser’s install dialog",
  pwa_install_declined: "Declined the browser’s install dialog",
  pwa_installed: "App installed (appinstalled)",
  pwa_launch: "Installed app launched (one per launch)",
  pwa_offline: "Went offline",
  pwa_online: "Back online",
  pwa_update_available: "New app version waiting",
  pwa_updated: "New app version applied",
  push_prompt_viewed: "Notification prompt shown",
  push_soft_ask_shown: "Reminder soft ask shown (split by surface)",
  push_soft_ask_accepted: "Reminder soft ask accepted (split by surface)",
  push_permission_granted: "Notification permission granted",
  push_permission_denied: "Notification permission denied",
  push_subscribed: "Device subscribed to push",
  push_unsubscribed: "Device unsubscribed from push",
  podcast_download_started: "Offline download started",
  podcast_download_completed: "Offline download finished",
  podcast_download_removed: "Offline download removed",
  podcast_offline_play: "Played a downloaded episode",
};
