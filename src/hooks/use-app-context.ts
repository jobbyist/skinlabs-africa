import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import type { SavedSmartRoutine } from "@/hooks/use-smart-routine";
import { useFormulatorAllowance } from "@/hooks/use-formulator-allowance";
import { ANALYSIS_PASSES_UPDATED_EVENT } from "@/hooks/use-analysis-passes";
import { useContentSignals } from "@/hooks/use-content-signals";
import { PROFILE_REQUIRED_FIELDS } from "@/hooks/use-profile-complete";
import { getSeasonNow } from "@/lib/context/season";
import {
  EMPTY_CONTEXT_FACTS,
  advancedStatusFromReports,
  deriveContextStates,
  isRoutineReviewDue,
  type ReportRow,
  latestAdvancedAt,
  newestOf,
  trialDaysLeftFrom,
  type ContextFacts,
} from "@/lib/context";
import { EMPTY_FACTS, gettingStartedChecklist, resolveJourneyStage, type JourneyFacts } from "@/lib/journey";
import type { LadderTier } from "@/lib/entitlements";
import { detectPlatform, isApplePlatform, readDetectionEnv } from "@/lib/pwa/detection";
import { getPushCapabilityNow } from "@/lib/pwa/pushCapability";
import { MEMBER_CONTEXT_CHANGED_EVENT, writeSkinProfileHint } from "@/lib/context/changeEvent";
import { captureLastVisit } from "@/lib/context/lastVisit";
import { bindLedgerToUser, getLedger, subscribeLedger } from "@/lib/context/ledgerStore";

/**
 * THE source of truth for "who is this member and where are they?".
 *
 * One cached read of the member's data (react-query, shared by every consumer on the
 * page) is turned into ContextFacts by the pure builders in src/lib/context, and the
 * rules (states, next best action, navigation, greetings) all read those facts. Don't
 * query profile / routine / analysis tables from a component to decide what to show:
 * add the fact here instead (docs/contextual-ux.md).
 *
 * Presentation only. Entitlements and RLS stay the real gates.
 */

/** Everything the dashboard shows from the member's own profile row. */
export const MEMBER_PROFILE_COLUMNS =
  "subscription_status, subscription_started_at, full_name, email, account_status, username, phone, date_of_birth, gender, skin_color, address_line1, city, weather_city_key, allergies, skin_conditions, preferred_routine_time, onboarding_completed_at, checklist_dismissed_at, app_installed_at";

export interface MemberProfile {
  subscription_status: string | null;
  subscription_started_at: string | null;
  full_name: string | null;
  email: string | null;
  account_status: string | null;
  username: string | null;
  phone: string | null;
  date_of_birth: string | null;
  gender: string | null;
  skin_color: string | null;
  address_line1: string | null;
  city: string | null;
  weather_city_key: string | null;
  allergies: string[] | null;
  skin_conditions: string[] | null;
  preferred_routine_time: string | null;
  onboarding_completed_at: string | null;
  checklist_dismissed_at: string | null;
  app_installed_at: string | null;
}

interface MemberCore {
  profile: MemberProfile | null;
  savedAnalyses: number;
  lastAnalysisAt: string | null;
  routineSteps: number;
  routineCheckins: number;
  lastCheckinDate: string | null;
  smartRoutine: SavedSmartRoutine | null;
  smartRoutineAccess: boolean;
  reports: ReportRow[];
  advancedAccess: { eligible: boolean; passes: number; open: boolean; reportMode: string } | null;
}

interface MemberSetup {
  savedItems: number;
  contentReads: number;
  hasPaymentOnFile: boolean;
  mfaEnabled: boolean;
  reminderDeviceActive: boolean;
}

const LIVE_SUB_STATUSES = ["pending", "trialing", "active", "past_due"];
/** Short enough that a change on another page shows quickly, long enough that remounts don't refetch. */
const STALE_MS = 20_000;

export const memberCoreKey = (userId: string | undefined) => ["member-context", "core", userId ?? "anon"] as const;
export const memberSetupKey = (userId: string | undefined) => ["member-context", "setup", userId ?? "anon"] as const;

