import { describe, expect, test } from "bun:test";
import { EMPTY_FACTS, type JourneyFacts } from "@/lib/journey";
import {
  ACTIONS,
  EMPTY_CONTEXT_FACTS,
  contextualGreeting,
  contextualNavigation,
  deriveContextStates,
  emptyStateCopy,
  isFatigued,
  isNavTabActive,
  loadLedger,
  recordClicked,
  recordCompleted,
  recordDismissed,
  recordShown,
  resolveContext,
  saveLedger,
  sastDay,
  type ContextFacts,
  type CtaLedger,
  type Surface,
} from "@/lib/context";

const NOW = "2026-10-07T08:00:00.000Z";

/** Builder: start from a signed-in Explorer with nothing done, then override. */
const facts = (over: Partial<ContextFacts> & { j?: Partial<JourneyFacts> } = {}): ContextFacts => {
  const { j, ...rest } = over;
  const journey: JourneyFacts = { ...EMPTY_FACTS, signedIn: true, ...j };
  return { ...EMPTY_CONTEXT_FACTS(journey, NOW), tier: "free", onboardingCompleted: true, profileComplete: true, ...rest };
};

const primaryId = (f: ContextFacts, surface: Surface = "dashboard", ledger: CtaLedger = {}) =>
  resolveContext(f, { surface, ledger }).primary?.id ?? null;

describe("states", () => {
  test("a visitor with a finished local analysis counts as having done the Basic analysis", () => {
    const s = deriveContextStates({ ...facts(), journey: { ...EMPTY_FACTS, hasLocalAnalysis: true } });
    expect(s.has("VISITOR")).toBe(true);
    expect(s.has("BASIC_ANALYSIS_COMPLETED")).toBe(true);
  });

  test("a new Explorer is NEW_USER + FREE_MEMBER + BASIC_ANALYSIS_NOT_STARTED + ROUTINE_NOT_CREATED", () => {
    const s = deriveContextStates(facts());
    for (const st of ["NEW_USER", "FREE_MEMBER", "BASIC_ANALYSIS_NOT_STARTED", "ROUTINE_NOT_CREATED"] as const) expect(s.has(st)).toBe(true);
    expect(s.has("RETURNING_USER")).toBe(false);
  });

  test("states combine: Insider + Basic done + routine available + product research", () => {
    const s = deriveContextStates(
      facts({ tier: "insider", smartRoutineAccess: true, recentReviewViews: 4, j: { savedAnalyses: 1, routineSteps: 3, isPaid: true } }),
    );
    for (const st of ["INSIDER_MEMBER", "BASIC_ANALYSIS_COMPLETED", "ROUTINE_AVAILABLE", "PRODUCT_RESEARCHER", "CONFLICT_CHECK_AVAILABLE", "RETURNING_USER"] as const) {
      expect(s.has(st)).toBe(true);
    }
    expect(s.has("ROUTINE_NOT_CREATED")).toBe(false);
  });

  test("Conflict Matcher is Insider/VIP only", () => {
    const base = { j: { savedAnalyses: 1, routineSteps: 2 } };
    expect(deriveContextStates(facts({ ...base, tier: "glow_lite" })).has("CONFLICT_CHECK_AVAILABLE")).toBe(false);
    expect(deriveContextStates(facts({ ...base, tier: "vip" })).has("CONFLICT_CHECK_AVAILABLE")).toBe(true);
  });

  test("advanced lifecycle states", () => {
    expect(deriveContextStates(facts({ advancedOpen: true })).has("ADVANCED_ANALYSIS_AVAILABLE")).toBe(true);
    expect(deriveContextStates(facts({ advancedOpen: true, advancedStatus: "pending" })).has("ADVANCED_ANALYSIS_PENDING")).toBe(true);
    const done = deriveContextStates(facts({ advancedOpen: true, advancedStatus: "ready" }));
    expect(done.has("ADVANCED_ANALYSIS_COMPLETED")).toBe(true);
    expect(done.has("ADVANCED_ANALYSIS_AVAILABLE")).toBe(false);
  });

  test("inactive after 14 days; active explorer when recently engaged", () => {
    expect(deriveContextStates(facts({ lastActiveAt: "2026-09-20T00:00:00Z", j: { savedAnalyses: 1 } })).has("INACTIVE_USER")).toBe(true);
    const active = deriveContextStates(facts({ lastActiveAt: "2026-10-05T00:00:00Z", j: { savedAnalyses: 1, contentReads: 4 } }));
    expect(active.has("ACTIVE_EXPLORER")).toBe(true);
    expect(active.has("CONTENT_READER")).toBe(true);
    expect(active.has("INACTIVE_USER")).toBe(false);
  });

  test("trial and lapsed", () => {
    expect(deriveContextStates(facts({ tier: "insider", j: { isTrialing: true, trialUsed: true } })).has("TRIALING")).toBe(true);
    expect(deriveContextStates(facts({ j: { trialUsed: true } })).has("LAPSED")).toBe(true);
  });
});

