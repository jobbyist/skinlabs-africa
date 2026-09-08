import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

export interface RoutineStep {
  id: string;
  step_name: string;
  product_name: string | null;
  time_of_day: "am" | "pm" | "both";
  sort_order: number;
}

const DEFAULT_STEPS: Array<Pick<RoutineStep, "step_name" | "time_of_day">> = [
  { step_name: "Cleanser", time_of_day: "both" },
  { step_name: "Serum", time_of_day: "both" },
  { step_name: "Moisturiser", time_of_day: "both" },
  { step_name: "Sunscreen", time_of_day: "am" },
];

const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * A member's own AM/PM routine checklist. Steps are user-authored (no
 * fabricated product data), and each step can be ticked off per time-slot,
 * per day — the checkin log also powers a simple daily-completion streak.
 */
export const useRoutine = () => {
  const { user } = useAuth();
  const [steps, setSteps] = useState<RoutineStep[]>([]);
  const [todayCheckins, setTodayCheckins] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

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
      .select("id, step_name, product_name, time_of_day, sort_order")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true });

    let finalSteps = (stepRows ?? []) as RoutineStep[];

    // First visit: seed a sensible default AM/PM routine the member can edit freely.
    if (finalSteps.length === 0) {
      const inserted = await supabase
        .from("routine_steps")
        .insert(DEFAULT_STEPS.map((s, i) => ({ user_id: user.id, step_name: s.step_name, time_of_day: s.time_of_day, sort_order: i })))
        .select("id, step_name, product_name, time_of_day, sort_order");
      finalSteps = (inserted.data ?? []) as RoutineStep[];
    }
    setSteps(finalSteps);

    const { data: checkinRows } = await supabase
      .from("routine_checkins")
      .select("step_id, time_slot, checkin_date")
      .eq("user_id", user.id)
      .eq("checkin_date", todayIso());
    setTodayCheckins(new Set((checkinRows ?? []).map((c) => `${c.step_id}:${c.time_slot}`)));

    // Streak: consecutive days (up to 60 back) with at least one checkin.
    const { data: history } = await supabase
      .from("routine_checkins")
      .select("checkin_date")
      .eq("user_id", user.id)
      .order("checkin_date", { ascending: false })
      .limit(500);
    const daySet = new Set((history ?? []).map((h) => h.checkin_date as string));
    const daySet = new Set((history ?? []).map((h) => h.checkin_date as string));
    let streakCount = 0;
    const today = todayIso();
    const cursor = new Date(today + "T00:00:00Z");
    while (daySet.has(cursor.toISOString().slice(0, 10))) {
      streakCount += 1;
      cursor.setUTCDate(cursor.getUTCDate() - 1);
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
    void load();
  };

  const removeStep = async (id: string) => {
    await supabase.from("routine_steps").delete().eq("id", id);
    void load();
  };

  const toggleCheckin = async (stepId: string, slot: "am" | "pm") => {
    if (!user) return;
    const key = `${stepId}:${slot}`;
    const isDone = todayCheckins.has(key);
    setTodayCheckins((prev) => {
      const next = new Set(prev);
      if (isDone) next.delete(key);
      else next.add(key);
      return next;
    });
    if (isDone) {
      await supabase
        .from("routine_checkins")
        .delete()
        .eq("user_id", user.id)
        .eq("step_id", stepId)
        .eq("time_slot", slot)
        .eq("checkin_date", todayIso());
    } else {
      const { error } = await supabase.from("routine_checkins").insert({ user_id: user.id, step_id: stepId, time_slot: slot });
      if (error && !error.message?.includes('duplicate')) {
        toast.error("Could not save checkin");
        setTodayCheckins(prev => { const next = new Set(prev); next.delete(key); return next; });
        return;
      }
    }
    void load();
  };

  const amSteps = useMemo(() => steps.filter((s) => s.time_of_day === "am" || s.time_of_day === "both"), [steps]);
  const pmSteps = useMemo(() => steps.filter((s) => s.time_of_day === "pm" || s.time_of_day === "both"), [steps]);
  const todayDone = todayCheckins.size;
  const todayTotal = amSteps.length + pmSteps.length;

  return {
    steps,
    amSteps,
    pmSteps,
    loading,
    streak,
    todayCheckins,
    todayDone,
    todayTotal,
    isChecked: (stepId: string, slot: "am" | "pm") => todayCheckins.has(`${stepId}:${slot}`),
    addStep,
    removeStep,
    toggleCheckin,
    refresh: load,
  };
};
