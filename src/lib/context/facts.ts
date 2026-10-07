import { getReportDisplayStatus } from "@/lib/assessment/types";
import type { AdvancedStatus } from "./types";
import { daysSince } from "./states";

/** A routine untouched this long is worth a gentle review even without a new analysis. */
export const ROUTINE_REVIEW_AFTER_DAYS = 60;

export type ReportRow = Parameters<typeof getReportDisplayStatus>[0] & {
  id?: string;
  session_id?: string;
  reference_number?: string | null;
  submitted_at?: string | null;
  created_at?: string | null;
};

/**
 * Lifecycle of the member's Advanced submissions: a released result wins, then
 * anything still being worked on. Failed / not-released submissions were refunded,
 * so they read as "none" (the member can start again).
 */
export const advancedStatusFromReports = (reports: ReportRow[]): AdvancedStatus => {
  const statuses = reports.map((r) => getReportDisplayStatus(r));
  if (statuses.includes("ready")) return "ready";
  if (statuses.some((s) => s === "pending_intake" || s === "preparing" || s === "in_review")) return "pending";
  return "none";
};

/** Newest submission time among reports that count (not failed / not released). */
export const latestAdvancedAt = (reports: ReportRow[]): string | null => {
  const times = reports
    .filter((r) => {
      const s = getReportDisplayStatus(r);
      return s !== "failed" && s !== "not_released";
    })
    .map((r) => r.submitted_at ?? r.created_at ?? null)
    .filter((t): t is string => Boolean(t))
    .sort();
  return times.length ? times[times.length - 1] : null;
};

/**
 * Is the Smart Routine out of date? A newer Basic analysis or Advanced submission
 * exists since it was built, an approved report can replace a rule-based routine,
 * or it simply hasn't been touched for a while.
 */
export const isRoutineReviewDue = (args: {
  routine: { updated_at: string; source: string } | null;
  lastAnalysisAt: string | null;
  latestAdvancedAt: string | null;
  advancedStatus: AdvancedStatus;
  now: string;
}): boolean => {
  const { routine } = args;
  if (!routine) return false;
  const builtAt = Date.parse(routine.updated_at);
  if ([args.lastAnalysisAt, args.latestAdvancedAt].some((t) => t && Date.parse(t) > builtAt)) return true;
  if (routine.source === "rule_based" && args.advancedStatus === "ready") return true;
  const age = daysSince(routine.updated_at, args.now);
  return age !== null && age >= ROUTINE_REVIEW_AFTER_DAYS;
};

/** Whole SAST calendar days from `now` to `endsAt` (never negative), or null when there is no end. */
export const trialDaysLeftFrom = (endsAt: string | null, now: string): number | null => {
  if (!endsAt) return null;
  const sastDate = (iso: string) => new Date(Date.parse(iso) + 2 * 3_600_000).toISOString().slice(0, 10);
  const diff = Math.round((Date.parse(sastDate(endsAt)) - Date.parse(sastDate(now))) / 86_400_000);
  return Math.max(0, diff);
};

/** The newest of the activity timestamps we can see server-side. */
export const newestOf = (...times: (string | null | undefined)[]): string | null => {
  const valid = times.filter((t): t is string => Boolean(t) && !Number.isNaN(Date.parse(t as string)));
  return valid.length ? valid.sort()[valid.length - 1] : null;
};