describe("next best action by journey state", () => {
  test("NEW USER: take the Basic analysis", () => {
    expect(primaryId(facts())).toBe("start_basic");
  });

  test("a started draft is resumed before starting over", () => {
    expect(primaryId(facts({ analysisDraft: true }))).toBe("resume_basic");
  });

  test("visitor with a finished analysis is asked to save it", () => {
    const f = { ...facts(), journey: { ...EMPTY_FACTS, hasLocalAnalysis: true } };
    expect(primaryId(f)).toBe("save_analysis");
    expect(resolveContext(f, { surface: "dashboard" }).primary?.kind).toBe("signup");
  });

  test("BASIC COMPLETE, no routine: build the routine (never 'take the analysis' again)", () => {
    const f = facts({ smartRoutineAccess: true, advancedOpen: true, j: { savedAnalyses: 1 } });
    const r = resolveContext(f, { surface: "dashboard" });
    expect(r.primary?.id).toBe("build_routine");
    expect(r.suppressed).toContainEqual({ id: "start_basic", reason: "completed" });
    expect([r.primary, ...r.secondary].some((a) => a?.id === "start_basic")).toBe(false);
  });

  test("ADVANCED PENDING: view status, and 'try Advanced' is gone", () => {
    const f = facts({ smartRoutineAccess: true, advancedOpen: true, advancedStatus: "pending", analysisPasses: 0, j: { savedAnalyses: 1, routineSteps: 2 } });
    const r = resolveContext(f, { surface: "dashboard" });
    expect(r.primary?.id).toBe("advanced_status");
    expect([r.primary, ...r.secondary].map((a) => a?.id)).not.toContain("advanced_start");
    expect([r.primary, ...r.secondary].map((a) => a?.id)).not.toContain("advanced_get_pass");
  });

  test("ADVANCED READY, not yet opened: review the results", () => {
    const f = facts({ advancedStatus: "ready", advancedOpen: true, j: { savedAnalyses: 1 }, smartRoutineAccess: true });
    expect(primaryId(f)).toBe("advanced_review");
  });

  test("ADVANCED READY and reviewed: update the routine instead", () => {
    const f = facts({ advancedStatus: "ready", advancedResultViewed: true, routineReviewDue: true, smartRoutineAccess: true, smartRoutineSaved: true, advancedOpen: true, j: { savedAnalyses: 1, routineSteps: 3 } });
    const r = resolveContext(f, { surface: "dashboard" });
    expect(r.primary?.id).toBe("update_routine");
    expect(r.primary?.label).toBe("Update my routine from my results");
    expect(r.suppressed).toContainEqual({ id: "advanced_review", reason: "completed" });
  });

  test("ROUTINE USER who has checked in: check-in is replaced, not repeated", () => {
    const base = { smartRoutineAccess: true, j: { savedAnalyses: 1, routineSteps: 3, routineCheckins: 5 } };
    expect(primaryId(facts({ ...base, checkedInToday: false }))).toBe("check_in");
    const done = resolveContext(facts({ ...base, checkedInToday: true }), { surface: "dashboard" });
    expect(done.primary?.id).not.toBe("check_in");
    expect(done.suppressed).toContainEqual({ id: "check_in", reason: "completed" });
  });

  test("Advanced with a pass offers to start; without one, the pass is a quiet secondary", () => {
    const base = { advancedOpen: true, smartRoutineAccess: true, j: { savedAnalyses: 1, routineSteps: 2 }, checkedInToday: true };
    expect(resolveContext(facts({ ...base, analysisPasses: 2 }), { surface: "dashboard" }).primary?.id).toBe("advanced_start");
    const none = resolveContext(facts({ ...base, analysisPasses: 0 }), { surface: "dashboard" });
    expect(none.primary?.id).not.toBe("advanced_get_pass");
  });

  test("Advanced is never promoted before a Basic analysis exists", () => {
    const ids = ACTIONS.filter((a) => a.feature === "skynn_advanced").map((a) => a.id);
    const r = resolveContext(facts({ advancedOpen: true, analysisPasses: 3 }), { surface: "dashboard" });
    expect([r.primary, ...r.secondary].some((a) => a && ids.includes(a.id))).toBe(false);
  });

  test("Advanced rollout closed: nothing about Advanced is offered", () => {
    const f = facts({ advancedOpen: false, analysisPasses: 2, j: { savedAnalyses: 1 }, smartRoutineAccess: true });
    const r = resolveContext(f, { surface: "analysis_results" });
    expect([r.primary, ...r.secondary].some((a) => a?.feature === "skynn_advanced")).toBe(false);
  });

  test("re-analysis is offered only when allowed again and the last one is old", () => {
    const base = { smartRoutineAccess: true, j: { savedAnalyses: 1, routineSteps: 2 }, checkedInToday: true, lastAnalysisAt: "2026-08-20T00:00:00Z" };
    const ids = (f: ContextFacts) => {
      const r = resolveContext(f, { surface: "dashboard", secondaryLimit: 10 });
      return [r.primary, ...r.secondary].map((a) => a?.id);
    };
    expect(ids(facts({ ...base, analysisAvailableNow: true }))).toContain("reanalyse");
    expect(ids(facts({ ...base, analysisAvailableNow: false }))).not.toContain("reanalyse"); // exhausted allowance
    expect(ids(facts({ ...base, analysisAvailableNow: true, lastAnalysisAt: "2026-10-01T00:00:00Z" }))).not.toContain("reanalyse");
  });
});

