import { registerTemplate } from "./registry.ts";
import { BRAND, escapeHtml } from "../layout.ts";
import { emailHeading, emailParagraph, emailButton, emailNotice, emailKeyValueTable } from "../components.ts";

const PLAN_LABELS: Record<string, string> = {
  free: "Glow Explorer",
  glow_lite: "Glow Lite",
  insider: "Glow Insider",
  vip: "Glow VIP",
  active: "Glow Insider",
  premium: "Glow Insider",
};

function planLabel(plan: unknown): string {
  return PLAN_LABELS[String(plan ?? "").toLowerCase()] ?? String(plan ?? "your plan");
}

function formatDate(value: unknown): string {
  if (!value) return "soon";
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  // SAST, not the edge runtime's UTC: a trial ending at 00:00 SAST on 1 Nov is
  // 22:00 UTC on 31 Oct, and members should read the date the site shows them.
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Johannesburg" });
}

// Trial emails carry `plan` (the trial_plan) and `has_payment_method` (a live
// auto-renew subscription exists). Charge reassurances ("no surprise charges",
// "you won't be charged", "no charge was made") only appear when
// has_payment_method is explicitly false — a card-backed trialist WILL be
// charged when the trial ends, and an unknown state says nothing either way.
// Jobs queued before `plan` existed were Insider-only, hence that default.
function trialPlanLabel(vars: Record<string, unknown>): string {
  return vars.plan ? planLabel(vars.plan) : "Glow Insider";
}

function noCardOnFile(vars: Record<string, unknown>): boolean {
  return vars.has_payment_method === false || vars.has_payment_method === "false";
}

function cardOnFile(vars: Record<string, unknown>): boolean {
  return vars.has_payment_method === true || vars.has_payment_method === "true";
}

// What each trial unlocks, from LADDER_CAPABILITIES in src/lib/entitlements.ts.
function trialPerks(plan: unknown): string {
  const key = String(plan ?? "insider").toLowerCase();
  if (key === "glow_lite") {
    return "unlimited Shelf Showdown comparisons, full Spotlight brand profiles and the practitioner directory";
  }
  return "weekly live AI skin analysis, the full podcast library, full-body reviews, and the Active Ingredient Conflict Matcher";
}

registerTemplate({
  id: "trial_started",
  category: "TRIAL",
  internalName: "Membership trial started",
  transactional: true,
  requiredVars: ["trial_ends_at"],
  subject: (vars) => `Your ${trialPlanLabel(vars)} trial has started`,
  preheader: (vars) => `Free until ${formatDate(vars.trial_ends_at)} — enjoy full ${trialPlanLabel(vars)} access.`,
  render: (vars) => {
    const label = escapeHtml(trialPlanLabel(vars));
    const closing = noCardOnFile(vars)
      ? emailParagraph(`We'll email you before your trial ends — no surprise charges.`)
      : cardOnFile(vars)
        ? emailParagraph(
            `Auto-renew is on: your ${label} membership continues when the trial ends, and your first charge is on ` +
            `${escapeHtml(formatDate(vars.trial_ends_at))}. Cancel any time in Billing before then.`
          )
        : emailParagraph(`We'll email you before your trial ends. You can review your billing any time from your dashboard.`);
    return `
    ${emailHeading(`Your ${label} trial has started`)}
    ${emailParagraph(`You now have full ${label} access — ${escapeHtml(trialPerks(vars.plan))}.`)}
    ${emailKeyValueTable([["Free until", formatDate(vars.trial_ends_at)]])}
    ${emailButton(`Explore ${label}`, `${BRAND.siteUrl}/dashboard`)}
    ${closing}
  `;
  },
});

