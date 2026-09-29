import { describe, expect, test } from "bun:test";
import { showStoryRail } from "../mobileChrome";

describe("showStoryRail", () => {
  test("hidden on pricing, welcome, SKYNN AI (and sub-routes) and the dashboard", () => {
    for (const p of ["/pricing", "/welcome", "/skynn-ai", "/skynn-ai/advanced", "/dashboard"]) expect(showStoryRail(p)).toBe(false);
  });
  test("shown everywhere else, without prefix false-positives", () => {
    for (const p of ["/", "/reviews/some-serum", "/briefings", "/pricing-guide", "/dashboards"]) expect(showStoryRail(p)).toBe(true);
  });
});
