import { describe, expect, test } from "bun:test";
import {
  DASHBOARD_SECTIONS,
  GROUP_DEFAULT_SECTION,
  LEGACY_TAB_ALIASES,
  SECTION_GROUP,
  resolveDashboardSection,
} from "../dashboardTabs";

// Every ?tab= value the dashboard accepted before the 08 IA change.
const PRE_08_TABS = ["overview", "profile", "analysis", "routine", "journey", "saved", "billing", "inbox", "security", "account"];

describe("resolveDashboardSection", () => {
  test("every legacy tab link resolves to a real section", () => {
    for (const tab of PRE_08_TABS) {
      expect(DASHBOARD_SECTIONS).toContain(resolveDashboardSection(tab));
    }
    expect(resolveDashboardSection("overview")).toBe("home");
    expect(resolveDashboardSection("billing")).toBe("billing");
  });
  test("group names open their first section", () => {
    expect(resolveDashboardSection("skin")).toBe("analysis");
    expect(resolveDashboardSection("settings")).toBe("profile");
  });
  test("every alias points at a section", () => {
    for (const target of Object.values(LEGACY_TAB_ALIASES)) expect(DASHBOARD_SECTIONS).toContain(target);
  });
  test("unknown, empty and missing fall back to home; case-insensitive", () => {
    expect(resolveDashboardSection("nope")).toBe("home");
    expect(resolveDashboardSection("")).toBe("home");
    expect(resolveDashboardSection(null)).toBe("home");
    expect(resolveDashboardSection("Billing")).toBe("billing");
  });
});

describe("groups", () => {
  test("My Skin and Settings hold the right sections", () => {
    const inGroup = (g: string) => DASHBOARD_SECTIONS.filter((s) => SECTION_GROUP[s] === g);
    expect(inGroup("skin")).toEqual(["analysis", "routine", "journey"]);
    expect(inGroup("settings")).toEqual(["profile", "billing", "security", "account"]);
  });
  test("each group's default section belongs to it", () => {
    for (const [group, section] of Object.entries(GROUP_DEFAULT_SECTION)) expect(SECTION_GROUP[section] as string).toBe(group);
  });
});
