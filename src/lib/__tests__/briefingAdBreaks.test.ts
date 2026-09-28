import { describe, expect, test } from "bun:test";
import { splitBriefingForAds } from "../briefingAdBreaks";

const sections = (n: number, extra = "") =>
  Array.from({ length: n }, (_, i) => `## Section ${i + 1}\n\nBody ${i + 1}.`).join("\n\n") + extra;

describe("splitBriefingForAds", () => {
  test("hand-placed markers win", () => {
    expect(splitBriefingForAds("a\n<!-- ad:mid-1 -->\nb\n<!-- ad:mid-2 -->\nc")).toEqual(["a\n", "\nb\n", "\nc"]);
  });
  test("breaks before every 2nd section, never before the first", () => {
    const parts = splitBriefingForAds(`Intro.\n\n${sections(6)}`);
    expect(parts.length).toBe(3);
    expect(parts[1].startsWith("## Section 3")).toBe(true);
    expect(parts[2].startsWith("## Section 5")).toBe(true);
    expect(parts.join("\n")).toBe(`Intro.\n\n${sections(6)}`);
  });
  test("stops at the FAQ and respects maxBreaks", () => {
    const parts = splitBriefingForAds(sections(4, "\n\n## FAQ\n\n**Q?** A.\n\n## After"));
    expect(parts.length).toBe(2);
    expect(parts[1]).toContain("## FAQ");
    expect(splitBriefingForAds(sections(20)).length).toBe(5);
  });
  test("short bodies and fenced code are left alone", () => {
    expect(splitBriefingForAds(sections(1))).toHaveLength(1);
    expect(splitBriefingForAds("## A\n```\n## not a heading\n```\n## B")).toHaveLength(1);
  });
});
