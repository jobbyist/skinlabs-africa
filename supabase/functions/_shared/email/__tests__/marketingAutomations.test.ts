import { describe, expect, test } from "bun:test";
import { getTemplate } from "../templates/index.ts";
import { adsAllowedForTier, buildUnsubscribeUrl } from "../context.ts";

const render = (id: string, vars: Record<string, unknown>) => getTemplate(id)!.render(vars);
const FTN = "c.trackmytarget.com";
const MINI = "SKYNN AI &middot; Free";

describe("daily briefing digest", () => {
  const vars = { briefings: [{ title: "The Long Game", slug: "the-long-game", excerpt: "Why <skin> needs a plan" }, { title: "Second", slug: "second" }] };
  test("subject leads with today's top briefing and counts the rest", () => {
    expect(getTemplate("daily_briefing_digest")!.subject(vars)).toBe("Today's briefings: The Long Game + 1 more");
    expect(getTemplate("daily_briefing_digest")!.subject({ briefings: [{ title: "Solo" }] })).toBe("Today's briefing: Solo");
  });
  test("links each briefing, escapes content, includes the mini SKYNN card and Faithful to Nature", () => {
    const html = render("daily_briefing_digest", vars);
    expect(html).toContain("https://skinlabs.co.za/briefings/the-long-game");
    expect(html).toContain("Why &lt;skin&gt; needs a plan");
    expect(html).toContain(MINI);
    expect(html).toContain(FTN);
    expect(html).toContain("Sponsored");
  });
  test("ad-free plans get no sponsored block but keep the SKYNN card", () => {
    const html = render("daily_briefing_digest", { ...vars, show_ads: false });
    expect(html).not.toContain(FTN);
    expect(html).toContain(MINI);
  });
});

describe("weekly top brands", () => {
  const brands = [
    { brand: "Fundamentals", avg_score: 8.4, review_count: 2, top_product: "6% Niacinamide Serum", top_product_id: "fundamentals-niacinamide-6" },
    { brand: "Skin Functional", avg_score: 8.1, review_count: 6, top_product: "10% Niacinamide", top_product_id: "sf-x" },
    { brand: "Lamelle", avg_score: 7.8, review_count: 1, top_product: "Brite-Lite", top_product_id: "lamelle-x" },
  ];
  test("subject says top 3 and names the week's category", () => {
    expect(getTemplate("weekly_top_brands")!.subject({ brands, theme: "serum" })).toBe("Our top 3 skincare brands this week: serum");
  });
  test("lists ranked brands with review links, says sponsored reviews are excluded, has both blocks", () => {
    const html = render("weekly_top_brands", { brands, theme: "serum" });
    expect(html).toContain("Fundamentals");
    expect(html).toContain("/reviews/fundamentals-niacinamide-6");
    expect(html).toContain("8.4/10 avg");
    expect(html).toContain("1 review)");
    expect(html).toContain("Sponsored reviews are never counted");
    expect(html).toContain(MINI);
    expect(html).toContain(FTN);
  });
});

describe("welcome series", () => {
  test("four emails exist, each with a call to action and an unsubscribe-ready body", () => {
    for (const n of [1, 2, 3, 4]) {
      const def = getTemplate(`welcome_series_${n}`)!;
      expect(def.category).toBe("MARKETING");
      expect(def.transactional).toBe(false);
      expect(render(`welcome_series_${n}`, {})).toContain("<a href=");
    }
  });
  test("email 1 stops pushing the free analysis once the member has taken one", () => {
    expect(render("welcome_series_1", { has_analysis: false })).toContain("Take the free analysis");
    const done = render("welcome_series_1", { has_analysis: true });
    expect(done).not.toContain("Take the free analysis");
    expect(done).toContain("Open my dashboard");
  });
  test("email 3 says Smart Routines come from the free Basic analysis", () => {
    expect(render("welcome_series_3", { has_analysis: true })).toContain("Build my Smart Routine");
    expect(render("welcome_series_3", {})).toContain("saved Basic AI Skin Analysis");
  });
  test("copy never claims dermatologist review or photo analysis", () => {
    for (const n of [1, 2, 3, 4]) {
      const html = render(`welcome_series_${n}`, {}).toLowerCase();
      expect(html).not.toContain("dermatologist-reviewed");
      expect(html).not.toContain("analyses your photo");
    }
  });
});

describe("weekly analysis reminder", () => {
  test("names the free 7-day Basic analysis and links to SKYNN AI", () => {
    const html = render("weekly_analysis_reminder", {});
    expect(html).toContain("once every 7 days");
    expect(html).toContain("https://skinlabs.co.za/skynn-ai");
  });
});

describe("recipient context helpers", () => {
  test("unsubscribe URL only for a well-formed token", () => {
    const t = "123e4567-e89b-12d3-a456-426614174000";
    expect(buildUnsubscribeUrl("https://x.supabase.co/", t)).toBe(`https://x.supabase.co/functions/v1/email-unsubscribe?token=${t}`);
    expect(buildUnsubscribeUrl("https://x.supabase.co", "not-a-uuid")).toBeNull();
    expect(buildUnsubscribeUrl("https://x.supabase.co", null)).toBeNull();
  });
  test("ads follow the site's ad policy: Explorer / Glow Lite only", () => {
    expect(adsAllowedForTier("explorer")).toBe(true);
    expect(adsAllowedForTier("glow_lite")).toBe(true);
    expect(adsAllowedForTier("insider")).toBe(false);
    expect(adsAllowedForTier("vip")).toBe(false);
  });
});