describe("membership rules", () => {
  const routineUser = { smartRoutineAccess: true, j: { savedAnalyses: 1, routineSteps: 2 } };

  test("Explorer meets the Routine Builder boundary with a trial offer, on the routine surface only", () => {
    const r = resolveContext(facts({ ...routineUser, checkedInToday: true }), { surface: "routine", secondaryLimit: 5 });
    const pitch = [r.primary, ...r.secondary].find((a) => a?.id === "routine_builder_pitch");
    expect(pitch?.label).toBe("Unlock the Intelligent Routine Builder");
    expect(pitch?.kind).toBe("start_trial");
    const dash = resolveContext(facts({ ...routineUser, checkedInToday: true }), { surface: "dashboard", secondaryLimit: 9 });
    expect([dash.primary, ...dash.secondary].some((a) => a?.id === "routine_builder_pitch")).toBe(false);
  });

  test("Lite is invited to go deeper; Insider and VIP are never upsold the Routine Builder", () => {
    const lite = resolveContext(facts({ ...routineUser, tier: "glow_lite", checkedInToday: true }), { surface: "routine", secondaryLimit: 5 });
    expect([lite.primary, ...lite.secondary].find((a) => a?.id === "routine_builder_pitch")?.label).toBe("Go deeper with the Intelligent Routine Builder");
    for (const tier of ["insider", "vip"] as const) {
      const r = resolveContext(facts({ ...routineUser, tier, checkedInToday: true }), { surface: "routine", secondaryLimit: 9 });
      expect([r.primary, ...r.secondary].some((a) => a?.id === "routine_builder_pitch")).toBe(false);
    }
  });

  test("a trial is only offered to a free account that has not trialled and already has a profile", () => {
    const only = (f: ContextFacts) => {
      const r = resolveContext(f, { surface: "dashboard", secondaryLimit: 9 });
      return [r.primary, ...r.secondary].some((a) => a?.id === "start_trial");
    };
    expect(only(facts({ ...routineUser, checkedInToday: true }))).toBe(true);
    expect(only(facts({ ...routineUser, checkedInToday: true, j: { ...routineUser.j, trialUsed: true } }))).toBe(false);
    expect(only(facts({ ...routineUser, checkedInToday: true, tier: "glow_lite" }))).toBe(false);
    expect(only(facts({ checkedInToday: true }))).toBe(false); // no profile yet: value before the ask
  });

  test("a Conflict Matcher member is pointed at the Matcher, not the free checker", () => {
    const r = resolveContext(facts({ ...routineUser, tier: "insider", checkedInToday: true }), { surface: "dashboard", secondaryLimit: 9 });
    const ids = [r.primary, ...r.secondary].map((a) => a?.id);
    expect(ids).toContain("conflict_matcher");
    expect(ids).not.toContain("ingredient_checker");
  });
});