registerTemplate({
  id: "trial_expiring",
  category: "TRIAL",
  internalName: "Membership trial ending soon",
  transactional: true,
  requiredVars: ["trial_ends_at"],
  subject: (vars) => `Your ${trialPlanLabel(vars)} trial ends tomorrow`,
  preheader: (vars) => `Your trial ends ${formatDate(vars.trial_ends_at)}.`,
  render: (vars) => {
    const label = escapeHtml(trialPlanLabel(vars));
    const date = escapeHtml(formatDate(vars.trial_ends_at));
    if (cardOnFile(vars)) {
      return `
    ${emailHeading("Your trial ends tomorrow")}
    ${emailParagraph(`Your ${label} trial ends on ${date}. Auto-renew is on, so your membership continues and your first charge is on ${date}.`)}
    ${emailButton("Manage billing", `${BRAND.siteUrl}/dashboard?tab=billing`)}
    ${emailParagraph(`Don't want to continue? Cancel in Billing before ${date} and you'll move back to Glow Explorer (free).`)}
  `;
    }
    return `
    ${emailHeading("Your trial ends tomorrow")}
    ${emailParagraph(`Your ${label} trial ends on ${date}. Keep your access by upgrading before then.`)}
    ${emailButton(`Keep ${label}`, `${BRAND.siteUrl}/pricing`)}
    ${emailParagraph(
      noCardOnFile(vars)
        ? `If you do nothing, your account simply returns to Glow Explorer (free) — you won't be charged.`
        : `If you don't upgrade, your account returns to Glow Explorer (free). You can check your billing any time from your dashboard.`
    )}
  `;
  },
});

registerTemplate({
  id: "trial_ended",
  category: "TRIAL",
  internalName: "Membership trial ended",
  transactional: true,
  requiredVars: [],
  subject: (vars) => `Your ${trialPlanLabel(vars)} trial has ended`,
  preheader: () => "Your account is now on Glow Explorer (free).",
  render: (vars) => {
    const label = escapeHtml(trialPlanLabel(vars));
    return `
    ${emailHeading("Your trial has ended")}
    ${emailParagraph(
      `Your ${label} trial has ended and your account is back on Glow Explorer (free)` +
      (noCardOnFile(vars) ? ` — no charge was made.` : `.`)
    )}
    ${emailButton(`Upgrade to ${label}`, `${BRAND.siteUrl}/pricing`)}
  `;
  },
});

registerTemplate({
  id: "membership_activated",
  category: "MEMBERSHIP",
  internalName: "Membership activated",
  transactional: true,
  requiredVars: ["plan"],
  subject: (vars) => `Welcome to ${planLabel(vars.plan)}`,
  preheader: (vars) => `Your ${planLabel(vars.plan)} membership is now active.`,
  render: (vars) => `
    ${emailHeading(`Welcome to ${planLabel(vars.plan)}`)}
    ${emailParagraph(
      vars.converted_from_trial
        ? `Your trial has converted to a full ${escapeHtml(planLabel(vars.plan))} membership. Thank you for staying with SkinLabs®.`
        : `Your ${escapeHtml(planLabel(vars.plan))} membership is now active.`
    )}
    ${emailButton("Go to your dashboard", `${BRAND.siteUrl}/dashboard`)}
  `,
});

registerTemplate({
  id: "membership_upgraded",
  category: "MEMBERSHIP",
  internalName: "Membership upgraded",
  transactional: true,
  requiredVars: ["to_plan"],
  subject: (vars) => `You're now on ${planLabel(vars.to_plan)}`,
  preheader: (vars) => `Upgraded from ${planLabel(vars.from_plan)} to ${planLabel(vars.to_plan)}.`,
  render: (vars) => `
    ${emailHeading(`You're now on ${planLabel(vars.to_plan)}`)}
    ${emailParagraph(`Your membership was upgraded from ${escapeHtml(planLabel(vars.from_plan))} to ${escapeHtml(planLabel(vars.to_plan))}.`)}
    ${emailButton("See what's new", `${BRAND.siteUrl}/dashboard`)}
  `,
});

// Wired from cancel_subscription() (supabase/migrations/
// 20260919100000_marketing_consent_and_cancellation.sql) — that RPC moves a
// member back to Glow Explorer immediately, no grace period, so this copy
// must never imply continued access through a billing period that doesn't
// exist in this app's cancellation model.
registerTemplate({
  id: "membership_cancelled",
  category: "MEMBERSHIP",
  internalName: "Membership cancelled",
  transactional: true,
  requiredVars: ["plan"],
  subject: () => "Your SkinLabs® membership has been cancelled",
  preheader: () => "Confirming your cancellation — you're back on Glow Explorer (free), effective immediately.",
  render: (vars) => `
    ${emailHeading("Membership cancelled")}
    ${emailParagraph(`Your ${escapeHtml(planLabel(vars.plan))} membership has been cancelled and your account has moved back to Glow Explorer (free), effective immediately. No further charges will be made.`)}
    ${emailNotice(`Changed your mind? You can resubscribe any time from your dashboard.`, "info")}
    ${emailButton("Manage membership", `${BRAND.siteUrl}/dashboard?tab=billing`)}
  `,
});
