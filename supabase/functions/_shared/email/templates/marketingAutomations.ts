// Daily briefing and weekly top-brands emails are MARKETING (opt-in only). The
// welcome series (MEMBERSHIP) and the weekly Basic-analysis reminder (ROUTINES)
// go to every member except those who have explicitly unsubscribed (see
// BULK_LIFECYCLE_TEMPLATES in ../context.ts). All carry a one-click
// unsubscribe link. Content comes only from real rows chosen in SQL (see 20261003110000_marketing_email_automations.sql) — nothing is
// invented, and every list section renders only when it has items.
import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import {
  emailButton,
  emailDivider,
  emailFaithfulToNature,
  emailHeading,
  emailParagraph,
  emailSkynnMiniCard,
} from "../components.ts";

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

/** Sponsored banner unless the processor says this member's plan is ad-free/ad-light. */
const adBlock = (vars: Record<string, unknown>) => (vars.show_ads === false ? "" : emailFaithfulToNature());

const link = (href: string, text: string) =>
  `<a href="${escapeHtml(href)}" style="font-size:15px;font-weight:700;color:${BRAND.text};text-decoration:none;" target="_blank" rel="noopener noreferrer">${escapeHtml(text)}</a>`;

const small = (text: string) => `<p style="margin:4px 0 0 0;font-size:13px;line-height:19px;color:${BRAND.muted};">${escapeHtml(text)}</p>`;

// ---------------------------------------------------------------- daily briefing
interface BriefingVar {
  title?: string;
  slug?: string;
  excerpt?: string;
}

registerTemplate({
  id: "daily_briefing_digest",
  category: "MARKETING",
  internalName: "Daily briefings digest",
  transactional: false,
  requiredVars: ["briefings"],
  subject: (vars) => {
    const items = asArray<BriefingVar>(vars.briefings);
    const first = items[0]?.title;
    if (!first) return "Today's briefings from SkinLabs®";
    return items.length > 1 ? `Today's briefings: ${first} + ${items.length - 1} more` : `Today's briefing: ${first}`;
  },
  preheader: (vars) => asArray<BriefingVar>(vars.briefings)[0]?.excerpt?.slice(0, 120) || "Your skincare news, in two minutes.",
  render: (vars) => {
    const items = asArray<BriefingVar>(vars.briefings);
    const list = items
      .map(
        (b) => `
        <div style="margin:0 0 16px 0;">
          ${link(`${BRAND.siteUrl}/briefings/${b.slug ?? ""}`, b.title ?? "")}
          ${b.excerpt ? small(b.excerpt) : ""}
        </div>`,
      )
      .join("");
    return `
      ${emailHeading("Today's briefings")}
      ${emailParagraph("What's new in South African skincare, read in a couple of minutes.")}
      ${list}
      ${emailButton("Read today's briefings", `${BRAND.siteUrl}/briefings`)}
      ${emailSkynnMiniCard()}
      ${adBlock(vars)}
    `;
  },
});

// ------------------------------------------------------------ weekly top brands
interface BrandVar {
  brand?: string;
  avg_score?: number | string;
  review_count?: number;
  top_product?: string;
  top_product_id?: string;
}

