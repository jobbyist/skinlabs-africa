import { describe, expect, test } from "bun:test";
import {
  checkBriefingFormat,
  normaliseBriefingMarkdown,
} from "../../../supabase/functions/_shared/pipelines/briefingFormat";

const sentence = (n: number) =>
  `This is South African skincare sentence number ${n} about sun, humidity and routines. `;
const prose = (count: number, start = 1) =>
  Array.from({ length: count }, (_, i) => sentence(start + i)).join("").trim();

// Shape of the real broken rows (22-25 Sept 2026): one line, "## Title. Body…".
const flattened =
  `## Understanding the landscape of your skin. ${prose(14)} ` +
  `## The difference between inner and outer arm skin. ${prose(10)} ` +
  `## Types of flat spots you may notice. ${prose(2)} 1. Sun spots (solar lentigines): These are flat brown patches. ` +
  `2. Freckles: These are smaller, lighter spots. 3. Melasma: Symmetrical brown patches. 4. Early melanoma: Watch the border. ` +
  `If you notice change, see your doctor. ${prose(6)} ` +
  `## How to monitor safely. ${prose(8)} ` +
  `## What to do this week. ${prose(4)}`;

describe("normaliseBriefingMarkdown", () => {
  test("splits a one-line body into headings and short paragraphs", () => {
    const out = normaliseBriefingMarkdown(flattened);
    expect(out).toContain("\n");
    const headings = out.split("\n").filter((l) => l.startsWith("## "));
    expect(headings).toHaveLength(5);
    expect(headings[0]).toBe("## Understanding the landscape of your skin");
    expect(headings.every((h) => !/[.:;,]$/.test(h))).toBe(true);
    // no heading is glued to a paragraph
    expect(out.split("\n").some((l) => /^## .{150,}/.test(l))).toBe(false);
    // paragraphs are short
    for (const p of out.split(/\n{2,}/)) {
      if (!p.startsWith("## ") && !/^\d\./.test(p)) expect(p.split(/\s+/).length).toBeLessThanOrEqual(160);
    }
  });

  test("turns a flattened numbered list into one item per line and returns to prose", () => {
    const out = normaliseBriefingMarkdown(flattened);
    expect(out).toContain("1. Sun spots (solar lentigines): These are flat brown patches.");
    expect(out).toMatch(/\n2\. Freckles/);
    expect(out).toMatch(/\n4\. Early melanoma: Watch the border\./);
    // prose after the list is its own paragraph, not part of item 4
    expect(out).not.toContain("Watch the border. If you notice change");
    expect(out).toContain("If you notice change, see your doctor.");
  });

  test("is idempotent", () => {
    const once = normaliseBriefingMarkdown(flattened);
    expect(normaliseBriefingMarkdown(once)).toBe(once);
  });

  test("leaves a well-formed body unchanged", () => {
    const good = `## First section\n\n${prose(5)}\n\n- one\n- two\n\n## Second section\n\n1. a\n2. b`;
    expect(normaliseBriefingMarkdown(good)).toBe(good);
  });

  test("keeps image markdown blocks intact", () => {
    const withImage = `## One\n\n${prose(3)}\n\n![alt text](https://x.test/a.jpg)\n_Photo: Someone on Pexels_\n\n## Two\n\n${prose(3)}`;
    const out = normaliseBriefingMarkdown(withImage);
    expect(out).toContain("![alt text](https://x.test/a.jpg)");
  });

  test("strips bold/italic markers and demotes ### headings", () => {
    const out = normaliseBriefingMarkdown("## A\n\nSome **bold** text.\n\n### Sub\n\nMore.");
    expect(out).not.toContain("**");
    expect(out).toContain("## Sub");
  });
});

describe("checkBriefingFormat", () => {
  test("rejects the flattened shape", () => {
    const r = checkBriefingFormat(flattened);
    expect(r.ok).toBe(false);
    expect(r.reasons.join(" ")).toMatch(/single line/);
  });

  test("accepts the normalised version", () => {
    const body = `${normaliseBriefingMarkdown(flattened)}\n\n- extra bullet\n- another`;
    const r = checkBriefingFormat(body);
    expect(r.reasons).toEqual([]);
    expect(r.ok).toBe(true);
  });

  test("flags heading punctuation, merged prose headings and long paragraphs", () => {
    const bad = `## A heading.\n\n${prose(40)}\n\n## B\n\n- x\n\n## C\n\n1. y\n\n## D\n\ntext`;
    const r = checkBriefingFormat(bad);
    expect(r.reasons.join(" ")).toMatch(/heading ends with punctuation/);
    expect(r.reasons.join(" ")).toMatch(/exceed/);
  });

  test("list requirement can be waived for repairs", () => {
    const body = normaliseBriefingMarkdown(flattened.replace(/1\. .*?melanoma: Watch the border\./, "x."));
    expect(checkBriefingFormat(body, { requireLists: false }).ok).toBe(true);
  });
});

describe("repair scope", () => {
  test("isFlattenedBody detects the broken shape only", async () => {
    const { isFlattenedBody } = await import("../../../supabase/functions/_shared/pipelines/briefingFormat");
    expect(isFlattenedBody(flattened)).toBe(true);
    expect(isFlattenedBody("## A\n\ntext\n\n## B\n\ntext")).toBe(false);
    expect(isFlattenedBody("## A\n\ntext <!-- ad:mid-1 -->\n\n**bold** ok")).toBe(false);
  });

  test("stripMarkup:false preserves ad markers and bold", () => {
    const out = normaliseBriefingMarkdown("## A\n\ntext **bold**\n\n<!-- ad:mid-1 -->\n\n## B\n\nmore", { stripMarkup: false });
    expect(out).toContain("**bold**");
    expect(out).toContain("<!-- ad:mid-1 -->");
  });
});