/** Same device-local date key the routine tracker writes check-ins under. */
const localDateStr = (d: Date = new Date()): string => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const loadCore = async (userId: string): Promise<MemberCore> => {
  const [profile, analyses, steps, checkins, routine, access, smartAccess, reports] = await Promise.all([
    supabase.from("profiles").select(MEMBER_PROFILE_COLUMNS).eq("user_id", userId).maybeSingle(),
    supabase
      .from("skincare_recommendations")
      .select("created_at", { count: "exact" })
      .eq("user_id", userId)
      .eq("status", "delivered")
      .order("created_at", { ascending: false })
      .limit(1),
    // Seeded starter steps aren't the member saving a routine (mirrors is_trial_activated()).
    supabase.from("routine_steps").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("source", "default"),
    supabase.from("routine_checkins").select("checkin_date", { count: "exact" }).eq("user_id", userId).order("checkin_date", { ascending: false }).limit(1),
    supabase.from("smart_routines").select("*").eq("user_id", userId).maybeSingle(),
    Promise.resolve(supabase.rpc("get_advanced_assessment_access")).catch(() => ({ data: null })),
    Promise.resolve(supabase.rpc("get_smart_routine_access")).catch(() => ({ data: false })),
    supabase
      .from("advanced_assessment_reports")
      .select("id, session_id, reference_number, generation_status, review_status, processing_mode, intake_status, submitted_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);
  // A failed read must not be mistaken for "the member has done nothing": that would tell someone with an
  // analysis to take one. Throw so react-query keeps any earlier data and the UI says it couldn't load.
  const failed = [profile, analyses, steps, checkins, routine, reports].find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);
  const accessRow = Array.isArray(access.data) ? access.data[0] : access.data;
  return {
    profile: (profile.data as MemberProfile | null) ?? null,
    savedAnalyses: analyses.count ?? 0,
    lastAnalysisAt: analyses.data?.[0]?.created_at ?? null,
    routineSteps: steps.count ?? 0,
    routineCheckins: checkins.count ?? 0,
    lastCheckinDate: (checkins.data?.[0]?.checkin_date as string | undefined) ?? null,
    smartRoutine: (routine.data as unknown as SavedSmartRoutine | null) ?? null,
    smartRoutineAccess: smartAccess.data === true,
    reports: (reports.data ?? []) as unknown as ReportRow[],
    advancedAccess: accessRow
      ? {
          eligible: Boolean(accessRow.eligible),
          passes: Number(accessRow.passes_available ?? 0),
          open: accessRow.rollout_stage !== "disabled" && accessRow.report_mode !== "disabled",
          reportMode: String(accessRow.report_mode ?? ""),
        }
      : null,
  };
};

const loadSetup = async (userId: string): Promise<MemberSetup> => {
  const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
  const [saved, reads, subs, factors, devices] = await Promise.all([
    count(supabase.from("news_article_engagement").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("kind", "save")),
    count(supabase.from("member_content_reads").select("id", { count: "exact", head: true }).eq("user_id", userId)),
    count(supabase.from("payment_subscriptions").select("id", { count: "exact", head: true }).eq("user_id", userId).in("status", LIVE_SUB_STATUSES)),
    supabase.auth.mfa.listFactors().catch(() => ({ data: null })),
    // Server truth for "reminders on": an ACTIVE push device (members can't read push_subscriptions directly).
    Promise.resolve(supabase.rpc("list_my_push_devices")).then((r) => r.data ?? []).catch(() => []),
  ]);
  return {
    savedItems: saved,
    contentReads: reads,
    hasPaymentOnFile: subs > 0,
    mfaEnabled: Boolean(factors.data?.totp?.some((f) => f.status === "verified")),
    reminderDeviceActive: (devices as { is_active: boolean }[]).some((d) => d.is_active),
  };
};

const ladderTierFor = (signedIn: boolean, tier: "explorer" | "glow_lite" | "insider" | "vip"): LadderTier =>
  tier === "explorer" ? (signedIn ? "free" : "anonymous") : tier;

export { notifyMemberContextChanged } from "@/lib/context/changeEvent";

/** The shared member snapshot itself, for hooks that need a slice of it (same cache entry, no extra request). */
export const useMemberCore = () => {
  const { user, loading: authLoading } = useAuth();
  return useQuery({
    queryKey: memberCoreKey(user?.id),
    enabled: !authLoading && Boolean(user),
    staleTime: STALE_MS,
    queryFn: () => loadCore(user!.id),
  });
};

export interface AppContextOptions {
  /** Also load the Getting Started facts (saved items, content reads, card on file, MFA, push device). Dashboard only. */
  setup?: boolean;
  /** Read the briefing / episode signals (an extra cached request). Hero and dashboard only. */
  content?: boolean;
}

export const useAppContext = ({ setup = false, content = false }: AppContextOptions = {}) => {
  const { user, loading: authLoading } = useAuth();
  const membership = useMembership();
  const allowance = useFormulatorAllowance();
  const signals = useContentSignals({ enabled: content });
  const queryClient = useQueryClient();
  const userId = user?.id;
  const ledger = useSyncExternalStore(subscribeLedger, getLedger, getLedger);
  useEffect(() => bindLedgerToUser(userId), [userId]);
  // The visit before this one (captured once per page load), so a daily reader is never called inactive.
  const [previousVisit, setPreviousVisit] = useState<string | null>(null);
  useEffect(() => {
    if (userId) setPreviousVisit(captureLastVisit(userId, new Date().toISOString()));
  }, [userId]);

  const coreQuery = useQuery({
    queryKey: memberCoreKey(userId),
    enabled: !authLoading && Boolean(userId),
    staleTime: STALE_MS,
    queryFn: () => loadCore(userId as string),
  });
  const setupQuery = useQuery({
    queryKey: memberSetupKey(userId),
    enabled: setup && !authLoading && Boolean(userId),
    staleTime: STALE_MS,
    queryFn: () => loadSetup(userId as string),
  });

  const refresh = useCallback(() => queryClient.invalidateQueries({ queryKey: ["member-context"] }), [queryClient]);

  const refreshAllowance = allowance.refresh;
  useEffect(() => {
    // An Analysis Pass bought in a dialog changes the allowance too.
    const onPasses = () => {
      void refresh();
      void refreshAllowance();
    };
    window.addEventListener(MEMBER_CONTEXT_CHANGED_EVENT, refresh);
    window.addEventListener(ANALYSIS_PASSES_UPDATED_EVENT, onPasses);
    return () => {
      window.removeEventListener(MEMBER_CONTEXT_CHANGED_EVENT, refresh);
      window.removeEventListener(ANALYSIS_PASSES_UPDATED_EVENT, onPasses);
    };
  }, [refresh, refreshAllowance]);

  const core = coreQuery.data;
  useEffect(() => {
    if (userId && core) writeSkinProfileHint(userId, core.savedAnalyses > 0);
  }, [userId, core]);
  const setupData = setupQuery.data;

  const facts: ContextFacts = useMemo(() => {
    const now = new Date().toISOString();
    const signedIn = Boolean(userId);
    const tier = ladderTierFor(signedIn, membership.tier);
    const advancedStatus = advancedStatusFromReports(core?.reports ?? []);
    const lastAnalysisAt = core?.lastAnalysisAt ?? allowance.data?.lastAnalysisAt?.toISOString() ?? null;
    const profile = core?.profile ?? null;

    const journey: JourneyFacts = {
      ...EMPTY_FACTS,
      signedIn,
      hasLocalAnalysis: !signedIn && signals.analysisCompletedLocally,
      savedAnalyses: core?.savedAnalyses ?? 0,
      routineSteps: core?.routineSteps ?? 0,
      routineCheckins: core?.routineCheckins ?? 0,
      savedItems: setupData?.savedItems ?? 0,
      contentReads: setupData?.contentReads ?? 0,
      isTrialing: membership.isTrialing,
      trialUsed: membership.trialUsed,
      isPaid: !membership.isTrialing && membership.tier !== "explorer",
      hasPaymentOnFile: setupData?.hasPaymentOnFile ?? false,
      weatherCitySet: Boolean(profile?.weather_city_key),
      mfaEnabled: setupData?.mfaEnabled ?? false,
      reminderPushAvailable: getPushCapabilityNow() !== "unsupported",
      reminderDeviceActive: setupData?.reminderDeviceActive ?? false,
      reminderIosDevice: isApplePlatform(detectPlatform(readDetectionEnv())),
      appInstalled: Boolean(profile?.app_installed_at),
    };

    const base = EMPTY_CONTEXT_FACTS(journey, now);
    const profileComplete =
      Boolean(profile) && PROFILE_REQUIRED_FIELDS.every((f) => String((profile as unknown as Record<string, string | null>)[f.key] ?? "").trim());

    return {
      ...base,
      tier,
      trialDaysLeft: membership.isTrialing ? trialDaysLeftFrom(membership.trialEndsAt, now) : null,
      profileComplete,
      onboardingCompleted: Boolean(profile?.onboarding_completed_at),
      analysisDraft: signals.analysisDraft,
      lastAnalysisAt,
      // null until the allowance is known; a spent weekly allowance means "not available now".
      analysisAvailableNow: allowance.data ? !allowance.data.locked : null,
      advancedStatus,
      advancedResultViewed: Boolean(ledger.advanced_review?.completedAt),
      analysisPasses: core?.advancedAccess?.passes ?? allowance.data?.passBalance ?? 0,
      advancedOpen: Boolean(core?.advancedAccess?.open),
      smartRoutineAccess: core?.smartRoutineAccess ?? false,
      smartRoutineSaved: Boolean(core?.smartRoutine),
      routineReviewDue: isRoutineReviewDue({
        routine: core?.smartRoutine ?? null,
        lastAnalysisAt,
        latestAdvancedAt: latestAdvancedAt(core?.reports ?? []),
        advancedStatus,
        now,
      }),
      checkedInToday: core?.lastCheckinDate === localDateStr(),
      lastActiveAt: newestOf(core?.lastCheckinDate ? `${core.lastCheckinDate}T12:00:00Z` : null, lastAnalysisAt, previousVisit),
      recentReviewViews: signals.recentReviewViews,
      unreadBriefing: signals.briefing && !signals.briefingStarted ? signals.briefing : null,
      startedBriefing: signals.briefing && signals.briefingStarted ? signals.briefing : null,
      podcastInProgress: signals.podcastInProgress,
      latestEpisode: signals.latestEpisode,
      season: getSeasonNow(),
    };
    // coreQuery.dataUpdatedAt re-stamps `now` whenever fresh data arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, membership.tier, membership.isTrialing, membership.trialUsed, membership.trialEndsAt, core, setupData, allowance.data, signals, ledger, previousVisit, coreQuery.dataUpdatedAt]);

  // Once a read has failed with nothing cached, stay "unavailable" until data actually arrives: a retry in flight
  // (react-query flips back to pending) must not briefly fall back to guessing from empty facts.
  const sawFailure = useRef(false);
  if (coreQuery.isError && !core) sawFailure.current = true;
  if (core || !userId) sawFailure.current = false;
  const unavailable = sawFailure.current;

  const states = useMemo(() => deriveContextStates(facts), [facts]);
  const stage = resolveJourneyStage(facts.journey);
  const loading = authLoading || membership.loading || (Boolean(userId) && coreQuery.isLoading) || (setup && Boolean(userId) && setupQuery.isLoading);

  return {
    loading,
    /** The snapshot couldn't be read and there is nothing cached to fall back on: make no claims about the member. */
    unavailable,
    isSignedIn: Boolean(userId),
    facts,
    states,
    stage,
    profile: core?.profile ?? null,
    checklist: gettingStartedChecklist(facts.journey),
    checklistDismissedAt: core?.profile?.checklist_dismissed_at ?? null,
    /** Re-read after the member did something (invalidates the shared snapshot; every consumer updates). */
    refresh,
    /** Patch the cached profile after a successful profile write, so no refetch is needed. */
    patchProfile: (patch: Partial<MemberProfile>) => {
      if (!userId) return;
      queryClient.setQueryData<MemberCore>(memberCoreKey(userId), (c) => (c?.profile ? { ...c, profile: { ...c.profile, ...patch } } : c));
    },
  };
};
