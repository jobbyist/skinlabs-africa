import { describe, expect, test } from "bun:test";
import { getTemplate, allTemplates, missingRequiredVars } from "../templates/index.ts";
import { renderEmailLayout } from "../layout.ts";
import { emailButton } from "../components.ts";

describe("email template registry", () => {
  test("registers every template referenced by the SQL trigger layer", () => {
    const expectedIds = [
      "auth_welcome", "auth_email_verified", "auth_password_changed", "auth_email_changed",
      "account_deactivated", "account_reactivated", "account_deleted",
      "trial_started", "trial_expiring", "trial_ended",
      "membership_activated", "membership_upgraded", "membership_cancelled",
      "payment_succeeded", "payment_failed",
      "analysis_completed", "analysis_failed",
      "advanced_report_ready", "advanced_report_not_released", "admin_skynn_review_needed",
      "advanced_intake_received", "admin_skynn_intake_failed", "admin_skynn_intake_withdrawn",
      "form_confirmation_contact", "admin_form_notification_contact",
      "form_confirmation_partner", "admin_form_notification_partner",
      "form_confirmation_spotlight_brand", "admin_form_notification_spotlight_brand",
      "form_confirmation_custom_formula", "admin_form_notification_custom_formula",
      "form_confirmation_business", "admin_form_notification_business",
      "form_confirmation_feature_waitlist",
      "form_confirmation_openhaus_waitlist", "admin_form_notification_openhaus_waitlist",
      "form_confirmation_newsletter", "admin_form_notification_newsletter",
      "admin_notify_me_request", "admin_consult_survey_response", "admin_feedback_survey_response",
      "admin_payment_needs_review", "admin_delivery_failed",
      "newsletter_weekly_digest", "newsletter_digest_confirm",
      "trial_activation_nudge", "trial_week_left", "trial_precharge_reminder", "trial_last_chance", "trial_winback",
      "daily_briefing_digest", "weekly_top_brands", "weekly_analysis_reminder",
      "welcome_series_1", "welcome_series_2", "welcome_series_3", "welcome_series_4",
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
      expect(html).toContain("instagram.com/skinlabsza");
      expect(html).toContain("tiktok.com/@skinlabsza");
    }
  });

  test("every recipient-facing email carries an unsubscribe link; staff notifications don't", () => {
    for (const def of allTemplates()) {
      const vars: Record<string, unknown> = {};
      for (const key of def.requiredVars) vars[key] = "test-value";
      const body = def.render(vars);
      const withUrl = renderEmailLayout({ preheader: "p", bodyHtml: body, unsubscribeUrl: "https://example.test/unsub?token=abc" });
      expect(withUrl).toContain("https://example.test/unsub?token=abc");
      expect(withUrl).toContain("Unsubscribe");
      // No token known (e.g. a form confirmation to a non-member): falls back to an unsubscribe-by-email link.
      const fallback = renderEmailLayout({ preheader: "p", bodyHtml: body });
      expect(fallback).toContain("mailto:support@skinlabs.co.za?subject=Unsubscribe");
      const internal = renderEmailLayout({ preheader: "p", bodyHtml: body, internal: true });
      expect(internal).not.toContain("Don't want marketing emails?");
    }
  });

  test("buttons use the brand gradient over a monochrome fallback — never a flat green", () => {
    for (const def of allTemplates()) {
      const vars: Record<string, unknown> = {};
      for (const key of def.requiredVars) vars[key] = "test-value";
      const html = renderEmailLayout({ preheader: "p", bodyHtml: def.render(vars) });
      expect(html).not.toContain("#16a34a");
      expect(html).not.toContain("#15803d");
    }
    const button = emailButton("Go", "https://skinlabs.co.za");
    expect(button).toContain("linear-gradient(135deg,#22c55e,#3b82f6,#a855f7,#ec4899)");
    expect(button).toContain("background-color:#18181b");
    expect(emailButton("Go", "https://skinlabs.co.za", "mono")).not.toContain("linear-gradient");
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

  describe("trial emails (plan-aware, card-aware)", () => {
    const TRIAL_IDS = ["trial_started", "trial_expiring", "trial_ended"] as const;
    const NO_CHARGE_PHRASES = ["no surprise charges", "you won't be charged", "no charge was made"];
    const ends = "2026-11-01T00:00:00+02:00";
    const renderAll = (id: string, vars: Record<string, unknown>) => {
      const def = getTemplate(id)!;
      return `${def.subject(vars)}\n${def.preheader(vars)}\n${def.render(vars)}`;
    };

    test("a Glow Lite trialist reads 'Glow Lite' in subject and body, never 'Glow Insider'", () => {
      for (const id of TRIAL_IDS) {
        for (const has_payment_method of [true, false]) {
          const def = getTemplate(id)!;
          const vars = { plan: "glow_lite", trial_ends_at: ends, has_payment_method };
          expect(def.subject(vars), id).toContain("Glow Lite");
          expect(def.render(vars), id).toContain("Glow Lite");
          expect(renderAll(id, vars), id).not.toContain("Glow Insider");
        }
      }
    });

    test("a card-backed trialist never reads a no-charge reassurance", () => {
      for (const id of TRIAL_IDS) {
        for (const plan of ["glow_lite", "insider"]) {
          for (const has_payment_method of [true, "true"]) {
            const text = renderAll(id, { plan, trial_ends_at: ends, has_payment_method }).toLowerCase();
            for (const phrase of NO_CHARGE_PHRASES) expect(text, `${id}/${plan}`).not.toContain(phrase);
          }
        }
      }
    });

    test("an unknown payment state makes no charge promise either way", () => {
      for (const id of TRIAL_IDS) {
        const text = renderAll(id, { plan: "insider", trial_ends_at: ends }).toLowerCase();
        for (const phrase of NO_CHARGE_PHRASES) expect(text, id).not.toContain(phrase);
      }
    });

    test("a no-card trialist keeps the reassurance", () => {
      expect(renderAll("trial_started", { plan: "insider", trial_ends_at: ends, has_payment_method: false })).toContain("no surprise charges");
      expect(renderAll("trial_expiring", { plan: "insider", trial_ends_at: ends, has_payment_method: false })).toContain("you won't be charged");
      expect(renderAll("trial_ended", { plan: "insider", has_payment_method: false })).toContain("no charge was made");
    });

    test("a card-backed trialist is told auto-renew is on and when the first charge lands", () => {
      const started = renderAll("trial_started", { plan: "glow_lite", trial_ends_at: ends, has_payment_method: true });
      expect(started).toContain("Auto-renew is on");
      expect(started).toContain("1 November 2026");
      expect(renderAll("trial_expiring", { plan: "insider", trial_ends_at: ends, has_payment_method: true })).toContain("Auto-renew is on");
    });

    test("jobs queued before `plan` existed still render as Glow Insider", () => {
      expect(getTemplate("trial_started")!.subject({ trial_ends_at: ends })).toBe("Your Glow Insider trial has started");
    });
  });

  describe("trial lifecycle emails (onboarding overhaul 09)", () => {
    const ends = "2026-10-31T22:00:00Z"; // 1 November 2026 SAST
    const text = (id: string, vars: Record<string, unknown>) => {
      const def = getTemplate(id)!;
      return `${def.subject(vars)}\n${def.preheader(vars)}\n${def.render(vars)}`;
    };
    const LIFECYCLE = ["trial_activation_nudge", "trial_week_left", "trial_precharge_reminder", "trial_last_chance", "trial_winback"];

    test("marketing vs transactional categories", () => {
      for (const id of ["trial_activation_nudge", "trial_winback"]) {
        expect(getTemplate(id)!.category).toBe("MARKETING");
        expect(getTemplate(id)!.transactional).toBe(false);
        expect(getTemplate(id)!.requiredVars).toContain("unsubscribe_url");
      }
      for (const id of ["trial_week_left", "trial_precharge_reminder", "trial_last_chance"]) {
        expect(getTemplate(id)!.category).toBe("TRIAL");
        expect(getTemplate(id)!.transactional).toBe(true);
      }
    });

    test("the 1 November end date is stated plainly, and nothing shouts", () => {
      for (const id of LIFECYCLE.filter((i) => i !== "trial_winback")) {
        const t = text(id, { plan: "insider", trial_ends_at: ends, has_payment_method: id === "trial_precharge_reminder", amount_zar: 79, unsubscribe_url: "https://x/u" });
        expect(t, id).toContain("1 November 2026");
      }
      for (const id of LIFECYCLE) {
        const t = text(id, { plan: "insider", trial_ends_at: ends, amount_zar: 79, unsubscribe_url: "https://x/u" });
        expect(t, id).not.toMatch(/act now|hurry|last chance!|don't miss out/i);
      }
    });

    test("plan-aware: a Glow Lite trialist never reads Glow Insider", () => {
      for (const id of LIFECYCLE) {
        const t = text(id, { plan: "glow_lite", trial_ends_at: ends, has_payment_method: false, amount_zar: 39, unsubscribe_url: "https://x/u" });
        expect(t, id).toContain("Glow Lite");
        expect(t, id).not.toContain("Glow Insider");
      }
    });

    test("precharge reminder: exact date and rand amount, PayPal shows the USD charge", () => {
      const pf = text("trial_precharge_reminder", { plan: "insider", trial_ends_at: ends, amount_zar: 79, currency: "ZAR", has_payment_method: true });
      expect(pf).toContain("R79.00");
      expect(pf).toContain("1 November 2026");
      const pp = text("trial_precharge_reminder", { plan: "insider", trial_ends_at: ends, amount_zar: 79, amount_charged: 4.32, currency: "USD", has_payment_method: true });
      expect(pp).toContain("US$4.32 via PayPal");
    });

    test("week-left and last-chance link to ?keep=1; a card-backed week-left never promises no charge", () => {
      expect(text("trial_week_left", { plan: "insider", trial_ends_at: ends, has_payment_method: false })).toContain("keep=1");
      expect(text("trial_last_chance", { plan: "insider", trial_ends_at: ends, has_payment_method: false })).toContain("keep=1");
      const card = text("trial_week_left", { plan: "insider", trial_ends_at: ends, has_payment_method: true }).toLowerCase();
      expect(card).toContain("auto-renew is on");
      expect(card).not.toContain("won't be charged");
    });

    test("trial_ended offers Keep membership and an Analysis Pass", () => {
      const t = text("trial_ended", { plan: "insider", has_payment_method: false });
      expect(t).toContain("keep=1");
      expect(t).toContain("Analysis Pass");
    });

    test("marketing emails carry the unsubscribe link", () => {
      for (const id of ["trial_activation_nudge", "trial_winback"]) {
        expect(text(id, { plan: "insider", trial_ends_at: ends, unsubscribe_url: "https://example.test/unsub?token=abc" }), id).toContain("https://example.test/unsub?token=abc");
      }
    });
  });
});
