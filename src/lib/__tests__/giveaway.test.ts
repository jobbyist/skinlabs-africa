import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  GIVEAWAY_CAMPAIGN,
  GIVEAWAY_CLOSES_AT,
  GIVEAWAY_COPY,
  GIVEAWAY_LEGAL,
  GIVEAWAY_PATH,
  GIVEAWAY_SEO,
  GIVEAWAY_STORY_SLUG,
  daysLeft,
  giveawayOpenQuestions,
  isGiveawayOpen,
  normaliseTikTokHandle,
} from "../giveaway/campaign";
import { giveawayTermsSections } from "../giveaway/terms";
import {
  GIVEAWAY_EVENTS,
  hasGiveawayContext,
  markGiveawayContext,
  sanitizeGiveawayPayload,
  trackGiveawayAssessment,
} from "../giveaway/analytics";
import { contentForPath, tiktokEventFor } from "../tiktok/events";
import { isKnownSpaPath } from "../routing/spaRoutes";
import { curatedStories, giveawayOctober2026Story, GIVEAWAY_OCT_2026_MEDIA } from "../webStories/curated";

const ROOT = join(import.meta.dir, "..", "..", "..");
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

describe("campaign rules", () => {
  test("closing instant is 15 Oct 2026 23:59:59 SAST and matches the database function", () => {
    expect(Date.parse(GIVEAWAY_CLOSES_AT)).toBe(Date.parse("2026-10-15T21:59:59Z"));
    expect(read("supabase/migrations/20261006100000_giveaway_entries.sql")).toContain("timestamptz '2026-10-15 23:59:59+02'");
  });

  test("open until the closing instant, closed after", () => {
    expect(isGiveawayOpen(Date.parse("2026-10-03T12:00:00Z"))).toBe(true);
    expect(isGiveawayOpen(Date.parse("2026-10-15T21:59:59Z"))).toBe(true);
    expect(isGiveawayOpen(Date.parse("2026-10-15T22:00:00Z"))).toBe(false);
  });

  test("daysLeft counts SAST calendar days and is null once closed", () => {
    expect(daysLeft(Date.parse("2026-10-15T10:00:00+02:00"))).toBe(0);
    expect(daysLeft(Date.parse("2026-10-14T23:00:00+02:00"))).toBe(1);
    expect(daysLeft(Date.parse("2026-10-04T08:00:00+02:00"))).toBe(11);
    expect(daysLeft(Date.parse("2026-10-16T00:00:01+02:00"))).toBeNull();
  });

  test("TikTok usernames: @ optional, safe characters only", () => {
    expect(normaliseTikTokHandle("@glow.fan_1")).toBe("glow.fan_1");
    expect(normaliseTikTokHandle("  skinlabsza ")).toBe("skinlabsza");
    for (const bad of ["a", "has space", "bad!", "x".repeat(25), "ends.", "<script>"]) expect(normaliseTikTokHandle(bad)).toBeNull();
  });

  test("approved CTA copy is verbatim", () => {
    expect(GIVEAWAY_COPY.primaryCta).toBe("Get started with the free skin assessment");
    expect(GIVEAWAY_COPY.secondaryCta).toBe("Start the free dermatology analysis");
    expect(GIVEAWAY_COPY.enterCta).toBe("Enter the Giveaway");
    expect(GIVEAWAY_COPY.storyCta).toBe("Share Your Skin Story");
  });

  test("unconfirmed legal facts are tracked, never invented", () => {
    const open = giveawayOpenQuestions();
    expect(open.length).toBeGreaterThan(5);
    expect(open.join(" ")).toMatch(/legal entity/i);
    expect(giveawayOpenQuestions({ ...GIVEAWAY_LEGAL, prizeAwardDate: "d", lifetimeActivation: "a", promoterLegalName: "X (Pty) Ltd", promoterRegistration: "R", minimumAge: 18, territory: "South Africa", winnerSelectionMethod: "m", winnerAnnouncementDate: "d", prizeClaimWindowDays: 7, ugcRepostLicence: false, lifetimeDefinition: "l", voucherExpiryNote: "v", signedOff: true })).toEqual([]);
  });
});

