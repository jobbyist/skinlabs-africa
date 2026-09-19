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
  return d.toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" });
}

registerTemplate({
  id: "trial_started",
  category: "TRIAL",
  internalName: "Glow Insider trial started",
  transactional: true,
  requiredVars: ["trial_ends_at"],
  subject: () => "Your Glow Insider trial has started",
  preheader: (vars) => `Free until ${formatDate(vars.trial_ends_at)} — enjoy full Glow Insider access.`,
  render: (vars) => `
    ${emailHeading("Your Glow Insider trial has started")}
    ${emailParagraph(
      `You now have full Glow Insider access — weekly live AI skin analysis, the full podcast library, ` +
      `full-body reviews, and the Active Ingredient Conflict Matcher.`
    )}
    ${emailKeyValueTable([["Free until", formatDate(vars.trial_ends_at)]])}
    ${emailButton("Explore Glow Insider", `${BRAND.siteUrl}/dashboard`)}
    ${emailParagraph(`We'll email you before your trial ends — no surprise charges.`)}
  `,
});

registerTemplate({
  id: "trial_expiring",
  category: "TRIAL",
  internalName: "Glow Insider trial ending soon",
  transactional: true,
  requiredVars: ["trial_ends_at"],
  subject: () => "Your Glow Insider trial ends tomorrow",
  preheader: (vars) => `Your trial ends ${formatDate(vars.trial_ends_at)}.`,
  render: (vars) => `
    ${emailHeading("Your trial ends tomorrow")}
    ${emailParagraph(`Your Glow Insider trial ends on ${escapeHtml(formatDate(vars.trial_ends_at))}. Keep your access by upgrading before then.`)}
    ${emailButton("Keep Glow Insider", `${BRAND.siteUrl}/pricing`)}
    ${emailParagraph(`If you do nothing, your account simply returns to Glow Explorer (free) — you won't be charged.`)}
  `,
});

registerTemplate({
  id: "trial_ended",
  category: "TRIAL",
  internalName: "Glow Insider trial ended",
  transactional: true,
  requiredVars: [],
  subject: () => "Your Glow Insider trial has ended",
  preheader: () => "Your account is now on Glow Explorer (free).",
  render: () => `
    ${emailHeading("Your trial has ended")}
    ${emailParagraph(`Your Glow Insider trial has ended and your account is back on Glow Explorer (free) — no charge was made.`)}
    ${emailButton("Upgrade to Glow Insider", `${BRAND.siteUrl}/pricing`)}
  `,
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
