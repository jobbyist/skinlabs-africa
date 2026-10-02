/**
 * Dashboard information architecture:
 *   Home · My Skin (Analysis / Routine / PhotoJournal / Journey) · Saved · Inbox ·
 *   Settings (Profile / Billing / Security / Account)
 *
 * `?tab=` always holds a LEAF section, so every deep link that existed before
 * keeps working unchanged.
 */

export const DASHBOARD_SECTIONS = [
  "home",
  "analysis",
  "routine",
  "photojournal",
  "journey",
  "saved",
  "inbox",
  "profile",
  "billing",
  "security",
  "account",
] as const;
export type DashboardSection = (typeof DASHBOARD_SECTIONS)[number];

export type DashboardGroup = "home" | "skin" | "saved" | "inbox" | "settings";

export const SECTION_GROUP: Record<DashboardSection, DashboardGroup> = {
  home: "home",
  analysis: "skin",
  routine: "skin",
  photojournal: "skin",
  journey: "skin",
  saved: "saved",
  inbox: "inbox",
  profile: "settings",
  billing: "settings",
  security: "settings",
  account: "settings",
};

export const GROUP_DEFAULT_SECTION: Record<DashboardGroup, DashboardSection> = {
  home: "home",
  skin: "analysis",
  saved: "saved",
  inbox: "inbox",
  settings: "profile",
};

export const LEGACY_TAB_ALIASES: Record<string, DashboardSection> = {
  overview: "home",
  skin: "analysis",
  "my-skin": "analysis",
  my_skin: "analysis",
  reports: "analysis",
  formulator: "analysis",
  "skin-analysis": "analysis",
  "skynn-ai": "analysis",
  "skin-journey": "journey",
  "photo-journal": "photojournal",
  "photo_journal": "photojournal",
  "photojournal": "photojournal",
  settings: "profile",
  notifications: "inbox",
  mfa: "security",
  subscription: "billing",
  membership: "billing",
};

export const resolveDashboardSection = (tab: string | null | undefined): DashboardSection => {
  const value = (tab ?? "").trim().toLowerCase();
  if ((DASHBOARD_SECTIONS as readonly string[]).includes(value)) return value as DashboardSection;
  return LEGACY_TAB_ALIASES[value] ?? "home";
};
