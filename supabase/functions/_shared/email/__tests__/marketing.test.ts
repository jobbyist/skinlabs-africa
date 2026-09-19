import { describe, expect, test } from "bun:test";
import { getTemplate } from "../templates/index.ts";

describe("newsletter_weekly_digest template", () => {
  const def = getTemplate("newsletter_weekly_digest")!;

  test("renders nothing for a section with no content, without throwing", () => {
    const html = def.render({});
    expect(html).toContain("Your SkinLabs Weekly");
    expect(html).not.toContain("top stories");
    expect(html).not.toContain("notable reviews");
  });

  test("renders stories, reviews and an offer when all three are present", () => {
    const html = def.render({
      top_stories: [{ title: "Sunscreen myths", slug: "sunscreen-myths", excerpt: "Debunking the SPF 15 myth." }],
      top_reviews: [{ brand: "Esse", product_name: "Probiotic Serum", verdict: "Solid for sensitive skin.", id: "esse-probiotic-serum" }],
      offer: { headline: "20% off Analysis Passes", description: "This week only.", cta_label: "Shop now", cta_url: "https://skinlabs.co.za/pricing" },
      unsubscribe_url: "https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=abc",
    });
    expect(html).toContain("Sunscreen myths");
    expect(html).toContain("Esse Probiotic Serum");
    expect(html).toContain("20% off Analysis Passes");
    expect(html).toContain("https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1/email-unsubscribe?token=abc");
  });

  test("escapes HTML in story titles and review verdicts", () => {
    const html = def.render({
      top_stories: [{ title: "<script>alert(1)</script>", slug: "x", excerpt: "" }],
      top_reviews: [{ brand: "<img src=x>", product_name: "", verdict: "", id: "y" }],
    });
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).not.toContain("<img src=x>");
    expect(html).toContain("&lt;script&gt;");
  });

  test("subject reflects the combined story+review count", () => {
    const subject = def.subject({
      top_stories: [{ title: "A" }, { title: "B" }],
      top_reviews: [{ id: "c" }],
    });
    expect(subject).toContain("3");
  });

  test("subject falls back gracefully when there's no content", () => {
    expect(def.subject({})).toBe("Your SkinLabs Weekly");
  });
});
