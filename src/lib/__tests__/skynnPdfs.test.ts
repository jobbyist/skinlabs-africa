import { describe, expect, test } from "bun:test";
import { formatResponses as formatWeb } from "@/lib/assessment/formatAnswers";
import { formatResponses as formatEdge } from "../../../supabase/functions/_shared/assessment/intake/format";
import { buildAdvancedSubmissionPdf } from "@/lib/assessment/generateAdvancedSubmissionPdf";
import { buildBasicAnalysisPdf } from "@/lib/generateSkincarePdf";
import { assembleStarterAnalysisResult } from "@/lib/starter-analysis/resultEngine";
import type { AssessmentDefinitionSummary } from "@/lib/assessment/types";

const DEFINITION: AssessmentDefinitionSummary = {
  version: "2026.2",
  title: "Advanced",
  sections: [
    {
      id: "consent",
      title: "Consent",
      questions: [
        { id: "popia_special_info_consent", type: "single_select", required: true, prompt: "Consent?", options: [{ value: "agree", label: "I agree" }, { value: "decline", label: "No" }] },
        { id: "popia_cross_border_consent", type: "single_select", required: true, prompt: "Cross-border?", options: [{ value: "agree", label: "I agree" }, { value: "decline", label: "No" }] },
      ],
    },
    {
      id: "basics",
      title: "Skin basics",
      questions: [
        { id: "skin_type", type: "single_select", required: true, prompt: "Skin type", options: [{ value: "oily", label: "Oily" }, { value: "dry", label: "Dry" }] },
        { id: "sensitivity_level", type: "scale", required: true, prompt: "Sensitivity", min: 1, max: 5, minLabel: "Low", maxLabel: "High" },
        { id: "primary_concerns", type: "multi_select", required: true, prompt: "Concerns", options: [{ value: "oiliness", label: "Oiliness" }, { value: "large_pores", label: "Large pores" }] },
        { id: "acne_present", type: "single_select", required: true, prompt: "Breakouts now?", options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }] },
        { id: "acne_zones", type: "multi_select", required: false, prompt: "Where?", showIf: { questionId: "acne_present", oneOf: ["yes"] }, options: [{ value: "chin", label: "Chin" }] },
        { id: "current_products", type: "product_list", required: false, prompt: "Products" },
        { id: "notes", type: "text", required: false, prompt: "Anything else" },
      ],
    },
  ],
};

const RESPONSES = {
  popia_special_info_consent: "agree",
  popia_cross_border_consent: "agree",
  skin_type: "oily",
  sensitivity_level: 3,
  primary_concerns: ["oiliness", "large_pores"],
  acne_present: "no",
  acne_zones: ["chin"],
  current_products: [{ productName: "Gel cleanser", category: "cleanser" }, "SPF 50"],
  notes: "  line one\n\nline\u0007 two  ",
};

const pdfText = (bytes: ArrayBuffer) => new TextDecoder("latin1").decode(new Uint8Array(bytes));

describe("Advanced answer formatting", () => {
  test("the browser copy matches the edge intake formatter exactly", () => {
    expect(formatWeb(DEFINITION.sections, RESPONSES)).toEqual(formatEdge(DEFINITION.sections as never, RESPONSES) as never);
  });

  test("hidden follow-ups are skipped and labels come from the definition", () => {
    const basics = formatWeb(DEFINITION.sections, RESPONSES)[1];
    expect(basics.answers.find((a) => a.questionId === "acne_zones")).toBeUndefined();
    expect(basics.answers.find((a) => a.questionId === "primary_concerns")?.answer).toBe("Oiliness; Large pores");
    expect(basics.answers.find((a) => a.questionId === "notes")?.answer).toBe("line one line two");
  });
});

describe("branded member PDFs", () => {
  test("Advanced submission PDF: pending record, reference, never a report", async () => {
    const doc = await buildAdvancedSubmissionPdf({
      memberName: "Test Member",
      email: "member@example.invalid",
      submission: {
        reference_number: "SKYNN-ADV-20260928-ABCDEF",
        submitted_at: "2026-09-28T10:00:00Z",
        created_at: "2026-09-28T10:00:00Z",
        generation_status: "pending",
        review_status: null,
        processing_mode: "fallback",
        intake_status: "pending",
      },
      responses: RESPONSES,
      definition: DEFINITION,
      basicAnalysisDate: "2026-09-20T08:00:00Z",
      prefilledCount: 4,
    });
    const text = pdfText(doc.output("arraybuffer"));
    expect(doc.getNumberOfPages()).toBeGreaterThanOrEqual(1);
    expect(text).toContain("SKYNN-ADV-20260928-ABCDEF");
    expect(text).toContain("Pending");
    expect(text).toContain("It is not a report");
    expect(text).not.toMatch(/report is ready|reviewed by a dermatologist|dermatologist[- ]approved/i);
  });

  test("Basic PDF from a full saved result lists the member's answers and the honest disclaimer", async () => {
    const answers: Record<string, number> = {};
    for (let i = 1; i <= 20; i++) answers[`q${i}`] = i % 4;
    const result = assembleStarterAnalysisResult({
      analysisId: "abc12345-0000-0000-0000-000000000000",
      answers,
      mstTone: 6,
      hasPhoto: false,
      context: { status: "always_like_this", detail: null },
      priorityPreference: "simplest",
      revealProducts: true,
    } as never);
    expect(result.answers).toEqual(answers);
    const doc = await buildBasicAnalysisPdf({
      clientName: "Test Member",
      email: "member@example.invalid",
      recommendation: result.recommendationText,
      result,
    });
    const text = pdfText(doc.output("arraybuffer"));
    expect(text).toContain("Your answers");
    expect(text).toContain("ABC12345");
    expect(text).toContain("not been reviewed by a dermatologist");
    expect(text).not.toMatch(/dermatologist-reviewed|reviewed by SKINLABS/i);
  });

  test("Basic PDF still works for an old result with only the recommendation text", async () => {
    const doc = await buildBasicAnalysisPdf({ clientName: "", email: "", recommendation: "## Title\n- one\n1. two\nPlain." });
    expect(doc.getNumberOfPages()).toBe(1);
  });
});
