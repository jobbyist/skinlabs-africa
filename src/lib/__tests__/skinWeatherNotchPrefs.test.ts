import { describe, expect, test } from "bun:test";
import { isNotchDismissedToday, resolveNotchCityKey, sastDayKey } from "../skinWeather/notchPrefs";

describe("skin weather notch prefs", () => {
  test("the SAST day rolls over at 22:00 UTC", () => {
    expect(sastDayKey(new Date("2026-10-03T21:59:00Z"))).toBe("2026-10-03");
    expect(sastDayKey(new Date("2026-10-03T22:00:00Z"))).toBe("2026-10-04");
  });
  test("a dismissal lasts for the SAST day only", () => {
    const stored = sastDayKey(new Date("2026-10-03T08:00:00Z"));
    expect(isNotchDismissedToday(stored, new Date("2026-10-03T20:00:00Z"))).toBe(true);
    expect(isNotchDismissedToday(stored, new Date("2026-10-03T22:30:00Z"))).toBe(false);
    expect(isNotchDismissedToday(null)).toBe(false);
  });
  test("city: own pick > saved > Johannesburg; junk is ignored", () => {
    expect(resolveNotchCityKey("cape-town", "durban")).toBe("cape-town");
    expect(resolveNotchCityKey(null, "durban")).toBe("durban");
    expect(resolveNotchCityKey("atlantis", undefined)).toBe("johannesburg");
    expect(resolveNotchCityKey(null, "atlantis")).toBe("johannesburg");
  });
});
