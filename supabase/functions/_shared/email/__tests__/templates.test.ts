import { describe, expect, test } from "bun:test";
import { getTemplate, allTemplates, missingRequiredVars } from "../templates/index.ts";
import { renderEmailLayout } from "../layout.ts";

describe("email template registry", () => {
  test("registers every template referenced by the SQL trigger layer", () => {
    const expectedIds = [
      "auth_welcome", "auth_email_verified", "auth_password_changed", "auth_email_changed",
      "account_deactivated", "account_reactivated", "account_deleted",
      "trial_started", "trial_expiring", "trial_ended",
      "membership_activated", "membership_upgraded", "membership_cancelled",
      "payment_succeeded", "payment_failed",
      "analysis_completed", "analysis_failed",
      "form_confirmation_contact", "admin_form_notification_contact",
      "form_confirmation_partner", "admin_form_notification_partner",
      "form_confirmation_spotlight_brand", "admin_form_notification_spotlight_brand",
      "form_confirmation_custom_formula", "admin_form_notification_custom_formula",
      "form_confirmation_business", "admin_form_notification_business",
      "form_confirmation_feature_waitlist",
      "form_confirmation_openhaus_waitlist", "admin_form_notification_openhaus_waitlist",
      "form_confirmation_newsletter", "admin_form_notification_newsletter",
      "admin_notify_me_request",
      "admin_payment_needs_review", "admin_delivery_failed",
    ];
    for (const id of expectedIds) {
      expect(getTemplate(id), `missing template: ${id}`).toBeDefined();
    }
    expect(allTemplates().length).toBeGreaterThanOrEqual(expectedIds.length);
  });

  test("every template, once wrapped in the shared layout, includes the brand signature block", () => {
    for (const def of allTemplates()) {
      const vars: Record<string, unknown> = {};
      for (const key of def.requiredVars) vars[key] = "test-value";
      const html = renderEmailLayout({ preheader: def.preheader(vars), bodyHtml: def.render(vars) });
      expect(html).toContain("support@skinlabs.co.za");
      expect(html).toContain("skinlabs.co.za");
    }
  });

  test("every template's subject() and preheader() return non-empty strings", () => {
    for (const def of allTemplates()) {
      const vars: Record<string, unknown> = {};
      for (const key of def.requiredVars) vars[key] = "test-value";
      expect(def.subject(vars).length).toBeGreaterThan(0);
      expect(def.preheader(vars).length).toBeGreaterThan(0);
    }
  });

  test("missingRequiredVars flags an absent required var", () => {
    const def = getTemplate("payment_succeeded")!;
    expect(missingRequiredVars(def, {})).toEqual(expect.arrayContaining(["amount_zar", "reference"]));
    expect(missingRequiredVars(def, { amount_zar: 25, reference: "ref_123" })).toEqual([]);
  });

  test("payment_succeeded branches copy by purchase_type without throwing", () => {
    const def = getTemplate("payment_succeeded")!;
    const receipt = def.render({ amount_zar: 59, reference: "ref_1", purchase_type: "credit_pack", description: "3 Analysis Passes" });
    expect(receipt).toContain("Analysis Pass");
    const membership = def.render({ amount_zar: 299, reference: "ref_2", purchase_type: "plan", description: "insider membership (monthly)" });
    expect(membership).toContain("Payment received");
  });

  test("membership_activated never mentions 'trial' for a glow_lite plan", () => {
    const def = getTemplate("membership_activated")!;
    const html = def.render({ plan: "glow_lite" });
    expect(html.toLowerCase()).not.toContain("trial");
    expect(html).toContain("Glow Lite");
  });

  test("trial_expiring copy references the trial ending, not a paid membership", () => {
    const def = getTemplate("trial_expiring")!;
    const html = def.render({ trial_ends_at: "2026-10-01T00:00:00Z" });
    expect(html.toLowerCase()).toContain("trial");
  });
});
