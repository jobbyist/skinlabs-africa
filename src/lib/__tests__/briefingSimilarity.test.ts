import { describe, expect, test } from "bun:test";
import {
  canonicalSourceUrl,
  findDuplicate,
} from "../../../supabase/functions/_shared/pipelines/briefingSimilarity";

// Real Daily Skinny rows from Sept 2026 (titles/excerpts verbatim).
const PIGMENT_1 = {
  title: "The Pigment Puzzle: A South African Guide to Clearing Your Skin",
  excerpt: "Understanding your pigment type is the secret to clearing dark spots without causing more damage to your skin.",
};
const PIGMENT_2 = {
  title: "The Pigment Puzzle: Navigating Hyperpigmentation in the South African Sun",
  excerpt: "Understanding your skin type and the root cause of dark spots is the only way to effectively clear pigmentation in our harsh sun.",
};
const ARMS = {
  title: "The Skin on Your Arms: A Practical Guide to Monitoring Flat Spots",
  excerpt: "That new flat spot on your arm is usually harmless, but here is how to tell the difference between a simple sun spot and",
};
const FACE = {
  title: "The Daily Skinny: Decoding Your Face's Hidden History",
  excerpt: "That new flat spot on your face is likely just a souvenir from our harsh South African sun, but here is how to tell the ",
};
const NIACINAMIDE = {
  title: "Niacinamide Is Not a Bleach. It Is How Marks Fade Without the Ban.",
  excerpt: "Five percent used for twelve weeks can lower contrast on PIH. It will not outrun Highveld UV or a market-stall cream.",
};
const TXA = {
  title: "Tranexamic Acid Is Not a Bleach. Heat Still Writes the Patch.",
  excerpt: "Topical TXA can lower contrast on melasma over twelve weeks. It will not outrun a hot car, Highveld visible light or a c",
};
const PARTING = {
  title: "Your Face Has SPF. Your Parting Is a UV Strip.",
  excerpt: "Hair is not a hat. A centre part, a fade and a thinning crown are scalp under SA sun.",
};
const LIPS = {
  title: "Your Cheeks Have SPF. Your Mouth Has a Flavoured Stick.",
  excerpt: "Lips burn and pigment too. A flavoured balm is not SPF.",
};

describe("canonicalSourceUrl", () => {
  test("strips Google srsltid and utm params, www and trailing slash", () => {
    const a = canonicalSourceUrl("https://barbeauty.ca/hyperpigmentation/?srsltid=AU7gw4WIkV6Q0X7o");
    const b = canonicalSourceUrl("https://www.barbeauty.ca/hyperpigmentation?srsltid=AU7gw4UHqj2j&utm_source=x");
    expect(a).toBe("barbeauty.ca/hyperpigmentation");
    expect(b).toBe(a);
  });
  test("keeps meaningful query params", () => {
    expect(canonicalSourceUrl("https://example.com/a?id=2&utm_medium=y")).toBe("example.com/a?id=2");
    expect(canonicalSourceUrl("https://example.com/a?id=2")).not.toBe(canonicalSourceUrl("https://example.com/a?id=3"));
  });
  test("empty and invalid inputs", () => {
    expect(canonicalSourceUrl(null)).toBe("");
    expect(canonicalSourceUrl("not a url")).toBe("not a url");
  });
});

describe("findDuplicate", () => {
  test("flags the repeated Pigment Puzzle briefing", () => {
    expect(findDuplicate(PIGMENT_2, [PIGMENT_1])?.result.reason).toBe("similar_title");
  });
  test("flags the reworded flat-spot briefing by its excerpt", () => {
    expect(findDuplicate(FACE, [ARMS])?.result.reason).toBe("similar_excerpt");
  });
  test("does not flag distinct topics that share a house style", () => {
    expect(findDuplicate(TXA, [NIACINAMIDE])).toBeNull();
    expect(findDuplicate(PARTING, [LIPS])).toBeNull();
    expect(findDuplicate(PIGMENT_1, [ARMS, NIACINAMIDE, PARTING])).toBeNull();
  });
  test("an exact repeat is always caught", () => {
    expect(findDuplicate(ARMS, [LIPS, ARMS])?.match).toBe(ARMS);
  });
});
