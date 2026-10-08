/**
 * Pure rules for the admin Notifications area (Admin → Notifications). Everything the area does goes through the admin
 * RPCs of the notification engine (each re-checks the admin role in SQL); this module only shapes inputs and reads outputs.
 * Unit tested in notificationAdmin.test.ts.
 */
import { isSafeReturnTo } from "./pendingIntent";

export const TITLE_MAX = 80;
export const BODY_MAX = 240;
export const NAME_MAX = 120;
export const INBOX_TITLE_MAX = 120;
export const INBOX_BODY_MAX = 600;
/** Above this many recipients the server demands the typed audience size (`p_confirm_recipients`). */
export const BULK_CONFIRM_ABOVE = 50;

export const CATEGORIES = ["podcast_episode", "briefing", "routine_reminder", "account_update", "promotional", "service", "report_ready", "skin_weather", "journal_reminder", "price_alert", "community"] as const;
export type Category = (typeof CATEGORIES)[number];
export const CHANNELS = ["inbox", "push"] as const;
export type Channel = (typeof CHANNELS)[number];

/** Categories whose lock-screen text must stay generic (no condition, product, ingredient, score or result). */
export const HEALTH_CATEGORIES: readonly Category[] = ["report_ready", "skin_weather", "journal_reminder", "routine_reminder"];
export const isHealthCategory = (c: string): boolean => (HEALTH_CATEGORIES as readonly string[]).includes(c);

export const TIERS = [
  { value: "free", label: "Glow Explorer (free)" },
  { value: "trial", label: "On a free trial" },
  { value: "glow_lite", label: "Glow Lite" },
  { value: "insider", label: "Glow Insider" },
  { value: "vip", label: "Glow VIP" },
] as const;
export const PLATFORMS = ["android", "ios", "windows", "macos", "linux", "chromeos"] as const;

/** The audience JSON understood by notification_audience_user_ids(). Unknown keys are never sent. */
export interface AudienceForm {
  tiers: string[];
  platforms: string[];
  cities: string[];
  /** "any" leaves the filter out. */
  pushEnabled: "any" | "yes" | "no";
  installed: "any" | "yes" | "no";
  foundingMember: "any" | "yes" | "no";
  signedUpAfter: string;
  signedUpBefore: string;
  activeWithinDays: string;
  inactiveForDays: string;
  trialEndsWithinDays: string;
}
export const emptyAudience = (): AudienceForm => ({
  tiers: [],
  platforms: [],
  cities: [],
  pushEnabled: "any",
  installed: "any",
  foundingMember: "any",
  signedUpAfter: "",
  signedUpBefore: "",
  activeWithinDays: "",
  inactiveForDays: "",
  trialEndsWithinDays: "",
});