describe("one per feature, no duplicate destinations", () => {
  test("secondary actions never share a feature or a destination with the primary", () => {
    const f = facts({
      tier: "insider",
      smartRoutineAccess: true,
      advancedOpen: true,
      analysisPasses: 1,
      recentReviewViews: 5,
      podcastInProgress: { slug: "ep-1", title: "Ep" },
      startedBriefing: { slug: "b", title: "B" },
      j: { savedAnalyses: 1, routineSteps: 3, routineCheckins: 4 },
    });
    const r = resolveContext(f, { surface: "dashboard", secondaryLimit: 9 });
    const all = [r.primary!, ...r.secondary];
    expect(new Set(all.map((a) => a.feature)).size).toBe(all.length);
    const hrefs = all.map((a) => a.href).filter(Boolean);
    expect(new Set(hrefs).size).toBe(hrefs.length);
  });

  test("resolution is deterministic", () => {
    const f = facts({ smartRoutineAccess: true, j: { savedAnalyses: 1 } });
    expect(resolveContext(f, { surface: "dashboard" })).toEqual(resolveContext(f, { surface: "dashboard" }));
  });
});

describe("CTA fatigue ledger", () => {
  const routineUser = facts({ smartRoutineAccess: true, checkedInToday: true, j: { savedAnalyses: 1, routineSteps: 2 } });

  test("an impression is counted once per SAST day", () => {
    let l: CtaLedger = {};
    l = recordShown(l, "ingredient_checker", NOW);
    const again = recordShown(l, "ingredient_checker", "2026-10-07T15:00:00Z");
    expect(again).toBe(l);
    expect(recordShown(l, "ingredient_checker", "2026-10-08T08:00:00Z").ingredient_checker.shownDays).toHaveLength(2);
  });

  test("SAST day rolls over at 22:00 UTC", () => {
    expect(sastDay("2026-10-07T21:59:00Z")).toBe("2026-10-07");
    expect(sastDay("2026-10-07T22:00:00Z")).toBe("2026-10-08");
  });

  test("a discovery CTA stops after its cap, but a CTA already counted today keeps showing all day", () => {
    const rule = { maxDays: 3, windowDays: 21 };
    let capped: CtaLedger = {};
    for (const d of ["2026-10-01", "2026-10-03", "2026-10-05"]) capped = recordShown(capped, "x", `${d}T08:00:00Z`);
    expect(isFatigued(capped.x, rule, NOW)).toBe("fatigued");

    let shownToday: CtaLedger = {};
    for (const d of ["2026-10-03", "2026-10-05", "2026-10-07"]) shownToday = recordShown(shownToday, "x", `${d}T08:00:00Z`);
    expect(isFatigued(shownToday.x, rule, NOW)).toBe(null);
  });

  test("dismissal hides an action for its cooldown, then it may return", () => {
    const l = recordDismissed({}, "ingredient_checker", NOW);
    const fatigued = resolveContext(routineUser, { surface: "dashboard", ledger: l, secondaryLimit: 9 });
    expect([fatigued.primary, ...fatigued.secondary].some((a) => a?.id === "ingredient_checker")).toBe(false);
    expect(fatigued.suppressed).toContainEqual({ id: "ingredient_checker", reason: "dismissed" });
    const later = resolveContext({ ...routineUser, now: "2026-11-15T08:00:00Z" }, { surface: "dashboard", ledger: l, secondaryLimit: 9 });
    expect([later.primary, ...later.secondary].some((a) => a?.id === "ingredient_checker")).toBe(true);
  });

  test("essential actions are never throttled", () => {
    let l: CtaLedger = {};
    for (const d of ["2026-09-20", "2026-09-22", "2026-09-24", "2026-09-26", "2026-09-28"]) l = recordShown(l, "start_basic", `${d}T08:00:00Z`);
    l = recordDismissed(l, "start_basic", NOW);
    expect(primaryId(facts(), "dashboard", l)).toBe("start_basic");
  });

  test("a discovery action that was clicked is completed, not repeated", () => {
    const l = recordCompleted(recordClicked({}, "ingredient_checker", NOW), "ingredient_checker", NOW);
    const r = resolveContext(routineUser, { surface: "dashboard", ledger: l, secondaryLimit: 9 });
    expect(r.suppressed).toContainEqual({ id: "ingredient_checker", reason: "completed" });
  });

  test("storage round-trips, is per account, and survives garbage", () => {
    const mem = new Map<string, string>();
    const storage = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v) };
    const l = recordShown({}, "a", NOW);
    saveLedger("user-1", l, storage);
    expect(loadLedger("user-1", storage)).toEqual(l);
    expect(loadLedger("user-2", storage)).toEqual({});
    mem.set("skinlabs:cta-ledger:user-3", "not json");
    expect(loadLedger("user-3", storage)).toEqual({});
    mem.set("skinlabs:cta-ledger:user-4", JSON.stringify([1, 2]));
    expect(loadLedger("user-4", storage)).toEqual({});
    expect(loadLedger(null, storage)).toEqual({});
  });
});