registerTemplate({
  id: "weekly_top_brands",
  category: "MARKETING",
  internalName: "Weekly top skincare brands",
  transactional: false,
  requiredVars: ["brands"],
  subject: (vars) => {
    const n = asArray<BrandVar>(vars.brands).length;
    const theme = typeof vars.theme === "string" && vars.theme ? `: ${vars.theme}` : "";
    return n >= 3 ? `Our top 3 skincare brands this week${theme}` : `Our top skincare brands this week${theme}`;
  },
  preheader: () => "Ranked by SkinLabs® review scores, not by who pays for placement.",
  render: (vars) => {
    const brands = asArray<BrandVar>(vars.brands);
    const theme = typeof vars.theme === "string" && vars.theme ? vars.theme : "";
    const rows = brands
      .map(
        (b, i) => `
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 14px 0;">
          <tr>
            <td width="36" valign="top" style="font-size:22px;font-weight:700;color:${BRAND.text};">${i + 1}</td>
            <td valign="top">
              <p style="margin:0;font-size:15px;line-height:22px;font-weight:700;color:${BRAND.text};">${escapeHtml(b.brand ?? "")}
                <span style="font-weight:600;color:${BRAND.muted};">&middot; ${escapeHtml(String(b.avg_score ?? ""))}/10 avg</span></p>
              ${
                b.top_product
                  ? `<p style="margin:2px 0 0 0;font-size:13px;line-height:19px;color:${BRAND.muted};">Best scorer: ${
                      b.top_product_id
                        ? `<a href="${BRAND.siteUrl}/reviews/${escapeHtml(b.top_product_id)}" style="color:${BRAND.text};" target="_blank" rel="noopener noreferrer">${escapeHtml(b.top_product)}</a>`
                        : escapeHtml(b.top_product)
                    } (${Number(b.review_count ?? 1)} review${Number(b.review_count ?? 1) === 1 ? "" : "s"})</p>`
                  : ""
              }
            </td>
          </tr>
        </table>`,
      )
      .join("");
    return `
      ${emailHeading(brands.length >= 3 ? "Our top 3 skincare brands this week" : "Our top skincare brands this week")}
      ${emailParagraph(
        `This week's category: <strong>${escapeHtml(theme || "skincare")}</strong>. Brands are ranked by the average of our four review scores (efficacy, value, texture and SA climate fit) across their SkinLabs® reviews in that category. Sponsored reviews are never counted and brands can't buy a place on this list.`,
      )}
      ${rows}
      ${emailButton("See every review", `${BRAND.siteUrl}/reviews`)}
      ${emailDivider()}
      ${emailSkynnMiniCard({ headline: "Which of these suits your skin?" })}
      ${adBlock(vars)}
    `;
  },
});

// ---------------------------------------------------------------- welcome series
// Four evergreen emails after the transactional welcome (days 1, 3, 5, 8).
// `has_analysis` is re-read at send time by the processor so the Basic-analysis
// call to action never nags someone who already took it.
function welcome(
  step: 1 | 2 | 3 | 4,
  def: {
    subject: string;
    preheader: string;
    heading: string;
    body: (vars: Record<string, unknown>) => string;
    cta: (vars: Record<string, unknown>) => [string, string];
    card?: (vars: Record<string, unknown>) => string;
  },
) {
  registerTemplate({
    id: `welcome_series_${step}`,
    category: "MEMBERSHIP",
    internalName: `Welcome series ${step} of 4`,
    transactional: false,
    requiredVars: [],
    subject: () => def.subject,
    preheader: () => def.preheader,
    render: (vars) => {
      const [label, url] = def.cta(vars);
      return `
        ${emailHeading(def.heading)}
        ${def.body(vars)}
        ${emailButton(label, url)}
        ${def.card ? def.card(vars) : ""}
        ${step === 4 ? adBlock(vars) : ""}
      `;
    },
  });
}

const hasAnalysis = (vars: Record<string, unknown>) => vars.has_analysis === true;

welcome(1, {
  subject: "Your free skin analysis takes about two minutes",
  preheader: "Start with the one thing that makes everything else personal.",
  heading: "Start with your free Basic AI Skin Analysis",
  body: (vars) =>
    hasAnalysis(vars)
      ? emailParagraph("You've already taken your Basic AI Skin Analysis, so you're ahead of most members. Your result is saved in your dashboard whenever you want to look back at it.") +
        emailParagraph("Next up: turn it into a morning and evening routine.")
      : emailParagraph("SKYNN AI asks a short set of questions about your skin type, concerns, climate and budget, then builds a skin profile and routine around your answers.") +
        emailParagraph("It's free, takes about two minutes, and your photo never leaves your device. It's a cosmetic guide, not a medical diagnosis."),
  cta: (vars) => (hasAnalysis(vars) ? ["Open my dashboard", `${BRAND.siteUrl}/dashboard`] : ["Take the free analysis", `${BRAND.siteUrl}/skynn-ai`]),
  card: (vars) => (hasAnalysis(vars) ? "" : emailSkynnMiniCard({ headline: "Free for every member", cta: "Start my analysis" })),
});

