import { describe, expect, test } from "bun:test";

// Another suite (src/lib/formulator/__tests__/handoff.test.ts) leaves a
// minimal `window` stub on globalThis; jsPDF's node build reads atob/btoa
// off `window` when one exists, so give any stub the real ones before a
// dynamic import (static imports would be hoisted above this).
const stubWindow = (globalThis as { window?: Record<string, unknown> }).window;
if (stubWindow && typeof stubWindow.atob !== "function") {
  stubWindow.atob = globalThis.atob.bind(globalThis);
  stubWindow.btoa = globalThis.btoa.bind(globalThis);
}
const { jsPDF } = await import("jspdf");

import { computeDeterministicScores } from "../scoring/index.ts";
import { computeDeterministicTriage } from "../safety.ts";
import {
  cleanText, formatAnswer, formatResponses, formatSast, summariseScores, summariseTriage, REFERENCE_PATTERN,
  type IntakeSection,
} from "../intake/format.ts";
import { buildIntakePdf, pdfSafe, INTAKE_DISCLAIMER } from "../intake/intakePdf.ts";
import { buildInternalIntakeEmail } from "../intake/internalEmail.ts";

const sections: IntakeSection[] = [
  {
    id: "basics",
    title: "Skin basics",
    questions: [
      { id: "skin_type", type: "single_select", prompt: "How would you describe your skin type?", options: [{ value: "oily", label: "Oily" }, { value: "dry", label: "Dry" }] },
      { id: "concerns", type: "multi_select", prompt: "Main concerns?", options: [{ value: "acne", label: "Breakouts" }, { value: "pih", label: "Dark marks" }] },
      { id: "sens", type: "scale", prompt: "How reactive?", min: 1, max: 5, minLabel: "Rarely", maxLabel: "Often" },
      { id: "acne_present", type: "single_select", prompt: "Breakouts?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
      { id: "acne_forehead", type: "single_select", prompt: "Forehead?", showIf: { questionId: "acne_present", oneOf: ["yes"] }, options: [{ value: "none", label: "None" }] },
      { id: "notes", type: "text", prompt: "Anything else?" },
      { id: "products", type: "product_list", prompt: "Products you use" },
    ],
  },
];

describe("intake formatting", () => {
  test("labels come from the definition; hidden questions are skipped", () => {
    const out = formatResponses(sections, {
      skin_type: "oily", concerns: ["acne", "pih"], sens: 4, acne_present: "no",
      notes: "  Line one\n\nline two  ", products: [{ productName: "Gel cleanser", frequency: "daily" }],
    });
    const answers = Object.fromEntries(out[0].answers.map((a) => [a.questionId, a.answer]));
    expect(answers.skin_type).toBe("Oily");
    expect(answers.concerns).toBe("Breakouts; Dark marks");
    expect(answers.sens).toBe("4 (scale 1–5: Rarely → Often)");
    expect(answers.acne_forehead).toBeUndefined();
    expect(answers.notes).toBe("Line one line two");
    expect(answers.products).toBe("Gel cleanser · daily");
  });

  test("unanswered and control characters", () => {
    expect(formatAnswer(sections[0].questions[0], undefined)).toBe("Not answered");
    expect(cleanText("a\u0000b\u0007c")).toBe("abc");
    expect(cleanText("x".repeat(3000)).length).toBe(2001);
  });

  test("score and triage summaries keep the non-clinical labels", () => {
    const responses = { mst_tone: "8", pregnancy_status: "pregnant", acne_present: "no", pigment_patches_present: "no" };
    const scores = computeDeterministicScores(responses);
    const rows = summariseScores(scores);
    expect(rows.some(([k]) => k.includes("not the BSTI"))).toBe(true);
    expect(rows.some(([k]) => k.includes("not the DLQI"))).toBe(true);
    expect(rows.find(([k]) => k.startsWith("Monk"))?.[1]).toContain("MST 8 (group 7-10)");
    const triage = computeDeterministicTriage(responses);
    expect(summariseTriage(triage)).toContain("ESCALATE");
  });

  test("SAST formatting and reference pattern", () => {
    expect(formatSast("2026-09-27T10:00:00Z")).toContain("12:00");
    expect(formatSast(null)).toBe("—");
    expect(REFERENCE_PATTERN.test("SKYNN-ADV-20260927-XHZ2EK")).toBe(true);
    expect(REFERENCE_PATTERN.test("SKYNN-ADV-20260927-XHZ2E0")).toBe(false);
    expect(REFERENCE_PATTERN.test("SKYNN-ADV-20260927-XHZ2EK\r\nBcc: x@y.z")).toBe(false);
  });
});

describe("intake PDF", () => {
  test("renders a valid PDF with the pending status and disclaimer, never report language", () => {
    const bytes = buildIntakePdf(jsPDF as never, {
      referenceNumber: "SKYNN-ADV-20260927-XHZ2EK",
      submittedAt: "27 Sept 2026, 12:00 SAST",
      userId: "00000000-0000-0000-0000-000000000000",
      userEmail: "member@example.com",
      processingMode: "Pre-approval intake (fallback) — no AI processing",
      status: "Pending",
      versions: [["Prompt set", "skynn-v2.0.0"], ["Questionnaire version", "2026.2"]],
      consent: [["Special personal information", "Consented"]],
      access: [["Access", "Analysis Pass"]],
      scores: [["MST", "MST 8"]],
      triage: "CLEAR",
      sections: formatResponses(sections, { skin_type: "oily", notes: "emoji 😀 and ≥ symbols" }),
      generatedAt: "27 Sept 2026, 12:01 SAST",
    });
    const head = new TextDecoder().decode(bytes.slice(0, 5));
    expect(head).toBe("%PDF-");
    expect(bytes.length).toBeGreaterThan(2000);
    const text = new TextDecoder("latin1").decode(bytes);
    expect(text).toContain("STATUS: PENDING");
    expect(text).toContain("SKYNN-ADV-20260927-XHZ2EK");
    expect(/dermatologist[- ]approved|clinically approved|diagnosis:/i.test(text)).toBe(false);
  });

  test("pdfSafe strips glyphs the standard fonts can't draw", () => {
    expect(pdfSafe("a 😀 b ≥ c → d — e")).toBe("a ?? b >= c -> d — e");
    expect(INTAKE_DISCLAIMER).toContain("not a medical diagnosis");
  });
});

describe("internal intake email", () => {
  test("subject, filename and escaping", () => {
    const e = buildInternalIntakeEmail({
      referenceNumber: "SKYNN-ADV-20260927-XHZ2EK",
      submittedAt: "27 Sept 2026, 12:00 SAST",
      userId: "u1",
      userEmail: "<script>@x.com",
      versions: [["Prompt set", "skynn-v2.0.0"]],
      access: "Analysis Pass",
    });
    expect(e.subject).toBe("SKYNN AI Advanced Report Submission — SKYNN-ADV-20260927-XHZ2EK");
    expect(e.filename).toBe("SKYNN-ADV-20260927-XHZ2EK.pdf");
    expect(e.html).not.toContain("<script>");
    expect(e.html).toContain("PDF attached");
  });

  test("refuses a reference that isn't server-shaped (no header injection)", () => {
    expect(() => buildInternalIntakeEmail({ referenceNumber: "X\r\nBcc: a@b.c", submittedAt: "", userId: "", userEmail: null, versions: [], access: "" })).toThrow();
  });
});
