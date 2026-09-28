// Trial lifecycle emails (onboarding overhaul 09), enqueued daily by
// enqueue_trial_lifecycle_emails() — selection lives in the SQL function
// trial_lifecycle_email_plan(); send-time guards in ../guards.ts. Plan-aware
// and card-aware like the other trial emails in membership.ts. Brand voice:
// calm, specific, never "ACT NOW"; the end date is always stated plainly.
import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailButton, emailDivider, emailHeading, emailKeyValueTable, emailParagraph } from "../components.ts";

const PLAN_LABELS: Record<string, string> = { glow_lite: "Glow Lite", insider: "Glow Insider", vip: "Glow VIP" };
const planOf = (vars: Record<string, unknown>) => PLAN_LABELS[String(vars.plan ?? "insider").toLowerCase()] ?? "Glow Insider";

const dateOf = (value: unknown): string => {
  const d = new Date(String(value ?? ""));
  if (!value || Number.isNaN(d.getTime())) return "the end of your trial";
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
};

const zar = (value: unknown): string | null => {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? `R${n.toFixed(2)}` : null;
};

const cardOnFile = (vars: Record<string, unknown>) => vars.has_payment_method === true || vars.has_payment_method === "true";
const noCardOnFile = (vars: Record<string, unknown>) => vars.has_payment_method === false || vars.has_payment_method === "false";

const KEEP_URL = `${BRAND.siteUrl}/dashboard?tab=billing&keep=1`;
const BILLING_URL = `${BRAND.siteUrl}/dashboard?tab=billing`;

const unsubscribeFooter = (vars: Record<string, unknown>) => {
  const url = typeof vars.unsubscribe_url === "string" ? vars.unsubscribe_url : `${BRAND.siteUrl}/dashboard?tab=account`;
  return `
    ${emailDivider()}
    <p style="margin:0;font-size:12px;line-height:18px;color:${BRAND.muted};">
      You're getting this because you opted in to SkinLabs updates.
      <a href="${escapeHtml(url)}" style="color:${BRAND.muted};text-decoration:underline;">Unsubscribe</a>
    </p>`;
};

