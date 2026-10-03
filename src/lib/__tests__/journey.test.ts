import { describe, expect, test } from "bun:test";
import {
  EMPTY_FACTS,
  checklistComplete,
  gettingStartedChecklist,
  isActivated,
  nextBestAction,
  resolveJourneyStage,
  type JourneyFacts,
} from "../journey";

const facts = (over: Partial<JourneyFacts> = {}): JourneyFacts => ({ ...EMPTY_FACTS, ...over });
const signedIn = (over: Partial<JourneyFacts> = {}) => facts({ signedIn: true, ...over });

describe("resolveJourneyStage", () => {
  test("visitor: signed out, nothing in this browser", () => {
    expect(resolveJourneyStage(facts())).toBe("visitor");
  });
  test("analysed: signed out with a local SKYNN AI result", () => {
    expect(resolveJourneyStage(facts({ hasLocalAnalysis: true }))).toBe("analysed");
  });
  test("member: free account that hasn't trialled", () => {
    expect(resolveJourneyStage(signedIn({ savedAnalyses: 1 }))).toBe("member");
  });
  test("trialing: on a trial, not activated, no card", () => {
    expect(resolveJourneyStage(signedIn({ isTrialing: true, trialUsed: true, savedAnalyses: 1 }))).toBe("trialing");
  });
  test("activated: trialing and using it, no card", () => {
    expect(resolveJourneyStage(signedIn({ isTrialing: true, trialUsed: true, routineSteps: 3 }))).toBe("activated");
  });
  test("payment_on_file: trialing with auto-renew set up, whether or not activated", () => {
    expect(resolveJourneyStage(signedIn({ isTrialing: true, hasPaymentOnFile: true }))).toBe("payment_on_file");
    expect(resolveJourneyStage(signedIn({ isTrialing: true, hasPaymentOnFile: true, routineSteps: 2 }))).toBe("payment_on_file");
  });
  test("paid: a paying tier", () => {
    expect(resolveJourneyStage(signedIn({ isPaid: true, trialUsed: true, hasPaymentOnFile: true }))).toBe("paid");
  });
  test("lapsed: trial used, back on the free tier", () => {
    expect(resolveJourneyStage(signedIn({ trialUsed: true, savedAnalyses: 2 }))).toBe("lapsed");
  });
});

describe("isActivated", () => {
  test("each activation signal on its own", () => {
    expect(isActivated(facts({ savedAnalyses: 2 }))).toBe(true);
    expect(isActivated(facts({ routineSteps: 1 }))).toBe(true);
    expect(isActivated(facts({ routineCheckins: 3 }))).toBe(true);
    expect(isActivated(facts({ savedItems: 3 }))).toBe(true);
  });
  test("just below every threshold is not activated", () => {
    expect(isActivated(facts({ savedAnalyses: 1, routineCheckins: 2, savedItems: 2 }))).toBe(false);
  });
});

describe("nextBestAction", () => {
  test("visitor → analysis; analysed → save results (sign-up)", () => {
    expect(nextBestAction("visitor", facts()).href).toBe("/skynn-ai");
    expect(nextBestAction("analysed", facts({ hasLocalAnalysis: true })).kind).toBe("signup");
  });
  test("member: analysis first, then the trial", () => {
    expect(nextBestAction("member", signedIn()).id).toBe("analysis");
    expect(nextBestAction("member", signedIn({ savedAnalyses: 1 })).kind).toBe("start_trial");
  });
  test("trialing: analysis, then routine, then check-in", () => {
    const t = { isTrialing: true, trialUsed: true };
    expect(nextBestAction("trialing", signedIn(t)).id).toBe("analysis");
    expect(nextBestAction("trialing", signedIn({ ...t, savedAnalyses: 1 })).id).toBe("routine");
  });
  test("activated → keep my membership", () => {
    expect(nextBestAction("activated", signedIn({ isTrialing: true, routineSteps: 1 })).kind).toBe("keep_membership");
  });
  test("payment_on_file and paid → routine habits", () => {
    expect(nextBestAction("payment_on_file", signedIn()).id).toBe("routine");
    expect(nextBestAction("paid", signedIn({ routineSteps: 2 })).id).toBe("check_in");
  });
  test("lapsed → keep membership (subscribe)", () => {
    expect(nextBestAction("lapsed", signedIn({ trialUsed: true })).kind).toBe("keep_membership");
  });
});

describe("gettingStartedChecklist", () => {
  test("a free account isn't asked to read a members-only review", () => {
    const items = gettingStartedChecklist(signedIn({ savedAnalyses: 1 }));
    expect(items.map((i) => i.id)).toEqual(["analysis", "routine", "weather", "checkins", "mfa"]);
  });
  test("six steps, completion from data", () => {
    const items = gettingStartedChecklist(signedIn({ savedAnalyses: 1, weatherCitySet: true, isTrialing: true }));
    expect(items.map((i) => i.id)).toEqual(["analysis", "routine", "weather", "checkins", "content", "mfa"]);
    expect(items.filter((i) => i.done).map((i) => i.id)).toEqual(["analysis", "weather"]);
  });
  test("an activated trialist without payment also gets Keep my membership", () => {
    const items = gettingStartedChecklist(signedIn({ isTrialing: true, routineSteps: 1 }));
    expect(items.at(-1)?.id).toBe("keep_membership");
    const withCard = gettingStartedChecklist(signedIn({ isTrialing: true, routineSteps: 1, hasPaymentOnFile: true }));
    expect(withCard.some((i) => i.id === "keep_membership")).toBe(false);
  });
  test("complete only when every step is done", () => {
    const all = signedIn({
      savedAnalyses: 1,
      routineSteps: 1,
      weatherCitySet: true,
      routineCheckins: 2,
      contentReads: 1,
      mfaEnabled: true,
    });
    expect(checklistComplete(gettingStartedChecklist(all))).toBe(true);
    expect(checklistComplete(gettingStartedChecklist({ ...all, mfaEnabled: false }))).toBe(false);
  });
});