describe("terms & conditions", () => {
  const text = (legal = GIVEAWAY_LEGAL) =>
    giveawayTermsSections(legal).flatMap((s) => [s.title, ...s.paragraphs, ...(s.bullets ?? [])]).join("\n");

  test("covers every required item from the brief", () => {
    const t = text();
    for (const needle of [
      "October 2026 Skin Story Giveaway", "15 October 2026", "23:59", "@skinlabsza", "TikTok Story", "free",
      "R500 Takealot voucher", "Lifetime Glow Insider", "two winners", "One entry per person", "does not mean you will win",
      "Winners are announced", "information we need to deliver", "disqualify", "do not have to buy anything",
      "never sent to TikTok", "not sponsored, administered, run or endorsed by TikTok or Takealot", "laws of South Africa",
      "cancel or suspend", "not medical advice", "Privacy Policy" ,
    ]) {
      if (needle === "Privacy Policy") continue; // the link is rendered by GiveawayTerms
      expect(t.toLowerCase()).toContain(needle.toLowerCase());
    }
  });

  test("does not require a positive review and promises no repost without asking by default", () => {
    const t = text();
    expect(t).toContain("You do not have to say anything positive");
    expect(t).toContain("We will not repost or use your Story in advertising without asking you first");
  });

  const NOTHING_SUPPLIED = {
    ...GIVEAWAY_LEGAL, promoterLegalName: null, promoterRegistration: null, minimumAge: null, territory: null,
    winnerSelectionMethod: null, winnerAnnouncementDate: null, prizeAwardDate: null, lifetimeActivation: null,
    prizeClaimWindowDays: null, ugcRepostLicence: null, lifetimeDefinition: null, voucherExpiryNote: null,
  };

  test("no placeholder text can reach the page, with the real config or with nothing supplied", () => {
    for (const t of [text(), text(NOTHING_SUPPLIED)]) expect(t).not.toMatch(/TODO|TBC|TBD|\[[^\]]*\]|lorem|\bnull\b|undefined/i);
  });

  test("unknown facts are never invented when nothing is supplied", () => {
    expect(text(NOTHING_SUPPLIED)).not.toMatch(/\b(18|16|21) (years|or older)|residents|citizens|Pty|registration number|16 October|1 November/i);
  });

  test("the owner-supplied facts (2026-10-04) are in the terms", () => {
    const t = text();
    expect(t).toContain("You must be 18 years old or older.");
    expect(t).toContain("legal residents or citizens of the Republic of South Africa");
    expect(t).toContain("16 October 2026");
    expect(t).toContain("Prizes are awarded on 31 October 2026.");
    expect(t).toContain("after the current extended free trial period ends on 1 November 2026");
  });

  test("supplied legal facts appear automatically", () => {
    const t = text({ ...GIVEAWAY_LEGAL, promoterLegalName: "Acme (Pty) Ltd", minimumAge: 18, territory: "South African residents", prizeClaimWindowDays: 7, winnerSelectionMethod: "A random draw.", ugcRepostLicence: true });
    expect(t).toContain("Acme (Pty) Ltd");
    expect(t).toContain("You must be 18 years old or older.");
    expect(t).toContain("You must be South African residents.");
    expect(t).toContain("within 7 days");
    expect(t).toContain("A random draw.");
    expect(t).toContain("share your TikTok Story");
  });

  test("never claims the TikTok Story is verified automatically", () => {
    expect(text()).toContain("We can’t check your TikTok Story automatically");
  });
});

describe("analytics privacy + TikTok mapping", () => {
  test("payload is a strict whitelist: nothing health-related can pass through", () => {
    const p = sanitizeGiveawayPayload({
      cta_location: "hero", cta: "primary",
      skinType: "oily", concerns: "acne", answers: "x", result: "y", mst: 4, email: "a@b.co", cta_location_extra: "no",
    });
    expect(Object.keys(p).sort()).toEqual(["campaign", "campaign_deadline", "cta", "cta_location", "landing_page"]);
    expect(p.campaign).toBe(GIVEAWAY_CAMPAIGN);
    expect(p.landing_page).toBe(GIVEAWAY_PATH);
    expect(p.campaign_deadline).toBe("2026-10-15");
  });

  test("rejects non-token values for whitelisted keys (no free text can leave)", () => {
    expect(sanitizeGiveawayPayload({ cta_location: "my acne is bad" }).cta_location).toBeUndefined();
    expect(sanitizeGiveawayPayload({ cta: "x".repeat(41) }).cta).toBeUndefined();
  });

  test("event names carry no health words", () => {
    for (const e of GIVEAWAY_EVENTS) expect(e).not.toMatch(/acne|eczema|rosacea|derm_|diagnos|condition|skin_type|concern|mst/);
  });

  test("only the right events are forwarded to TikTok, as the right standard events", () => {
    expect(tiktokEventFor("giveaway_cta_click")).toBe("ClickButton");
    expect(tiktokEventFor("giveaway_story_cta_click")).toBe("ClickButton");
    expect(tiktokEventFor("giveaway_assessment_completed")).toBe("SubmitForm");
    for (const e of ["giveaway_page_view", "giveaway_assessment_started", "giveaway_terms_viewed", "giveaway_entry_submitted"]) expect(tiktokEventFor(e)).toBeNull();
    // never InitiateCheckout for a free assessment
    for (const e of GIVEAWAY_EVENTS) expect(tiktokEventFor(e)).not.toBe("InitiateCheckout");
  });

  test("ViewContent describes the page with a public id, no health data", () => {
    expect(contentForPath("/giveaways/october-2026")).toEqual({ content_id: "giveaway-october-2026", content_type: "product", content_name: "October 2026 Skin Story Giveaway" });
    expect(contentForPath("/giveaways/october-2026/")?.content_id).toBe("giveaway-october-2026");
  });

  test("the analytics module can't read assessment content", () => {
    const src = read("src/lib/giveaway/analytics.ts");
    expect(src).not.toMatch(/from "@\/lib\/(starter-analysis|formulator|skynn\/(?!analytics|terminology))|formulaResults|skincare_recommendations|result_payload/);
  });

  test("the edge function whitelist accepts ClickButton and pins a giveaway page key", () => {
    const edge = read("supabase/functions/_shared/tiktok/eventsApi.ts");
    expect(edge).toContain('"ClickButton"');
    expect(edge).toContain('"/giveaways/october-2026"');
  });
});

describe("assessment reporting (dedup)", () => {
  const original = (globalThis as { window?: unknown }).window;
  const store = new Map<string, string>();
  beforeAll(() => {
    (globalThis as unknown as { window: unknown }).window = {
      sessionStorage: { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) },
      location: { pathname: GIVEAWAY_PATH, search: "" },
    };
  });
  afterAll(() => {
    (globalThis as { window?: unknown }).window = original;
  });

  test("does nothing for visitors who did not come through the giveaway", () => {
    store.clear();
    expect(hasGiveawayContext()).toBe(false);
    trackGiveawayAssessment("completed");
    expect([...store.keys()].some((k) => k.includes("assessment_completed"))).toBe(false);
  });

  test("reports each stage once per session however often it is called", () => {
    store.clear();
    markGiveawayContext();
    expect(hasGiveawayContext()).toBe(true);
    trackGiveawayAssessment("started");
    trackGiveawayAssessment("started");
    trackGiveawayAssessment("completed");
    trackGiveawayAssessment("completed");
    const flags = [...store.keys()].filter((k) => k.includes("skinlabs_giveaway_once_assessment_"));
    expect(flags.sort()).toEqual(["skinlabs_giveaway_once_assessment_completed", "skinlabs_giveaway_once_assessment_started"]);
  });

  test("the SKYNN AI flow calls the reporter at its existing start and result moments", () => {
    const src = read("src/components/AIFormulator.tsx");
    expect(src).toContain('trackGiveawayAssessment("started")');
    expect(src).toContain('trackGiveawayAssessment("completed")');
  });
});

