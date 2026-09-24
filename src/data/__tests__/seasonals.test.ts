import { describe, expect, test } from "bun:test";
import { getCurrentSeason } from "../seasonals";

// getCurrentSeason() works on the epoch timestamp (date.getTime()) shifted to
// SAST (UTC+2, no DST) and reads the month back in UTC, so the result must not
// depend on the runtime's own timezone. These cases pin the month boundaries,
// where a local-timezone bug would show up first.
describe("getCurrentSeason", () => {
  test("maps each SA month range to its season", () => {
    expect(getCurrentSeason(new Date("2026-09-15T12:00:00Z"))).toBe("spring");
    expect(getCurrentSeason(new Date("2026-11-30T12:00:00Z"))).toBe("spring");
    expect(getCurrentSeason(new Date("2026-12-15T12:00:00Z"))).toBe("summer");
    expect(getCurrentSeason(new Date("2027-02-15T12:00:00Z"))).toBe("summer");
    expect(getCurrentSeason(new Date("2027-04-15T12:00:00Z"))).toBe("autumn");
    expect(getCurrentSeason(new Date("2027-07-15T12:00:00Z"))).toBe("winter");
  });

  test("switches season at local SAST midnight, not UTC midnight", () => {
    // 1 December 00:30 SAST is still 30 November 22:30 UTC.
    expect(getCurrentSeason(new Date("2026-11-30T22:30:00Z"))).toBe("summer");
    // 30 November 23:30 SAST (21:30 UTC) is still spring.
    expect(getCurrentSeason(new Date("2026-11-30T21:30:00Z"))).toBe("spring");
    // 1 March 00:30 SAST is 28 February 22:30 UTC.
    expect(getCurrentSeason(new Date("2027-02-28T22:30:00Z"))).toBe("autumn");
  });
});
