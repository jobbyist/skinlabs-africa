import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailHeading, emailParagraph, emailDivider, emailButton } from "../components.ts";

interface StoryVar {
  title?: string;
  slug?: string;
  excerpt?: string;
}

interface ReviewVar {
  brand?: string;
  product_name?: string;
  verdict?: string;
  id?: string;
}

interface OfferVar {
  headline?: string;
  description?: string;
  cta_label?: string;
  cta_url?: string;
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function renderStorySection(stories: StoryVar[]): string {
  if (stories.length === 0) return "";
  const items = stories
    .map(
      (s) => `
        <div style="margin:0 0 14px 0;">
          <a href="${BRAND.siteUrl}/briefings/${escapeHtml(s.slug ?? "")}" style="font-size:15px;font-weight:700;color:${BRAND.text};text-decoration:none;" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title ?? "")}</a>
          ${s.excerpt ? `<p style="margin:4px 0 0 0;font-size:13px;line-height:19px;color:${BRAND.muted};">${escapeHtml(s.excerpt)}</p>` : ""}
        </div>
      `,
    )
    .join("");
  return `
    ${emailHeading("This week's top stories")}
    ${items}
  `;
}

function renderReviewSection(reviews: ReviewVar[]): string {
  if (reviews.length === 0) return "";
  const items = reviews
    .map(
      (r) => `
        <div style="margin:0 0 14px 0;">
          <a href="${BRAND.siteUrl}/reviews/${escapeHtml(r.id ?? "")}" style="font-size:15px;font-weight:700;color:${BRAND.text};text-decoration:none;" target="_blank" rel="noopener noreferrer">${escapeHtml(r.brand ?? "")} ${escapeHtml(r.product_name ?? "")}</a>
          ${r.verdict ? `<p style="margin:4px 0 0 0;font-size:13px;line-height:19px;color:${BRAND.muted};">${escapeHtml(r.verdict)}</p>` : ""}
        </div>
      `,
    )
    .join("");
  return `
    ${emailDivider()}
    ${emailHeading("New &amp; notable reviews")}
    ${items}
  `;
}

function renderOfferSection(offer: OfferVar | null): string {
  if (!offer || !offer.headline) return "";
  return `
    ${emailDivider()}
    ${emailHeading(offer.headline)}
    ${offer.description ? emailParagraph(escapeHtml(offer.description)) : ""}
    ${offer.cta_url ? emailButton(offer.cta_label || "Learn more", offer.cta_url) : ""}
  `;
}

registerTemplate({
  id: "newsletter_weekly_digest",
  category: "MARKETING",
  internalName: "Weekly newsletter digest",
  transactional: false,
  // No vars are individually required — enqueue_weekly_newsletter_digest()
  // only enqueues this template at all when at least one section has real
  // content (see the migration), and every section below renders
  // conditionally, so an empty/missing array or a null offer degrades
  // gracefully rather than producing a broken email.
  requiredVars: [],
  subject: (vars) => {
    const storyCount = asArray<StoryVar>(vars.top_stories).length;
    const reviewCount = asArray<ReviewVar>(vars.top_reviews).length;
    const total = storyCount + reviewCount;
    return total > 0
      ? `Your SkinLabs Weekly: ${total} new thing${total === 1 ? "" : "s"} worth knowing`
      : "Your SkinLabs Weekly";
  },
  preheader: (vars) => {
    const stories = asArray<StoryVar>(vars.top_stories);
    return stories[0]?.title ? `This week: ${stories[0].title}` : "This week's SkinLabs highlights.";
  },
  render: (vars) => {
    const stories = asArray<StoryVar>(vars.top_stories);
    const reviews = asArray<ReviewVar>(vars.top_reviews);
    const offer = (vars.offer ?? null) as OfferVar | null;
    const unsubscribeUrl = typeof vars.unsubscribe_url === "string" ? vars.unsubscribe_url : `${BRAND.siteUrl}/dashboard?tab=account`;
    return `
      ${emailHeading("Your SkinLabs Weekly")}
      ${renderStorySection(stories)}
      ${renderReviewSection(reviews)}
      ${renderOfferSection(offer)}
      ${emailDivider()}
      <p style="margin:0;font-size:12px;line-height:18px;color:${BRAND.muted};">
        You're getting this because you opted in to SkinLabs marketing updates.
        <a href="${escapeHtml(unsubscribeUrl)}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>
      </p>
    `;
  },
});
