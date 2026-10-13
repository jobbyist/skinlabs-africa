import { describe, expect, test } from "bun:test";
import {
  EMPTY_FACTS,
  checklistComplete,
  remindersDone,
  gettingStartedChecklist,
  isActivated,
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
  test("membership prompts are not checklist items (the trial banner owns them)", () => {
    const items = gettingStartedChecklist(signedIn({ isTrialing: true, routineSteps: 1 }));
    expect(items.map((i) => i.id)).not.toContain("keep_membership" as never);
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

describe("the reminders checklist item (server truth only)", () => {
  const ids = (f: JourneyFacts) => gettingStartedChecklist(f).map((i) => i.id);
  test("hidden where the push API does not exist, shown (exactly once) where it could be completed", () => {
    expect(ids(signedIn({ savedAnalyses: 1 }))).not.toContain("reminders");
    const shown = ids(signedIn({ savedAnalyses: 1, reminderPushAvailable: true }));
    expect(shown.filter((id) => id === "reminders")).toHaveLength(1);
    expect(shown.indexOf("reminders")).toBe(shown.indexOf("checkins") + 1);
  });
  test("non-iOS: an active push device alone completes it", () => {
    expect(remindersDone(signedIn({ reminderDeviceActive: true }))).toBe(true);
    expect(remindersDone(signedIn({ reminderDeviceActive: false }))).toBe(false);
  });
  test("iOS: needs the active device AND app_installed_at", () => {
    expect(remindersDone(signedIn({ reminderIosDevice: true, reminderDeviceActive: true }))).toBe(false);
    expect(remindersDone(signedIn({ reminderIosDevice: true, appInstalled: true }))).toBe(false);
    expect(remindersDone(signedIn({ reminderIosDevice: true, reminderDeviceActive: true, appInstalled: true }))).toBe(true);
  });
  test("a completed item stays listed even if this device can no longer push (idempotent)", () => {
    const items = gettingStartedChecklist(signedIn({ reminderDeviceActive: true, reminderPushAvailable: false }));
    expect(items.find((i) => i.id === "reminders")?.done).toBe(true);
  });
  test("completion is derived from facts alone: client analytics are not an input", () => {
    expect(Object.keys(EMPTY_FACTS).some((k) => /analytics|event/i.test(k))).toBe(false);
  });
});