welcome(2, {
  subject: "How to read a skincare label in 60 seconds",
  preheader: "Ingredient order, percentages and what to ignore.",
  heading: "How to read a skincare label",
  body: () =>
    emailParagraph("Ingredients are listed from highest to lowest concentration, down to 1%. After that the order is anyone's guess, so a hero active listed near the end is usually there for the label, not for your skin.") +
    emailParagraph("Look for the active you actually want (niacinamide, vitamin C, a retinoid, SPF filters), check where it sits in the list, and ignore front-of-pack buzzwords. Our ingredient pages explain what each one does, who it suits and what to avoid layering it with."),
  cta: () => ["Browse ingredient guides", `${BRAND.siteUrl}/ingredients`],
  card: () => emailSkynnMiniCard({ headline: "Not sure what your skin needs?" }),
});

welcome(3, {
  subject: "Turn your analysis into a routine",
  preheader: "Smart Routines are free with your Basic AI Skin Analysis.",
  heading: "Your Smart Routine is built from your Basic analysis",
  body: (vars) =>
    emailParagraph("Smart Routines turn your saved Basic AI Skin Analysis into a morning and evening routine that reflects your skin type, concerns, sensitivity, climate and budget, using products SkinLabs® has reviewed.") +
    emailParagraph(
      hasAnalysis(vars)
        ? "Your analysis is saved, so you can build yours now. Tick off each step and watch your streak grow."
        : "Take your free Basic AI Skin Analysis first, then build your routine in one tap.",
    ),
  cta: (vars) => (hasAnalysis(vars) ? ["Build my Smart Routine", `${BRAND.siteUrl}/dashboard?tab=routine`] : ["Take the free analysis", `${BRAND.siteUrl}/skynn-ai`]),
});

welcome(4, {
  subject: "Choose skincare with evidence, not hype",
  preheader: "Independent reviews and head-to-head Shelf Showdowns.",
  heading: "Reviews you can trust, showdowns you can use",
  body: () =>
    emailParagraph("Every SkinLabs® review scores efficacy, value, texture and South African climate fit, and brands can't buy a better score.") +
    emailParagraph("When you're torn between two products, a Shelf Showdown compares them head to head on actives, evidence and Rand value, with no forced winner when the honest answer is \"it depends\"."),
  cta: () => ["Explore Shelf Showdowns", `${BRAND.siteUrl}/compare`],
  card: () => emailSkynnMiniCard({ headline: "Make the showdown personal", body: "Your free Basic AI Skin Analysis tells you which side of the comparison fits your skin." }),
});

// -------------------------------------------------- weekly Basic-analysis reminder
registerTemplate({
  id: "weekly_analysis_reminder",
  category: "ROUTINES",
  internalName: "Weekly free Basic analysis reminder",
  transactional: false,
  requiredVars: [],
  subject: () => "Your free weekly skin check is ready",
  preheader: () => "Skin changes week to week. See what's different.",
  render: (vars) => `
    ${emailHeading("Your free weekly skin check is ready")}
    ${emailParagraph(
      "Glow Explorer and Glow Lite members can take a fresh Basic AI Skin Analysis once every 7 days, and yours is available again. Skin shifts with the season, your sleep and your routine, so a quick re-check keeps your profile and Smart Routine current.",
    )}
    ${emailButton("Check my skin now", `${BRAND.siteUrl}/skynn-ai`)}
    ${emailSkynnMiniCard({
      headline: "Want it any time?",
      body: "Glow Insider members can re-analyse as often as they like.",
      cta: "See plans",
      url: `${BRAND.siteUrl}/pricing`,
    })}
    ${adBlock(vars)}
  `,
});
