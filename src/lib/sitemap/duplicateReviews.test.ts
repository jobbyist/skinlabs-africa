import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { DUPLICATE_REVIEW_CANONICALS, isDuplicateReview } from "./duplicateReviews";

describe("duplicate review canonicals", () => {
  const vercel = JSON.parse(readFileSync(new URL("../../../vercel.json", import.meta.url), "utf8"));
  test("every duplicate has a matching permanent redirect in vercel.json", () => {
    for (const [dup, canon] of Object.entries(DUPLICATE_REVIEW_CANONICALS)) {
      const r = vercel.redirects.find((x: { source: string }) => x.source === `/reviews/${dup}`);
      expect(r?.destination).toBe(`/reviews/${canon}`);
      expect(r?.permanent).toBe(true);
    }
  });
  test("no canonical is itself a duplicate (no chains)", () => {
    for (const canon of Object.values(DUPLICATE_REVIEW_CANONICALS)) expect(isDuplicateReview(canon)).toBe(false);
  });
});
