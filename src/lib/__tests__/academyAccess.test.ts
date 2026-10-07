import { describe, expect, test } from "bun:test";
import {
  ACADEMY_CLOSED,
  hasAcademyRole,
  isAcademyLive,
  isAcademyStaff,
  isTierIncluded,
  NO_ACADEMY_ROLES,
  parseAcademyConfig,
  parseAcademyRoles,
} from "@/lib/academy/access";

describe("Academy rollout config", () => {
  test("garbage or missing config reads as closed", () => {
    for (const raw of [null, undefined, "x", 3, {}, { stage: "bogus" }]) {
      const c = parseAcademyConfig(raw);
      expect(c.stage).toBe("disabled");
      expect(isAcademyLive(c)).toBe(false);
    }
    expect(ACADEMY_CLOSED.catalogueOpen).toBe(false);
  });

  test("live only when the stage is public AND the catalogue is open for the viewer", () => {
    const base = { stage: "public", catalogue_open: true, paid_enrolment_enabled: false, certificates_enabled: true, reviews_enabled: false };
    expect(isAcademyLive(parseAcademyConfig(base))).toBe(true);
    expect(isAcademyLive(parseAcademyConfig({ ...base, catalogue_open: false }))).toBe(false);
    // staff see the catalogue in preview, but that is not "live" for the public
    expect(isAcademyLive(parseAcademyConfig({ ...base, stage: "preview" }))).toBe(false);
    expect(parseAcademyConfig(base).certificatesEnabled).toBe(true);
    expect(parseAcademyConfig(base).paidEnrolmentEnabled).toBe(false);
  });
});

describe("Academy roles", () => {
  const raw = { is_admin: false, roles: [{ role: "instructor", course_id: "c1" }, { role: "reviewer", course_id: null }, { role: "nonsense", course_id: null }] };

  test("parses known roles and ignores unknown ones", () => {
    const r = parseAcademyRoles(raw);
    expect(r.roles).toEqual([
      { role: "instructor", courseId: "c1" },
      { role: "reviewer", courseId: null },
    ]);
    expect(isAcademyStaff(r)).toBe(true);
    expect(isAcademyStaff(NO_ACADEMY_ROLES)).toBe(false);
    expect(parseAcademyRoles(null)).toEqual(NO_ACADEMY_ROLES);
  });

  test("course-scoped vs academy-wide roles; admins satisfy everything", () => {
    const r = parseAcademyRoles(raw);
    expect(hasAcademyRole(r, "instructor", "c1")).toBe(true);
    expect(hasAcademyRole(r, "instructor", "c2")).toBe(false);
    expect(hasAcademyRole(r, "reviewer", "anything")).toBe(true);
    expect(hasAcademyRole(r, "assessor")).toBe(false);
    expect(hasAcademyRole(parseAcademyRoles({ is_admin: true, roles: [] }), "assessor", "c2")).toBe(true);
  });
});

describe("membership inclusion", () => {
  test("explorers are never included; tiers must be listed", () => {
    expect(isTierIncluded("explorer", ["insider", "vip"])).toBe(false);
    expect(isTierIncluded("insider", ["insider", "vip"])).toBe(true);
    expect(isTierIncluded("glow_lite", ["insider", "vip"])).toBe(false);
    expect(isTierIncluded("vip", [])).toBe(false);
  });
});
