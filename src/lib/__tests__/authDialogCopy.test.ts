import { describe, expect, test } from "bun:test";
import { authDialogCopy, initialAuthTab } from "../authDialogCopy";
import type { PendingIntent } from "../pendingIntent";

const intent = (action: PendingIntent["action"], plan?: string): PendingIntent =>
  ({ action, plan, returnTo: "/reviews/x", ts: Date.now() }) as PendingIntent;

describe("authDialogCopy", () => {
  test("trial names the plan", () => {
    expect(authDialogCopy(intent("trial", "insider"), "signup").title).toBe("Create your account to start Glow Insider free");
    expect(authDialogCopy(intent("trial", "glow_lite"), "signup").title).toBe("Create your account to start Glow Lite free");
  });

  test("trial without a plan falls back to Glow Insider", () => {
    expect(authDialogCopy(intent("trial"), "signup").title).toBe("Create your account to start Glow Insider free");
  });

  test("save_analysis and unlock", () => {
    expect(authDialogCopy(intent("save_analysis"), "signup").title).toBe("Save your SKYNN AI results");
    expect(authDialogCopy(intent("unlock"), "signup").title).toBe("Create a free account to keep reading");
  });

  test("no intent keeps the generic copy", () => {
    expect(authDialogCopy(null, "signup").title).toBe("Create your account");
    expect(authDialogCopy(null, "signin").title).toBe("Log in to SkinLabs®");
  });

  test("log-in tab keeps its title but explains the intent", () => {
    const copy = authDialogCopy(intent("unlock"), "signin");
    expect(copy.title).toBe("Log in to SkinLabs®");
    expect(copy.description).toBe(authDialogCopy(intent("unlock"), "signup").description);
  });

  test("copy never hardcodes a trial length", () => {
    for (const action of ["trial", "save_analysis", "unlock", "subscribe"] as const) {
      const { title, description } = authDialogCopy(intent(action, "insider"), "signup");
      expect(`${title} ${description}`).not.toMatch(/7-day|7 days/);
    }
  });
});

describe("initialAuthTab", () => {
  test("a pending intent opens sign-up", () => {
    expect(initialAuthTab(undefined, undefined, intent("unlock"))).toBe("signup");
  });

  test("no intent opens log in", () => {
    expect(initialAuthTab(undefined, undefined, null)).toBe("signin");
  });

  test("an explicit mode or defaultTab wins over the intent", () => {
    expect(initialAuthTab("signin", undefined, intent("trial"))).toBe("signin");
    expect(initialAuthTab(undefined, "signin", intent("trial"))).toBe("signin");
    expect(initialAuthTab("signup", "signin", null)).toBe("signup");
  });
});
