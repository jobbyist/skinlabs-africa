import { describe, expect, test } from "bun:test";
import {
  EVENT_DESCRIPTIONS,
  formatPercent,
  installRate,
  percent,
  prettyLabel,
  stageRates,
  sumCounts,
  withShares,
} from "../pwaAnalyticsSummary";
import { pwaEventProps } from "../pwa/analytics";

describe("PWA event payloads carry only coarse device tokens", () => {
  test("installed iPhone app", () => {
    const props = pwaEventProps({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1",
      navigatorStandalone: true,
    });
    expect(props).toEqual({ platform: "ios", browser: "safari", device_type: "phone", display_mode: "standalone" });
  });
  test("desktop Chrome in a normal tab", () => {
    const props = pwaEventProps({ userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36" });
    expect(props).toEqual({ platform: "windows", browser: "chrome", device_type: "desktop", display_mode: "browser" });
  });
  test("no user agent string, identifiers or free text are ever included", () => {
    const props = pwaEventProps({ userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 7) Chrome/124 Mobile" });
    expect(Object.keys(props).sort()).toEqual(["browser", "device_type", "display_mode", "platform"]);
    expect(JSON.stringify(props)).not.toMatch(/Mozilla|Pixel|Android 14/);
  });
});

describe("admin panel maths", () => {
  test("percent never divides by zero or exceeds 100", () => {
    expect(percent(1, 0)).toBeNull();
    expect(formatPercent(percent(1, 0))).toBe("—");
    expect(percent(1, 3)).toBe(33);
    expect(percent(5, 3)).toBe(100);
  });
  test("install funnel conversion between consecutive stages", () => {
    const rates = stageRates([
      { stage: "Install prompt shown", count: 200 },
      { stage: "Install started", count: 80 },
      { stage: "Accepted", count: 60 },
      { stage: "App installed", count: 0 },
    ]);
    expect(rates).toEqual([null, 40, 75, 0]);
    expect(stageRates([{ stage: "a", count: 0 }, { stage: "b", count: 5 }])).toEqual([null, null]);
  });
  test("install rate = installs ÷ prompts shown", () => {
    expect(installRate({ installs: 15, prompts_viewed: 60 })).toBe(25);
    expect(installRate({ installs: 3, prompts_viewed: 0 })).toBeNull();
  });
  test("breakdowns get friendly labels and shares of the total", () => {
    const rows = [{ label: "ios", count: 6 }, { label: "android", count: 3 }, { label: "windows", count: 1 }];
    expect(sumCounts(rows)).toBe(10);
    expect(withShares("platform", rows)).toEqual([
      { label: "iPhone (iOS)", count: 6, share: 60 },
      { label: "Android", count: 3, share: 30 },
      { label: "Windows", count: 1, share: 10 },
    ]);
    expect(withShares("device", [])).toEqual([]);
    expect(prettyLabel("device", "phone")).toBe("Phone");
    expect(prettyLabel("browser", "samsung")).toBe("Samsung Internet");
    expect(prettyLabel("kind", "ios")).toMatch(/Add to Home Screen/);
    expect(prettyLabel("platform", "brand-new-os")).toBe("brand-new-os");
  });
  test("every event the app fires has an admin description", () => {
    for (const e of ["pwa_install_prompt_viewed", "pwa_installed", "pwa_launch", "push_subscribed", "podcast_download_completed", "podcast_offline_play"]) {
      expect(EVENT_DESCRIPTIONS[e]).toBeTruthy();
    }
  });
});
