import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useMembership } from "@/hooks/use-membership";
import {
  EMPTY_FACTS,
  gettingStartedChecklist,
  nextBestAction,
  resolveJourneyStage,
  type JourneyFacts,
} from "@/lib/journey";
import { detectPlatform, isApplePlatform, readDetectionEnv } from "@/lib/pwa/detection";
import { getPushCapabilityNow } from "@/lib/pwa/pushCapability";
import { loadCompletedState } from "@/lib/starter-analysis/persistence";

const LIVE_SUB_STATUSES = ["pending", "trialing", "active", "past_due"];

/**
 * Gathers JourneyFacts for the signed-in member from existing tables and
 * hooks, then resolves the stage, next best action and checklist through the
 * pure rules in src/lib/journey.ts. `refresh()` re-reads after an action.
 */
export const useJourney = () => {
  const { user, loading: authLoading } = useAuth();
  const membership = useMembership();
  const [counts, setCounts] = useState<Omit<JourneyFacts, "signedIn" | "hasLocalAnalysis" | "isTrialing" | "trialUsed" | "isPaid"> | null>(null);
  const [checklistDismissedAt, setChecklistDismissedAt] = useState<string | null>(null);
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setCounts(null);
      return;
    }
    let cancelled = false;
    const count = (q: PromiseLike<{ count: number | null }>) => Promise.resolve(q).then((r) => r.count ?? 0);
    (async () => {
      const [analyses, steps, checkins, saved, reads, subs, profile, factors, devices] = await Promise.all([
        count(
          supabase
            .from("skincare_recommendations")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("status", "delivered"),
        ),
        // Seeded starter steps aren't the member saving a routine (mirrors is_trial_activated()).
        count(supabase.from("routine_steps").select("id", { count: "exact", head: true }).eq("user_id", user.id).neq("source", "default")),
        count(supabase.from("routine_checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
        count(
          supabase
            .from("news_article_engagement")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .eq("kind", "save"),
        ),
        count(supabase.from("member_content_reads").select("id", { count: "exact", head: true }).eq("user_id", user.id)),
        count(
          supabase
            .from("payment_subscriptions")
            .select("id", { count: "exact", head: true })
            .eq("user_id", user.id)
            .in("status", LIVE_SUB_STATUSES),
        ),
        supabase.from("profiles").select("weather_city_key, checklist_dismissed_at, app_installed_at").eq("user_id", user.id).maybeSingle(),
        supabase.auth.mfa.listFactors().catch(() => ({ data: null })),
        // Server truth for "reminders on": an ACTIVE push device (members can't read push_subscriptions directly).
        Promise.resolve(supabase.rpc("list_my_push_devices")).then((r) => r.data ?? []).catch(() => []),
      ]);
      if (cancelled) return;
      setChecklistDismissedAt(profile.data?.checklist_dismissed_at ?? null);
      setCounts({
        savedAnalyses: analyses,
        routineSteps: steps,
        routineCheckins: checkins,
        savedItems: saved,
        contentReads: reads,
        hasPaymentOnFile: subs > 0,
        weatherCitySet: Boolean(profile.data?.weather_city_key),
        mfaEnabled: Boolean(factors.data?.totp?.some((f) => f.status === "verified")),
        reminderPushAvailable: getPushCapabilityNow() !== "unsupported",
        reminderDeviceActive: (devices as { is_active: boolean }[]).some((d) => d.is_active),
        reminderIosDevice: isApplePlatform(detectPlatform(readDetectionEnv())),
        appInstalled: Boolean(profile.data?.app_installed_at),
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading, nonce]);

  const facts: JourneyFacts = {
    ...EMPTY_FACTS,
    ...(counts ?? {}),
    signedIn: Boolean(user),
    hasLocalAnalysis: !user && Boolean(loadCompletedState()?.result),
    isTrialing: membership.isTrialing,
    trialUsed: membership.trialUsed,
    isPaid: !membership.isTrialing && membership.tier !== "explorer",
  };
  const stage = resolveJourneyStage(facts);

  const dismissChecklist = useCallback(async () => {
    if (!user) return false;
    const at = new Date().toISOString();
    const { error } = await supabase.from("profiles").update({ checklist_dismissed_at: at }).eq("user_id", user.id);
    if (!error) setChecklistDismissedAt(at);
    return !error;
  }, [user]);

  return {
    loading: authLoading || membership.loading || (Boolean(user) && counts === null),
    facts,
    stage,
    nextAction: nextBestAction(stage, facts),
    checklist: gettingStartedChecklist(facts),
    checklistDismissedAt,
    dismissChecklist,
    refresh: () => setNonce((n) => n + 1),
  };
};
