import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";
import { notifyMemberContextChanged } from "@/lib/context/changeEvent";
import { trackConversionEvent } from "@/lib/analytics-events";
import { trackSkynnEvent } from "@/lib/skynn/analytics";

export interface RoutineStep {
  id: string;
  step_name: string;
  product_name: string | null;
  time_of_day: "am" | "pm" | "both";
  sort_order: number;
  /** manual = added by the member; default = seeded starter step; smart = from their Smart Routine. */
  source?: "manual" | "default" | "smart";
  guidance?: string | null;
  product_slug?: string | null;
}

const STEP_COLUMNS = "id, step_name, product_name, time_of_day, sort_order, source, guidance, product_slug";

const DEFAULT_STEPS: Array<Pick<RoutineStep, "step_name" | "time_of_day">> = [
  { step_name: "Cleanser", time_of_day: "both" },
  { step_name: "Serum", time_of_day: "both" },
  { step_name: "Moisturiser", time_of_day: "both" },
  { step_name: "Sunscreen", time_of_day: "am" },
];

/**
 * "Today" as the member's own wall-clock date, not UTC. `toISOString()`
 * normalises to UTC first, which silently shifts the day boundary for every
 * timezone ahead of UTC (all of South Africa, UTC+2) — a checkin made
 * between local midnight and 2am would otherwise land on what the server
 * considers "yesterday". Using the local getFullYear/getMonth/getDate parts
 * keeps the checkin, the "today" filter and the streak walk all agreeing on
 * the same calendar day the member actually experiences.
 */
const localDateStr = (d: Date = new Date()): string => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

/**
 * A member's own AM/PM routine checklist. Steps are user-authored (no
 * fabricated product data), and each step can be ticked off per time-slot,
 * per day — the checkin log also powers a simple daily-completion streak.
 */
