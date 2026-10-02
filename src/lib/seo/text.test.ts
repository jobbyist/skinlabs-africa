import { describe, expect, test } from "bun:test";
import { clampAtWord, endsMidSentence } from "./text";
import { articleJsonLd } from "./jsonLd";

describe("clampAtWord", () => {
  test("leaves short text alone", () => expect(clampAtWord("Short one.", 160)).toBe("Short one."));
  test("never cuts mid-word and stays within limit", () => {
    const out = clampAtWord("word ".repeat(80), 160);
    expect(out.length).toBeLessThanOrEqual(160);
    expect(out.endsWith("…")).toBe(true);
    expect(out).not.toMatch(/wor…$/);
  });
  test("prefers a sentence boundary", () => {
    const first = "This opening sentence is long enough to count as a real, complete thought.";
    const out = clampAtWord(`${first} ${"and then it keeps going ".repeat(10)}`, 100);
    expect(out).toBe(first);
  });
});

describe("endsMidSentence", () => {
  test("detects truncation", () => {
    expect(endsMidSentence("Ends properly.")).toBe(false);
    expect(endsMidSentence("Cut off mid wo")).toBe(true);
    expect(endsMidSentence(null)).toBe(true);
  });
});

describe("articleJsonLd paywall", () => {
  const base = { canonicalUrl: "https://x.test/a", headline: "h", description: "d", datePublished: "2026-01-01", dateModified: "2026-01-01" };
  test("free articles carry no paywall markup", () => {
    expect((articleJsonLd(base) as Record<string, unknown>).isAccessibleForFree).toBeUndefined();
  });
  test("premium articles declare the gated element", () => {
    const j = articleJsonLd({ ...base, isPaywalled: true }) as Record<string, unknown> & { hasPart: { cssSelector: string } };
    expect(j.isAccessibleForFree).toBe(false);
    expect(j.hasPart.cssSelector).toBe(".premium-body");
  });
});