describe("empty states and greeting", () => {
  test("routine empty state is context-aware", () => {
    const none = emptyStateCopy("routine", facts());
    expect(none.action?.href).toBe("/skynn-ai");
    const withProfile = emptyStateCopy("routine", facts({ j: { savedAnalyses: 1 } }));
    expect(withProfile.title).toBe("Your skin profile is ready. Build a routine around it.");
    expect(withProfile.action?.label).toBe("Build my routine");
  });

  test("every empty state offers a next action", () => {
    for (const kind of ["routine", "saved_products", "saved_content", "journey", "analysis"] as const) {
      expect(emptyStateCopy(kind, facts()).action?.href).toBeTruthy();
    }
  });

  test("greeting follows the state and is never creepy", () => {
    expect(contextualGreeting(facts(), "Thandi").title).toBe("Welcome, Thandi");
    expect(contextualGreeting(facts({ advancedStatus: "pending", j: { savedAnalyses: 1 } }), null).body).toContain("with our team");
    const g = contextualGreeting(facts({ j: { savedAnalyses: 1, routineSteps: 2 }, lastActiveAt: "2026-10-06T00:00:00Z" }), "Thandi");
    expect(g.title).toBe("Good morning, Thandi"); // 08:00Z = 10:00 SAST
    expect(JSON.stringify(g)).not.toMatch(/noticed|tracking|we saw/i);
  });
});