export const useRoutine = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<Set<string>>(new Set());
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [firstCheckinJustDone, setFirstCheckinJustDone] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setSteps([]);
      setTodayCheckins(new Set());
      setStreak(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data: stepRows } = await supabase
      .from("routine_steps")
      .select(STEP_COLUMNS)
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    let finalSteps = (stepRows ?? []) as RoutineStep[];

    // First visit: seed a sensible default AM/PM routine the member can edit
    // freely. Marked `default` so it doesn't count as the member saving a
    // routine (is_trial_activated / journey.isActivated) and so a Smart
    // Routine replaces it.
    if (finalSteps.length === 0) {
      const inserted = await supabase
        .from("routine_steps")
        .insert(
          DEFAULT_STEPS.map((s, i) => ({ user_id: user.id, step_name: s.step_name, time_of_day: s.time_of_day, sort_order: i, source: "default" })),
        )
        .select(STEP_COLUMNS);
      finalSteps = (inserted.data ?? []) as RoutineStep[];
    }
    setSteps(finalSteps);

    const { data: checkinRows } = await supabase
      .from("routine_checkins")
      .select("step_id, time_slot, checkin_date")
      .eq("user_id", user.id)
      .eq("checkin_date", localDateStr());
    setTodayCheckins(new Set((checkinRows ?? []).map((c) => `${c.step_id}:${c.time_slot}`)));

    // Streak: consecutive days (up to 500 rows back) with at least one checkin.
    const { data: history } = await supabase
      .from("routine_checkins")
      .select("checkin_date")
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: false })
      .limit(500);
    const daySet = new Set((history ?? []).map((h) => h.checkin_date as string));
    let streakCount = 0;
    const cursor = new Date();
    while (daySet.has(localDateStr(cursor))) {
      streakCount += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    setStreak(streakCount);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

  const addStep = async (step_name: string, time_of_day: RoutineStep["time_of_day"], product_name?: string) => {
    if (!user) return;
    const { error } = await supabase.from("routine_steps").insert({
      user_id: user.id,
      step_name,
      time_of_day,
      product_name: product_name || null,
      sort_order: steps.length,
    });
    if (error) return toast.error("Could not add that step");
    trackConversionEvent("routine_saved", { routine_source: "manual" });
    notifyMemberContextChanged();
    void load();
  };

  /** Adopt the seeded starter steps as the member's own routine (default -> manual). */
  const saveStarterRoutine = async () => {
    if (!user) return false;
    const { error } = await supabase.from("routine_steps").update({ source: "manual" }).eq("user_id", user.id).eq("source", "default");
    if (error) {
      toast.error("Could not save your routine — please try again.");
      return false;
    }
    trackConversionEvent("routine_saved", { routine_source: "starter" });
    toast.success("Routine saved. Tick steps off each day to build your streak.");
    notifyMemberContextChanged();
    await load();
    return true;
  };

  const removeStep = async (id: string) => {
    await supabase.from("routine_steps").delete().eq("id", id);
    notifyMemberContextChanged();
    void load();
  };

  /**
   * Guarded against rapid double-clicks: a key already in flight is ignored
   * rather than re-read from a possibly-stale `todayCheckins` closure, which
   * previously let two quick clicks both see "not done" and both fire an
   * insert — the second failed its unique constraint silently, and if the
   * user's intent was actually on-then-off, the real toggle never happened.
   * A failed write now reverts the optimistic UI and tells the user, instead
   * of leaving the checkbox showing a state the database doesn't have.
   */
  const toggleCheckin = async (stepId: string, slot: "am" | "pm") => {
    if (!user) return;
    const key = `${stepId}:${slot}`;
    if (pendingKeys.has(key)) return;

    setPendingKeys((prev) => new Set(prev).add(key));
    const isDone = todayCheckins.has(key);
    setTodayCheckins((prev) => {
      const next = new Set(prev);
      if (isDone) next.delete(key);
      else next.add(key);
      return next;
    });

    const { error } = isDone
      ? await supabase
          .from("routine_checkins")
          .delete()
          .eq("user_id", user.id)
          .eq("step_id", stepId)
          .eq("time_slot", slot)
          .eq("checkin_date", localDateStr())
      : await supabase.from("routine_checkins").insert({
          user_id: user.id,
          step_id: stepId,
          time_slot: slot,
          checkin_date: localDateStr(),
        });

    setPendingKeys((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });

    if (error) {
      // Revert the optimistic flip — the database write didn't happen.
      setTodayCheckins((prev) => {
        const next = new Set(prev);
        if (isDone) next.add(key);
        else next.delete(key);
        return next;
      });
      toast.error("Could not update your routine — please try again.");
      return;
    }
    if (!isDone) {
      // First check-in EVER (server count, not a local guess): offer the nudge once, non-modally.
      const { count } = await supabase.from("routine_checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id);
      if (count === 1) setFirstCheckinJustDone(true);
      trackConversionEvent("routine_checkin_completed", { slot });
      if (steps.find((s) => s.id === stepId)?.source === "smart") {
        trackSkynnEvent("skynn_smart_routine_step_checked", { step: slot });
      }
    }
    // Home's next action moves on from "check in" once today's routine has been ticked.
    notifyMemberContextChanged();
    void load();
  };

  /** True while every step is still the seeded starter set (not yet "saved" by the member). */
  const isStarterOnly = steps.length > 0 && steps.every((s) => s.source === "default");

  const amSteps = useMemo(() => steps.filter((s) => s.time_of_day === "am" || s.time_of_day === "both"), [steps]);
  const pmSteps = useMemo(() => steps.filter((s) => s.time_of_day === "pm" || s.time_of_day === "both"), [steps]);
  const todayDone = todayCheckins.size;
  const todayTotal = amSteps.length + pmSteps.length;

  return {
    steps,
    isStarterOnly,
    amSteps,
    pmSteps,
    loading,
    streak,
    firstCheckinJustDone,
    dismissFirstCheckinNudge: () => setFirstCheckinJustDone(false),
    todayCheckins,
    todayDone,
    todayTotal,
    isChecked: (stepId: string, slot: "am" | "pm") => todayCheckins.has(`${stepId}:${slot}`),
    isPending: (stepId: string, slot: "am" | "pm") => pendingKeys.has(`${stepId}:${slot}`),
    addStep,
    saveStarterRoutine,
    removeStep,
    toggleCheckin,
    refresh: load,
  };
};