const tri = (v: AudienceForm["pushEnabled"]): boolean | undefined => (v === "yes" ? true : v === "no" ? false : undefined);
const days = (v: string): number | undefined => {
  const n = Number(v);
  return v.trim() !== "" && Number.isInteger(n) && n >= 1 && n <= 3650 ? n : undefined;
};
const dayStartSast = (v: string): string | undefined => (/^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T00:00:00+02:00`).toISOString() : undefined);

/** Only the filters the admin actually set: an empty object means "every active member". */
export const buildAudience = (f: AudienceForm): Record<string, unknown> => {
  const out: Record<string, unknown> = {};
  if (f.tiers.length) out.tiers = f.tiers;
  if (f.platforms.length) out.platforms = f.platforms;
  if (f.cities.length) out.cities = f.cities;
  if (tri(f.pushEnabled) !== undefined) out.push_enabled = tri(f.pushEnabled);
  if (tri(f.installed) !== undefined) out.installed = tri(f.installed);
  if (tri(f.foundingMember) !== undefined) out.founding_member = tri(f.foundingMember);
  const after = dayStartSast(f.signedUpAfter);
  const before = dayStartSast(f.signedUpBefore);
  if (after) out.signed_up_after = after;
  if (before) out.signed_up_before = before;
  if (days(f.activeWithinDays) !== undefined) out.active_within_days = days(f.activeWithinDays);
  if (days(f.inactiveForDays) !== undefined) out.inactive_for_days = days(f.inactiveForDays);
  if (days(f.trialEndsWithinDays) !== undefined) out.trial_ends_within_days = days(f.trialEndsWithinDays);
  return out;
};

const triOf = (v: unknown): AudienceForm["pushEnabled"] => (v === true ? "yes" : v === false ? "no" : "any");
const dateOf = (v: unknown): string => {
  const t = typeof v === "string" ? Date.parse(v) : NaN;
  return Number.isFinite(t) ? new Date(t + 2 * 3_600_000).toISOString().slice(0, 10) : "";
};
const strs = (v: unknown): string[] => (Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : []);
const dayStr = (v: unknown): string => (typeof v === "number" && Number.isFinite(v) ? String(v) : "");

/** The reverse of buildAudience (to edit a saved draft). */
export const audienceToForm = (a: unknown): AudienceForm => {
  const j = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
  return {
    tiers: strs(j.tiers),
    platforms: strs(j.platforms),
    cities: strs(j.cities),
    pushEnabled: triOf(j.push_enabled),
    installed: triOf(j.installed),
    foundingMember: triOf(j.founding_member),
    signedUpAfter: dateOf(j.signed_up_after),
    signedUpBefore: dateOf(j.signed_up_before),
    activeWithinDays: dayStr(j.active_within_days),
    inactiveForDays: dayStr(j.inactive_for_days),
    trialEndsWithinDays: dayStr(j.trial_ends_within_days),
  };
};

export const describeAudience = (a: unknown): string => {
  const j = (a && typeof a === "object" ? a : {}) as Record<string, unknown>;
  const parts: string[] = [];
  if (strs(j.tiers).length) parts.push(`plan: ${strs(j.tiers).join(", ")}`);
  if (strs(j.platforms).length) parts.push(`platform: ${strs(j.platforms).join(", ")}`);
  if (strs(j.cities).length) parts.push(`city: ${strs(j.cities).join(", ")}`);
  if (typeof j.push_enabled === "boolean") parts.push(j.push_enabled ? "push on" : "no push device");
  if (typeof j.installed === "boolean") parts.push(j.installed ? "app installed" : "app not installed");
  if (typeof j.founding_member === "boolean") parts.push(j.founding_member ? "founding members" : "not founding members");
  if (j.signed_up_after) parts.push(`signed up from ${dateOf(j.signed_up_after)}`);
  if (j.signed_up_before) parts.push(`signed up before ${dateOf(j.signed_up_before)}`);
  if (typeof j.active_within_days === "number") parts.push(`active in the last ${j.active_within_days} days`);
  if (typeof j.inactive_for_days === "number") parts.push(`inactive for ${j.inactive_for_days}+ days`);
  if (typeof j.trial_ends_within_days === "number") parts.push(`trial ends within ${j.trial_ends_within_days} days`);
  return parts.length ? parts.join(" · ") : "Every active member";
};

export interface CampaignDraft {
  name: string;
  category: string;
  title: string;
  body: string;
  url: string;
  channels: string[];
}

/** A short list of problems (empty = fine). The database enforces the same limits; this just says so before the round trip. */
export const validateDraft = (d: CampaignDraft): string[] => {
  const problems: string[] = [];
  if (!d.name.trim()) problems.push("Give the campaign a name.");
  else if (d.name.trim().length > NAME_MAX) problems.push(`The name is limited to ${NAME_MAX} characters.`);
  if (!(CATEGORIES as readonly string[]).includes(d.category)) problems.push("Choose a category.");
  if (!d.title.trim()) problems.push("Add a title.");
  else if (d.title.trim().length > TITLE_MAX) problems.push(`The title is limited to ${TITLE_MAX} characters.`);
  if (!d.body.trim()) problems.push("Add a message.");
  else if (d.body.trim().length > BODY_MAX) problems.push(`The message is limited to ${BODY_MAX} characters.`);
  if (!isSafeReturnTo(d.url.trim())) problems.push("The link must be a path inside SkinLabs®, like /dashboard?tab=inbox.");
  if (d.channels.length === 0 || !d.channels.every((c) => (CHANNELS as readonly string[]).includes(c))) problems.push("Pick at least one channel: inbox, push or both.");
  return problems;
};

/** The server asks for the typed audience size above 50 recipients. */
export const needsTypedConfirmation = (recipients: number): boolean => recipients > BULK_CONFIRM_ABOVE;
export const confirmationMatches = (typed: string, recipients: number): boolean => typed.trim() === String(recipients);
/** What to pass as p_confirm_recipients: the audience size when bulk, otherwise nothing. */
export const confirmArg = (recipients: number): number | undefined => (needsTypedConfirmation(recipients) ? recipients : undefined);

/** "confirmation_required:123" (the server's message when the audience grew past what was confirmed) -> 123. */
export const parseConfirmationRequired = (message: string): number | null => {
  const m = /confirmation_required:(\d+)/.exec(message);
  return m ? Number(m[1]) : null;
};

/** The RPC's own error text, unchanged (a Postgrest error, an Error, or a string). */
export const rpcMessage = (error: unknown): string => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") return (error as { message: string }).message;
  return "Request failed";
};

/** "2026-10-05T09:00" typed in South African time (UTC+2, no daylight saving) -> a UTC ISO string; null if it isn't a date. */
export const sastToIso = (local: string): string | null => {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local)) return null;
  const t = Date.parse(`${local}:00+02:00`);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
};
export const isoToSastInput = (iso: string | null | undefined): string => {
  const t = iso ? Date.parse(iso) : NaN;
  return Number.isFinite(t) ? new Date(t + 2 * 3_600_000).toISOString().slice(0, 16) : "";
};
export const formatSast = (iso: string | null | undefined): string => {
  const t = iso ? Date.parse(iso) : NaN;
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }) + " SAST";
};

export type PreviewPlatform = "ios" | "android" | "desktop";
/** How much of the text each OS shows on a lock screen / banner (approximate: the point is to catch overlong copy). */
export const PREVIEW_LIMITS: Record<PreviewPlatform, { title: number; body: number }> = {
  ios: { title: 40, body: 130 },
  android: { title: 45, body: 170 },
  desktop: { title: 50, body: 110 },
};
const clip = (s: string, n: number): string => (s.length <= n ? s : `${s.slice(0, Math.max(0, n - 1)).trimEnd()}…`);
export const previewText = (platform: PreviewPlatform, title: string, body: string): { title: string; body: string; truncated: boolean } => {
  const lim = PREVIEW_LIMITS[platform];
  const t = clip(title.trim(), lim.title);
  const b = clip(body.trim(), lim.body);
  return { title: t, body: b, truncated: t !== title.trim() || b !== body.trim() };
};

export interface AudiencePreview {
  members: number;
  inbox_reachable: number;
  push_reachable: number;
  opted_out: number;
  by_platform: { label: string | null; count: number }[];
}
const num = (v: unknown): number => (typeof v === "number" && Number.isFinite(v) ? v : 0);
export const parseAudiencePreview = (raw: unknown): AudiencePreview | null => {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  if (typeof r.members !== "number") return null;
  return {
    members: num(r.members),
    inbox_reachable: num(r.inbox_reachable),
    push_reachable: num(r.push_reachable),
    opted_out: num(r.opted_out),
    by_platform: Array.isArray(r.by_platform) ? r.by_platform.map((x) => ({ label: typeof (x as { label?: unknown }).label === "string" ? (x as { label: string }).label : null, count: num((x as { count?: unknown }).count) })) : [],
  };
};

export const CAMPAIGN_STATUS: Record<string, { label: string; tone: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Draft", tone: "outline" },
  scheduled: { label: "Scheduled", tone: "secondary" },
  sending: { label: "Sending", tone: "secondary" },
  sent: { label: "Sent", tone: "default" },
  cancelled: { label: "Cancelled", tone: "destructive" },
};
export const canEditCampaign = (status: string): boolean => status === "draft";
export const canCancelCampaign = (c: { status: string; stats?: { pending?: number } }): boolean =>
  c.status === "draft" || c.status === "scheduled" || ((c.status === "sending" || c.status === "sent") && num(c.stats?.pending) > 0);

export const DISPATCH_STATUSES = ["pending", "processing", "sent", "partial", "failed", "skipped", "inbox_only", "cancelled"] as const;

/** Plain-language reasons for dispatches.skip_reason. */
export const SKIP_REASON_LABEL: Record<string, string> = {
  preference_off: "Member has this category off",
  daily_cap: "Member hit their daily limit",
  guard_failed: "No longer relevant when it came to send",
  no_devices: "No push device",
  expired: "Not sent within 24 hours",
};