describe("navigation", () => {
  test("visitors and members without a profile get the content tabs", () => {
    expect(contextualNavigation({ ...facts(), journey: { ...EMPTY_FACTS } }).map((t) => t.id)).toEqual(["home", "news", "stream", "reviews", "compare"]);
    expect(contextualNavigation(facts()).map((t) => t.id)).toEqual(["home", "news", "stream", "reviews", "compare"]);
  });

  test("a member with a skin profile gets Home · My Skin · Routine · Explore · Account", () => {
    expect(contextualNavigation(facts({ j: { savedAnalyses: 1 } })).map((t) => t.id)).toEqual(["home", "my_skin", "routine", "explore", "account"]);
  });

  test("active-tab matching follows ?tab= on the dashboard", () => {
    const nav = contextualNavigation(facts({ j: { savedAnalyses: 1 } }));
    const active = (path: string, section: string | null) => nav.filter((t) => isNavTabActive(t, path, section)).map((t) => t.id);
    expect(active("/dashboard", "routine")).toEqual(["routine"]);
    expect(active("/dashboard", "analysis")).toEqual(["my_skin"]);
    expect(active("/dashboard", null)).toEqual(["account"]);
    expect(active("/reviews/foo", null)).toEqual(["explore"]);
    expect(active("/", null)).toEqual(["home"]);
    expect(active("/skynn-ai", null)).toEqual(["my_skin"]);
  });
});

import { advancedStatusFromReports, isRoutineReviewDue, latestAdvancedAt, newestOf, trialDaysLeftFrom } from "@/lib/context";

describe("fact derivation", () => {
  const report = (over: Record<string, unknown>) => ({
    generation_status: "pending", review_status: null, processing_mode: "fallback", intake_status: "pending", submitted_at: "2026-10-01T00:00:00Z", created_at: "2026-10-01T00:00:00Z", ...over,
  }) as never;

  test("advanced status: ready beats pending; refunded submissions read as none", () => {
    expect(advancedStatusFromReports([])).toBe("none");
    expect(advancedStatusFromReports([report({})])).toBe("pending");
    expect(advancedStatusFromReports([report({ intake_status: "rejected" })])).toBe("none");
    expect(advancedStatusFromReports([report({ intake_status: "failed" })])).toBe("none");
    const ready = report({ processing_mode: "production", generation_status: "completed", review_status: "approved" });
    expect(advancedStatusFromReports([report({}), ready])).toBe("ready");
  });

  test("only counted submissions set the latest advanced time", () => {
    expect(latestAdvancedAt([report({ intake_status: "rejected", submitted_at: "2026-10-05T00:00:00Z" }), report({})])).toBe("2026-10-01T00:00:00Z");
  });

  test("routine review is due after a newer analysis, a released report, or 60 quiet days", () => {
    const routine = { updated_at: "2026-09-20T00:00:00Z", source: "rule_based" };
    const base = { routine, lastAnalysisAt: "2026-09-10T00:00:00Z", latestAdvancedAt: null, advancedStatus: "none" as const, now: NOW };
    expect(isRoutineReviewDue(base)).toBe(false);
    expect(isRoutineReviewDue({ ...base, lastAnalysisAt: "2026-10-01T00:00:00Z" })).toBe(true);
    expect(isRoutineReviewDue({ ...base, advancedStatus: "ready" })).toBe(true);
    expect(isRoutineReviewDue({ ...base, advancedStatus: "ready", routine: { ...routine, source: "advanced_report" } })).toBe(false);
    expect(isRoutineReviewDue({ ...base, routine: { ...routine, updated_at: "2026-07-01T00:00:00Z" } })).toBe(true);
    expect(isRoutineReviewDue({ ...base, routine: null })).toBe(false);
  });

  test("trial days left use SAST calendar days", () => {
    expect(trialDaysLeftFrom("2026-10-31T22:00:00Z", "2026-10-28T10:00:00Z")).toBe(4); // ends 1 Nov SAST
    expect(trialDaysLeftFrom("2026-10-01T00:00:00Z", NOW)).toBe(0);
    expect(trialDaysLeftFrom(null, NOW)).toBeNull();
  });

  test("newestOf ignores empty and invalid timestamps", () => {
    expect(newestOf(null, "nope", "2026-10-01T00:00:00Z", "2026-10-03T00:00:00Z")).toBe("2026-10-03T00:00:00Z");
    expect(newestOf(null, undefined)).toBeNull();
  });
});
