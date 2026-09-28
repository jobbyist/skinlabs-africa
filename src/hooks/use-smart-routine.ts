import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/use-auth";
import { getAdvancedAssessmentReport } from "@/lib/assessment/client";
import { getReportDisplayStatus, type ReportRoutineStep } from "@/lib/assessment/types";
import { buildMemberSkinProfile, hasSkinProfile, type MemberSkinProfile } from "@/lib/skynn/memberSkinProfile";
import { buildSmartRoutine, fromReport, type SmartRoutine } from "@/lib/smartRoutine/engine";
import { trackSkynnEvent } from "@/lib/skynn/analytics";
import { trackConversionEvent } from "@/lib/analytics-events";

export interface SavedSmartRoutine {
  id: string;
  source: "rule_based" | "advanced_report";
  engine_version: string;
  basic_analysis_id: string | null;
  advanced_session_id: string | null;
  season: string | null;
  routine: SmartRoutine;
  created_at: string;
  updated_at: string;
}

interface Sources {
  basic: { id: string; created_at: string; mst_tone: number | null; result_payload: unknown } | null;
  advanced: { id: string; submitted_at: string | null; responses: Record<string, unknown> | null } | null;
  /** AM/PM steps from an approved, released Advanced report, when one exists. */
  reportRoutine: { am: ReportRoutineStep[]; pm: ReportRoutineStep[] } | null;
  allergies: string[] | null;
}

/**
 * Loads everything the dashboard personalises from — the member's own
 * submissions, never analytics — and their saved Smart Routine.
 */
export const useMemberSources = ({ withReport = true }: { withReport?: boolean } = {}) => {
  const { user } = useAuth();
  const [sources, setSources] = useState<Sources | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) {
      setSources(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [basicRes, reportsRes, profileRes] = await Promise.all([
      supabase
        .from("skincare_recommendations")
        .select("id, created_at, mst_tone, result_payload")
        .eq("user_id", user.id)
        .eq("status", "delivered")
        .not("result_payload", "is", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase
        .from("advanced_assessment_reports")
        .select("id, session_id, generation_status, review_status, processing_mode, intake_status, submitted_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
      supabase.from("profiles").select("allergies").eq("user_id", user.id).maybeSingle(),
    ]);

    const reports = (reportsRes.data ?? []).filter((r) => {
      const status = getReportDisplayStatus(r as never);
      return status !== "failed" && status !== "not_released";
    });
    const latest = reports[0] ?? null;
    let advanced: Sources["advanced"] = null;
    let reportRoutine: Sources["reportRoutine"] = null;
    if (latest) {
      const { data: session } = await supabase
        .from("advanced_assessment_sessions")
        .select("id, submitted_at, responses")
        .eq("id", latest.session_id)
        .maybeSingle();
      if (session) advanced = { id: session.id, submitted_at: session.submitted_at, responses: session.responses as Record<string, unknown> };
      // Only the Routine tab needs the released report; Home skips the edge call.
      if (withReport && getReportDisplayStatus(latest as never) === "ready") {
        try {
          const { report } = await getAdvancedAssessmentReport({ reportId: latest.id });
          const r = report.report as { routineAm?: ReportRoutineStep[]; routinePm?: ReportRoutineStep[] } | null;
          if (r?.routineAm?.length || r?.routinePm?.length) reportRoutine = { am: r.routineAm ?? [], pm: r.routinePm ?? [] };
        } catch {
          // Fall back to the rule-based routine.
        }
      }
    }
    setSources({
      basic: basicRes.data ?? null,
      advanced,
      reportRoutine,
      allergies: (profileRes.data?.allergies as string[] | null) ?? null,
    });
    setLoading(false);
  }, [user, withReport]);

  useEffect(() => {
    void load();
  }, [load]);

  const profile: MemberSkinProfile | null = useMemo(
    () =>
      sources
        ? buildMemberSkinProfile({ basic: sources.basic, advanced: sources.advanced, profileAllergies: sources.allergies })
        : null,
    [sources],
  );

  return { sources, profile, hasProfile: hasSkinProfile(profile), loading, refresh: load };
};

/** Smart Routines: access (server), the saved routine, and build/rebuild. */
export const useSmartRoutine = (options: { withReport?: boolean } = {}) => {
  const { user } = useAuth();
  const { sources, profile, loading: sourcesLoading, refresh: refreshSources } = useMemberSources(options);
  const [access, setAccess] = useState<boolean | null>(null);
  const [saved, setSaved] = useState<SavedSmartRoutine | null>(null);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user) {
      setAccess(false);
      setSaved(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const [{ data: allowed }, { data: row }] = await Promise.all([
      supabase.rpc("get_smart_routine_access"),
      supabase.from("smart_routines").select("*").eq("user_id", user.id).maybeSingle(),
    ]);
    setAccess(allowed === true);
    setSaved((row as unknown as SavedSmartRoutine | null) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  /** What a (re)build would produce right now. */
  const preview = useMemo<SmartRoutine | null>(() => {
    if (!profile) return null;
    return sources?.reportRoutine
      ? fromReport(profile, sources.reportRoutine.am, sources.reportRoutine.pm)
      : buildSmartRoutine(profile);
  }, [profile, sources]);

  /** A newer analysis, or an approved report, since the routine was built. */
  const stale = useMemo(() => {
    if (!saved) return false;
    const builtAt = new Date(saved.updated_at).getTime();
    const newer = [sources?.basic?.created_at, sources?.advanced?.submitted_at]
      .filter((d): d is string => Boolean(d))
      .some((d) => new Date(d).getTime() > builtAt);
    return newer || (saved.source === "rule_based" && Boolean(sources?.reportRoutine));
  }, [saved, sources]);

  const build = useCallback(async () => {
    if (!preview) return false;
    setBuilding(true);
    setError(null);
    const { error: rpcError } = await supabase.rpc("save_smart_routine", {
      p_routine: preview as unknown as Json,
      p_basic_analysis_id: sources?.basic?.id ?? undefined,
      p_advanced_session_id: sources?.advanced?.id ?? undefined,
    });
    setBuilding(false);
    if (rpcError) {
      setError(
        rpcError.message?.includes("smart_routine_locked")
          ? "Smart Routines unlock once you've submitted an Advanced AI Dermatology Analysis."
          : "Couldn't save your Smart Routine. Please try again.",
      );
      return false;
    }
    if (!saved) trackConversionEvent("smart_routines_generated", { source: preview.source });
    trackSkynnEvent(saved ? "skynn_smart_routine_rebuilt" : "skynn_smart_routine_generated", {
      routine_source: preview.source,
      count: preview.am.length + preview.pm.length,
    });
    await load();
    return true;
  }, [preview, sources, saved, load]);

  return {
    access,
    saved,
    preview,
    profile,
    sources,
    stale,
    loading: loading || sourcesLoading,
    building,
    error,
    build,
    refresh: async () => {
      await Promise.all([load(), refreshSources()]);
    },
  };
};