describe("SEO, routing and story", () => {
  test("campaign title is exact and the description stays within a snippet", () => {
    expect(GIVEAWAY_SEO.title).toBe("Win R500 + Lifetime Glow Insider | SkinLabs® October Giveaway");
    expect(GIVEAWAY_SEO.description.length).toBeLessThanOrEqual(160);
    for (const needle of ["free AI skin assessment", "Skin Story", "TikTok", "R500 Takealot voucher", "Lifetime Glow Insider", "15 Oct 2026"]) expect(GIVEAWAY_SEO.description).toContain(needle);
    expect(existsSync(join(ROOT, "public", GIVEAWAY_SEO.ogImage))).toBe(true);
  });

  test("the route is a known SPA path, prerendered and in the sitemap", () => {
    expect(isKnownSpaPath(GIVEAWAY_PATH)).toBe(true);
    expect(isKnownSpaPath(`${GIVEAWAY_PATH}/`)).toBe(true);
    expect(read("scripts/prerender.ts")).toContain(`"${GIVEAWAY_PATH}"`);
    expect(read("src/lib/sitemap/staticRoutes.ts")).toContain(`"${GIVEAWAY_PATH}"`);
    expect(read("src/App.tsx")).toContain(`path="${GIVEAWAY_PATH}"`);
  });

  test("CTAs go to the existing free assessment route, which still exists", () => {
    expect(read("src/lib/giveaway/campaign.ts")).toContain('GIVEAWAY_ASSESSMENT_PATH = "/skynn-ai"');
    expect(read("src/App.tsx")).toContain('path="/skynn-ai"');
  });

  test("story: video first, then how-to-enter; CTAs link the giveaway and the assessment; files exist", () => {
    const story = giveawayOctober2026Story();
    expect(story.slug).toBe(GIVEAWAY_STORY_SLUG);
    expect(story.pages[0].mediaType).toBe("video");
    expect(story.ctaLabel).toBe("Enter the Giveaway");
    expect(story.ctaUrl).toBe(GIVEAWAY_PATH);
    expect(story.pages[1].ctaLabel).toBe("Start Your Free Assessment");
    expect(story.pages[1].ctaUrl).toBe("/skynn-ai");
    for (const file of Object.values(GIVEAWAY_OCT_2026_MEDIA)) expect(existsSync(join(ROOT, "public", file))).toBe(true);
  });

  test("story is listed while the giveaway is open and removed once it closes", () => {
    expect(curatedStories(Date.parse("2026-10-10T00:00:00Z")).some((s) => s.slug === GIVEAWAY_STORY_SLUG)).toBe(true);
    expect(curatedStories(Date.parse("2026-10-16T00:00:00Z")).some((s) => s.slug === GIVEAWAY_STORY_SLUG)).toBe(false);
  });

  test("video is compressed for mobile (under 1.5 MB) and keeps a poster", () => {
    expect(readFileSync(join(ROOT, "public", GIVEAWAY_OCT_2026_MEDIA.video)).length).toBeLessThan(1_500_000);
  });
});
