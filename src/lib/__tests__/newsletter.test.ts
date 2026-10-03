import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { isValidNewsletterEmail, normaliseEmail, sanitiseSource, NEWSLETTER_CONSENT_TEXT } from "../newsletter";

describe("newsletter helpers", () => {
  test("normalises and validates emails the way the RPC does", () => {
    expect(normaliseEmail("  Jane@Example.CO.za ")).toBe("jane@example.co.za");
    expect(isValidNewsletterEmail("jane@example.co.za")).toBe(true);
    for (const bad of ["", "a@b", "no at.com", "a b@c.com", `${"a".repeat(260)}@x.com`]) {
      expect(isValidNewsletterEmail(bad)).toBe(false);
    }
  });

  test("source ids are restricted to what the server accepts", () => {
    expect(sanitiseSource("briefing-end")).toBe("briefing-end");
    expect(sanitiseSource("footer:home")).toBe("footer:home");
    expect(sanitiseSource("Bad Source!")).toBe("unknown");
    expect(sanitiseSource("x".repeat(65))).toBe("unknown");
  });

  test("consent copy on the page matches the wording the migration stores", () => {
    const sql = readFileSync("supabase/migrations/20261003090000_newsletter_double_opt_in.sql", "utf8");
    expect(sql).toContain(NEWSLETTER_CONSENT_TEXT);
  });

  test("no client role can write newsletter_subscribers or read its tokens directly", () => {
    const sql = readFileSync("supabase/migrations/20261003090000_newsletter_double_opt_in.sql", "utf8");
    expect(sql).toContain("REVOKE INSERT, UPDATE, DELETE ON public.newsletter_subscribers FROM anon, authenticated");
    expect(sql).toContain("REVOKE SELECT ON public.newsletter_subscribers FROM anon, authenticated");
    const grant = sql.slice(sql.indexOf("GRANT SELECT ("), sql.indexOf(") ON public.newsletter_subscribers TO authenticated"));
    expect(grant).not.toContain("token");
  });
});
