import { useCallback, useEffect, useMemo, useRef, useSyncExternalStore } from "react";
import { useAppContext } from "@/hooks/use-app-context";
import { resolveContext, recordClicked, recordCompleted, recordDismissed, recordShown } from "@/lib/context";
import type { ResolvedAction, Surface } from "@/lib/context";
import { getLedger, subscribeLedger, updateLedger } from "@/lib/context/ledgerStore";
import { trackContextEvent } from "@/lib/context/analytics";
import { ACTIONS } from "@/lib/context";

const completesOnClick = new Set(ACTIONS.filter((a) => a.completeOnClick).map((a) => a.id));

/**
 * The next best action for a surface, with CTA-fatigue bookkeeping and analytics.
 *
 *   const { primary, secondary, loading, click, dismiss } = useContextualActions("dashboard");
 *
 * Render `primary` (and at most the `secondary` list) and call `click(action)` when it
 * is used. Impressions are recorded once per action per day; dismissing hides an
 * action for its cooldown everywhere. Rules live in src/lib/context/actions.ts.
 */
export const useContextualActions = (surface: Surface, options: { secondaryLimit?: number; setup?: boolean; content?: boolean } = {}) => {
  const ctx = useAppContext({ setup: options.setup, content: options.content });
  const ledger = useSyncExternalStore(subscribeLedger, getLedger, getLedger);
  const { facts, loading } = ctx;

  const resolution = useMemo(
    () =>
      // If the member's data couldn't be read, say nothing rather than guess (a guess would re-ask for things already done).
      ctx.unavailable
        ? { states: new Set<never>() as ReadonlySet<never>, primary: null, secondary: [] as ResolvedAction[], suppressed: [] as { id: string; reason: "completed" }[] }
        : resolveContext(facts, { surface, ledger, secondaryLimit: options.secondaryLimit }),
    [facts, surface, ledger, options.secondaryLimit, ctx.unavailable],
  );

  // Impressions: once per action per day, only when the member is actually seeing the result.
  const reportedRef = useRef(new Set<string>());
  useEffect(() => {
    if (loading) return;
    const shown = [resolution.primary, ...resolution.secondary].filter((a): a is ResolvedAction => Boolean(a));
    for (const [i, a] of shown.entries()) {
      const key = `${surface}:${a.id}`;
      if (reportedRef.current.has(key)) continue;
      reportedRef.current.add(key);
      updateLedger((l) => recordShown(l, a.id, facts.now));
      const discovery = a.feature === "ingredients" || a.feature === "discovery";
      trackContextEvent(discovery ? "feature_discovery_shown" : "contextual_cta_shown", { action: a.id, surface, feature: a.feature });
      if (i === 0 && surface === "dashboard") trackContextEvent("dashboard_primary_action_shown", { action: a.id, feature: a.feature });
    }
    // Completed actions are replaced, not repeated: report each replacement once.
    for (const sup of resolution.suppressed.filter((x) => x.reason === "completed")) {
      const key = `${surface}:done:${sup.id}`;
      if (reportedRef.current.has(key)) continue;
      reportedRef.current.add(key);
      trackContextEvent("contextual_cta_suppressed", { action: sup.id, surface, reason: "completed" });
    }
    const fatigued = resolution.suppressed.filter((s) => s.reason === "fatigued" || s.reason === "dismissed");
    for (const s of fatigued) {
      const key = `${surface}:sup:${s.id}`;
      if (reportedRef.current.has(key)) continue;
      reportedRef.current.add(key);
      trackContextEvent("cta_repetition_suppressed", { action: s.id, surface, reason: s.reason });
    }
  }, [resolution, loading, surface, facts.now]);

  const click = useCallback(
    (a: ResolvedAction) => {
      updateLedger((l) => {
        const clicked = recordClicked(l, a.id, new Date().toISOString());
        return completesOnClick.has(a.id) ? recordCompleted(clicked, a.id, new Date().toISOString()) : clicked;
      });
      const discovery = a.feature === "ingredients" || a.feature === "discovery";
      trackContextEvent(discovery ? "feature_discovery_clicked" : "contextual_cta_clicked", { action: a.id, surface, feature: a.feature });
      if (surface === "dashboard" && resolution.primary?.id === a.id) trackContextEvent("dashboard_primary_action_clicked", { action: a.id, feature: a.feature });
    },
    [surface, resolution.primary?.id],
  );

  const dismiss = useCallback(
    (a: ResolvedAction) => {
      updateLedger((l) => recordDismissed(l, a.id, new Date().toISOString()));
      trackContextEvent("contextual_cta_dismissed", { action: a.id, surface, feature: a.feature });
    },
    [surface],
  );

  return { ...ctx, primary: resolution.primary, secondary: resolution.secondary, suppressed: resolution.suppressed, click, dismiss };
};
