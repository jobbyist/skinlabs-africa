import { describe, expect, test } from "bun:test";
import { getSiteOrigin } from "../siteOrigin";

const withHost = (hostname: string, origin: string, fn: () => void) => {
  const g = globalThis as unknown as { window?: unknown };
  const prev = g.window;
  g.window = { location: { hostname, origin } };
  try {
    fn();
  } finally {
    g.window = prev;
  }
};

describe("getSiteOrigin", () => {
  test("Vercel hostnames map to the canonical domain", () => {
    withHost("skinlabs-africa.vercel.app", "https://skinlabs-africa.vercel.app", () =>
      expect(getSiteOrigin()).toBe("https://skinlabs.co.za"));
  });
  test("the real domain and localhost are used as-is", () => {
    withHost("skinlabs.co.za", "https://skinlabs.co.za", () => expect(getSiteOrigin()).toBe("https://skinlabs.co.za"));
    withHost("localhost", "http://localhost:4173", () => expect(getSiteOrigin()).toBe("http://localhost:4173"));
  });
});
