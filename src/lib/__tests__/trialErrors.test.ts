import { describe, expect, test } from "bun:test";
import { isTrialAlreadyUsedError } from "../trialErrors";
import { TRIAL_STARTED_PATH, WELCOME_PATH } from "../intentRouting";

describe("isTrialAlreadyUsedError", () => {
  test("matches the RPC message and startFreeTrial()'s friendly version", () => {
    expect(isTrialAlreadyUsedError("Free trial already used")).toBe(true);
    expect(isTrialAlreadyUsedError("You've already used your free trial on this account.")).toBe(true);
  });

  test("other failures are not treated as a used trial", () => {
    expect(isTrialAlreadyUsedError("Could not start your trial. Please try again.")).toBe(false);
    expect(isTrialAlreadyUsedError("This plan has no free trial")).toBe(false);
    expect(isTrialAlreadyUsedError(undefined)).toBe(false);
  });
});

describe("TRIAL_STARTED_PATH", () => {
  test("follows the welcome path", () => {
    expect(TRIAL_STARTED_PATH).toBe(`${WELCOME_PATH}?trial=started`);
  });
});
