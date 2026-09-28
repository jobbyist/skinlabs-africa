import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { SKYNN_EVENTS, crossedMilestone, sanitizeSkynnProps } from "@/lib/skynn/analytics";

describe("SKYNN AI analytics payload whitelist", () => {
  test("keeps only whitelisted, non-sensitive keys", () => {
    const out = sanitizeSkynnProps({
      mode: "basic",
      step: "photo",
      progress_pct: 50.4,
      has_photo: true,
      mst_selected: false,
      // Everything below must be dropped.
      mst_tone: 7,
      answers: { q1: 2 },
      skinImage: "data:image/png;base64,AAAA",
      email: "someone@example.com",
      reference_number: "SKYNN-ADV-20260928-ABC123",
      free_text: "my skin burns",
    });
    expect(out).toEqual({ mode: "basic", step: "photo", progress_pct: 50, has_photo: true, mst_selected: false });
  });

  test("drops free text smuggled into a whitelisted key", () => {
    expect(sanitizeSkynnProps({ step: "I have a rash on my face since June" })).toEqual({});
    expect(sanitizeSkynnProps({ source: "someone@example.com " })).toEqual({});
    expect(sanitizeSkynnProps({ progress_pct: Number.NaN })).toEqual({});
  });

  test("Basic and Advanced events stay distinguishable by mode", () => {
    expect(sanitizeSkynnProps({ mode: "advanced" })).toEqual({ mode: "advanced" });
    expect(SKYNN_EVENTS.filter((e) => e.startsWith("skynn_basic_")).length).toBeGreaterThanOrEqual(4);
    expect(SKYNN_EVENTS.filter((e) => e.startsWith("skynn_advanced_")).length).toBeGreaterThanOrEqual(6);
  });

  test("questionnaire progress fires at 25/50/75 only", () => {
    expect(crossedMilestone(0, 20)).toBeNull();
    expect(crossedMilestone(20, 25)).toBe(25);
    expect(crossedMilestone(45, 55)).toBe(50);
    expect(crossedMilestone(80, 100)).toBeNull();
  });

  test("the funnel events the brief requires all exist", () => {
    for (const e of [
      "skynn_viewed", "skynn_started", "skynn_mode_selected",
      "skynn_consent_viewed", "skynn_consent_accepted", "skynn_consent_declined",
      "skynn_profile_started", "skynn_profile_completed",
      "skynn_photo_step_viewed", "skynn_photo_uploaded", "skynn_photo_skipped", "skynn_photo_failed",
      "skynn_mst_viewed", "skynn_mst_selected", "skynn_mst_skipped",
      "skynn_assessment_started", "skynn_questionnaire_progress", "skynn_questionnaire_completed",
      "skynn_basic_submission_started", "skynn_basic_submission_succeeded", "skynn_basic_submission_failed", "skynn_basic_limit_reached",
      "skynn_advanced_entitlement_checked", "skynn_analysis_pass_required", "skynn_analysis_pass_confirmed",
      "skynn_advanced_submission_started", "skynn_advanced_submission_succeeded", "skynn_advanced_submission_failed",
      "skynn_results_viewed", "skynn_results_pdf_generated", "skynn_results_pdf_downloaded", "skynn_results_completed",
      "skynn_advanced_pending", "skynn_advanced_reference_created", "skynn_error",
    ]) {
      expect(SKYNN_EVENTS as readonly string[]).toContain(e);
    }
  });

  test("SKYNN UI code never sends events through trackConversionEvent with raw answers or MST values", () => {
    const ui = readFileSync(resolve(import.meta.dir, "../../components/AIFormulator.tsx"), "utf8");
    // Passing the value itself as a property (e.g. `{ mstTone }` or `mst: mstTone,`) is what's banned;
    // `mst_selected: mstTone !== null` (a boolean) is fine.
    expect(ui).not.toMatch(/track\w*Event\([^)]*\b(mstTone|answers|skinImage|contactEmail|changeDetail)\s*[,}]/);
    expect(ui).not.toMatch(/track\w*Event\([^)]*:\s*(mstTone|answers|skinImage|contactEmail|changeDetail)\s*[,}]/);
  });
});
