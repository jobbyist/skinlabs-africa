import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { isKnownSpaPath } from "./spaRoutes";

describe("isKnownSpaPath", () => {
  test("accepts real routes", () => {
    for (const p of ["/", "/dashboard", "/reviews/page/2", "/reviews/some-slug", "/knowledge-hub/q", "/pricing/", "/reviews/versus/a-vs-b"]) {
      expect(isKnownSpaPath(p)).toBe(true);
    }
  });
  test("rejects junk", () => {
    for (const p of ["/nope", "/wp-login.php", "/reviews/a/b/c", "/dashboard/x", "/.env", "/admin/x"]) {
      expect(isKnownSpaPath(p)).toBe(false);
    }
  });
  test("covers every static route in App.tsx", () => {
    const src = readFileSync(new URL("../../App.tsx", import.meta.url), "utf8");
    const paths = [...src.matchAll(/<Route path="([^"]+)"/g)].map((m) => m[1]).filter((p) => p !== "*");
    for (const p of paths) {
      const sample = p.replace(/:[a-zA-Z]+/g, "sample");
      expect(isKnownSpaPath(sample)).toBe(true);
    }
  });
});
