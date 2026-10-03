import { describe, expect, test } from "bun:test";
import { attributionSignature, parseAttribution, sanitizeUtmValue } from "../attribution";

describe("sanitizeUtmValue", () => {
  test("lowercases, trims and joins words", () => {
    expect(sanitizeUtmValue("  TikTok Test  ")).toBe("tiktok_test");
    expect(sanitizeUtmValue("ai-skin-analysis_v1.2")).toBe("ai-skin-analysis_v1.2");
  });
  test("rejects anything that isn't a plain label", () => {
    expect(sanitizeUtmValue("<script>")).toBeUndefined();
    expect(sanitizeUtmValue("a/b")).toBeUndefined();
    expect(sanitizeUtmValue("")).toBeUndefined();
    expect(sanitizeUtmValue("x".repeat(81))).toBeUndefined();
    expect(sanitizeUtmValue(42)).toBeUndefined();
    expect(sanitizeUtmValue(null)).toBeUndefined();
  });
});

describe("parseAttribution", () => {
  test("reads the five UTM fields", () => {
    expect(
      parseAttribution("?utm_source=tiktok&utm_medium=paid_social&utm_campaign=ai_analysis_oct26&utm_content=video_a&utm_term=broad"),
    ).toEqual({
      utm_source: "tiktok",
      utm_medium: "paid_social",
      utm_campaign: "ai_analysis_oct26",
      utm_content: "video_a",
      utm_term: "broad",
    });
  });
  test("organic visits return null", () => {
    expect(parseAttribution("")).toBeNull();
    expect(parseAttribution("?ref=friend&page=2")).toBeNull();
  });
  test("a lone content/term label isn't a campaign", () => {
    expect(parseAttribution("?utm_content=video_a")).toBeNull();
  });
  test("ttclid without UTMs is still credited to TikTok paid social", () => {
    expect(parseAttribution("?ttclid=E.C.P.abc123")).toEqual({
      utm_source: "tiktok",
      utm_medium: "paid_social",
      utm_campaign: "ttclid_only",
    });
  });
  test("UTMs win over ttclid", () => {
    expect(parseAttribution("?ttclid=abc&utm_source=tiktok&utm_medium=paid_social&utm_campaign=x")?.utm_campaign).toBe("x");
  });
  test("drops hostile values but keeps the good ones", () => {
    expect(parseAttribution("?utm_source=tiktok&utm_campaign=%3Cb%3E&utm_medium=paid_social")).toEqual({
      utm_source: "tiktok",
      utm_medium: "paid_social",
    });
  });
  test("a malformed ttclid is ignored", () => {
    expect(parseAttribution("?ttclid=%3Cscript%3E")).toBeNull();
  });
});

describe("attributionSignature", () => {
  test("same campaign + ad → same signature; a different ad → different", () => {
    const a = { utm_source: "tiktok", utm_medium: "paid_social", utm_campaign: "c", utm_content: "v1" };
    expect(attributionSignature(a)).toBe(attributionSignature({ ...a }));
    expect(attributionSignature(a)).not.toBe(attributionSignature({ ...a, utm_content: "v2" }));
  });
});