registerTemplate({
  id: "trial_activation_nudge",
  category: "MARKETING",
  internalName: "Trial day 2: get set up",
  transactional: false,
  requiredVars: ["trial_ends_at", "unsubscribe_url"],
  subject: (vars) => `Two minutes to get more out of ${planOf(vars)}`,
  preheader: (vars) => `Your trial runs until ${dateOf(vars.trial_ends_at)}. Here's where to start.`,
  render: (vars) => {
    const plan = escapeHtml(planOf(vars));
    return `
    ${emailHeading("Make the most of your trial")}
    ${emailParagraph(`You're two days into ${plan}, free until ${escapeHtml(dateOf(vars.trial_ends_at))}. Members who get the most from it usually do one of these in the first week:`)}
    ${emailParagraph(
      `• <strong>Save your routine</strong> so your daily check-ins and Skin Weather tips fit what you actually use.<br/>` +
      `• <strong>Save a few briefings</strong> worth coming back to.<br/>` +
      `• <strong>Re-run your SKYNN AI analysis</strong> when your skin changes.`
    )}
    ${emailButton("Open my dashboard", `${BRAND.siteUrl}/dashboard`)}
    ${unsubscribeFooter(vars)}
  `;
  },
});

registerTemplate({
  id: "trial_week_left",
  category: "TRIAL",
  internalName: "Trial: one week left",
  transactional: true,
  requiredVars: ["trial_ends_at"],
  subject: (vars) => `One week left of your ${planOf(vars)} trial`,
  preheader: (vars) => `Your trial ends on ${dateOf(vars.trial_ends_at)}.`,
  render: (vars) => {
    const plan = escapeHtml(planOf(vars));
    const date = escapeHtml(dateOf(vars.trial_ends_at));
    if (cardOnFile(vars)) {
      return `
    ${emailHeading("One week left")}
    ${emailParagraph(`Your ${plan} trial ends on ${date}. Auto-renew is on, so your membership simply continues and your first charge is on ${date}.`)}
    ${emailButton("Manage billing", BILLING_URL)}
    ${emailParagraph(`Changed your mind? Cancel in Billing before ${date} and you won't pay anything.`)}
  `;
    }
    return `
    ${emailHeading("One week left")}
    ${emailParagraph(`Your ${plan} trial ends on ${date}. If it's been useful, you can keep it now: add a card or PayPal and nothing is charged before ${date}. Cancel any time in Billing.`)}
    ${emailButton("Keep my membership", KEEP_URL)}
    ${emailParagraph(
      noCardOnFile(vars)
        ? `If you'd rather not, do nothing. Your account moves back to Glow Explorer (free) on ${date} and you won't be charged.`
        : `If you'd rather not, your account moves back to Glow Explorer (free) on ${date}.`
    )}
  `;
  },
});

registerTemplate({
  id: "trial_precharge_reminder",
  category: "TRIAL",
  internalName: "Trial: first charge in 3 days (card on file)",
  transactional: true,
  requiredVars: ["trial_ends_at", "amount_zar"],
  subject: (vars) => `Your first ${planOf(vars)} charge is on ${dateOf(vars.trial_ends_at)}`,
  preheader: (vars) => `${zar(vars.amount_zar) ?? "Your membership"} on ${dateOf(vars.trial_ends_at)}. Cancel any time before then.`,
  render: (vars) => {
    const plan = escapeHtml(planOf(vars));
    const date = escapeHtml(dateOf(vars.trial_ends_at));
    const amount = zar(vars.amount_zar);
    const paypalUsd = String(vars.currency ?? "").toUpperCase() === "USD" && Number(vars.amount_charged) > 0
      ? `US$${Number(vars.amount_charged).toFixed(2)} via PayPal`
      : null;
    const rows: Array<[string, string]> = [["First charge", date]];
    if (amount) rows.push(["Amount", paypalUsd ? `${amount} (charged as ${paypalUsd})` : amount]);
    rows.push(["Plan", planOf(vars)]);
    return `
    ${emailHeading("Your trial ends in 3 days")}
    ${emailParagraph(`Auto-renew is on for ${plan}. Here's exactly what happens next:`)}
    ${emailKeyValueTable(rows)}
    ${emailButton("Manage billing", BILLING_URL)}
    ${emailParagraph(`Don't want to continue? Cancel in Billing before ${date} and you won't be charged.`)}
  `;
  },
});

registerTemplate({
  id: "trial_last_chance",
  category: "TRIAL",
  internalName: "Trial: 3 days left (no card)",
  transactional: true,
  requiredVars: ["trial_ends_at"],
  subject: (vars) => `3 days left of your ${planOf(vars)} trial`,
  preheader: (vars) => `Your trial ends on ${dateOf(vars.trial_ends_at)}.`,
  render: (vars) => {
    const plan = escapeHtml(planOf(vars));
    const date = escapeHtml(dateOf(vars.trial_ends_at));
    return `
    ${emailHeading("3 days left")}
    ${emailParagraph(`Your ${plan} trial ends on ${date}. To keep it, set up your membership now. Nothing is charged before ${date}, and you can cancel any time in Billing.`)}
    ${emailButton("Keep my membership", KEEP_URL)}
    ${emailParagraph(`If you do nothing, your account moves back to Glow Explorer (free) on ${date}. You won't be charged, and your skin profile stays in your account.`)}
  `;
  },
});

registerTemplate({
  id: "trial_winback",
  category: "MARKETING",
  internalName: "Trial ended + 5 days: win-back (once)",
  transactional: false,
  requiredVars: ["unsubscribe_url"],
  subject: () => "Your skin profile's still here",
  preheader: (vars) => `Pick ${planOf(vars)} back up whenever you like.`,
  render: (vars) => {
    const plan = escapeHtml(planOf(vars));
    return `
    ${emailHeading("Your skin profile's still here")}
    ${emailParagraph(`Your ${plan} trial ended a few days ago. Your SKYNN AI results, routine and saved items are all still in your account.`)}
    ${emailParagraph(`If you'd like ${plan} back, it takes a minute. Cancel any time in Billing.`)}
    ${emailButton(`Keep ${plan}`, KEEP_URL)}
    ${emailParagraph(`Or get one more deep dive with a single Analysis Pass. <a href="${BILLING_URL}" style="color:${BRAND.text};">See Analysis Passes</a>.`)}
    ${unsubscribeFooter(vars)}
  `;
  },
});
