/**
 * The Basic AI Skin Analysis report PDF (SKYNN AI v2.1 — beta), built on the
 * shared SkinLabs® PDF kit (src/lib/pdf/brandPdf.ts).
 *
 * Built from the saved result (`StarterAnalysisResult`, i.e.
 * skincare_recommendations.result_payload), so the same file is produced
 * right after the analysis and when a member re-downloads it from the
 * dashboard. Older results without some fields simply skip those sections.
 * Everything here is the member's own data plus the deterministic engine's
 * output — no review or specialist claims.
 */
import type jsPDF from "jspdf";
import { QUESTIONS } from "@/data/quiz";
import { withoutPhotoFactor } from "@/data/formulaResults";
import { CHANGE_QUESTION, PRIORITY_PREFERENCE_QUESTION } from "@/data/starter-analysis/contextQuestions";
import type { StarterAnalysisResult } from "@/lib/starter-analysis/types";
import { BrandDoc, formatPdfDate, loadLogoDataUrl, safeFileName } from "@/lib/pdf/brandPdf";
import { BASIC_NAME, BASIC_REPORT_NAME, MST_FULL_NAME, SKYNN_RELEASE_LABEL } from "@/lib/skynn/terminology";

export interface SkincarePdfData {
  clientName: string;
  email: string;
  /** Markdown-shaped recommendation text (always present). */
  recommendation: string;
  skinType?: string;
  generatedAt?: Date;
  /** Self-reported Monk Skin Tone (1–10), optional. */
  mstTone?: number | null;
  /** The full saved result, when available — adds the detailed sections. */
  result?: Partial<StarterAnalysisResult> | null;
}

const title = (s: string | null | undefined) =>
  s ? s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "-";

const CONCERN_LABEL: Record<string, string> = {
  acne: "Breakouts",
  brightening: "Uneven tone / brightening",
  aging: "Visible ageing",
  sensitivity: "Sensitivity",
};

export const DISCLAIMER = `This ${BASIC_NAME} report is a rule-based analysis of your own answers, grounded in general dermatology reference material. It has not been reviewed by a dermatologist or a SkinLabs specialist, your photo (if you added one) stayed on your device and was not analysed, and your ${MST_FULL_NAME} is only what you chose to share. It is general skincare guidance, not medical advice or a diagnosis. For medical skin conditions, persistent reactions, or before starting prescription actives, please consult a licensed dermatologist.`;

export async function buildBasicAnalysisPdf(data: SkincarePdfData): Promise<jsPDF> {
  const r = data.result ?? null;
  const generatedAt = data.generatedAt ?? (r?.generatedAt ? new Date(r.generatedAt) : new Date());
  const b = new BrandDoc({
    title: BASIC_REPORT_NAME,
    subtitle: `${SKYNN_RELEASE_LABEL} · prepared for ${data.clientName || "you"}`,
    footer: `${SKYNN_RELEASE_LABEL} · ${BASIC_REPORT_NAME} · Not reviewed by a dermatologist · Not medical advice`,
    logoDataUrl: await loadLogoDataUrl(),
    generatedAt,
  });

  const profile = r?.profile;
  const mst = data.mstTone ?? profile?.mstTone ?? null;

  b.section("Summary");
  b.keyValues([
    ["Prepared for", [data.clientName, data.email].filter(Boolean).join(" · ") || "-"],
    ["Analysis date", formatPdfDate(r?.generatedAt ?? generatedAt)],
    ...(r?.analysisId ? ([["Analysis ID", r.analysisId.slice(0, 8).toUpperCase()]] as Array<[string, string]>) : []),
    ["Skin type", title(r?.skinType ?? data.skinType)],
    ["Main concern", r?.primaryConcern ? CONCERN_LABEL[r.primaryConcern] ?? title(r.primaryConcern) : "-"],
    ...(profile?.secondaryConcerns?.length
      ? ([["Other concerns", profile.secondaryConcerns.map(title).join(", ")]] as Array<[string, string]>)
      : []),
    [MST_FULL_NAME, mst ? `MST ${mst} of 10 (self-reported, optional, not a diagnosis)` : "Not shared"],
  ]);

  if (profile) {
    b.section("Your skin profile");
    b.keyValues([
      ["Sensitivity", title(profile.sensitivityTendency)],
      ["Skin barrier", title(profile.barrierTendency)],
      ["Experience with actives", title(profile.activeTolerance)],
      ["Routine experience", title(profile.routineMaturity)],
      ["How your skin behaves", title(profile.skinBehaviour)],
      ["Main goal", title(profile.primaryGoal)],
      ...(profile.secondaryGoal ? ([["Second goal", title(profile.secondaryGoal)]] as Array<[string, string]>) : []),
    ]);
  }

  if (r?.skinStory?.narrative) {
    b.section("Your skin story");
    b.paragraph(r.skinStory.narrative);
  }

  if (r?.priorities?.items?.length) {
    b.section("What to focus on first");
    b.bullets(r.priorities.items.map((p) => `${p.rank}. ${title(p.key)} (${p.level} priority): ${p.reason}`));
  }

  const routine = r?.groundedRoutine;
  if (routine && (routine.am?.length || routine.pm?.length)) {
    b.section("Your routine, with SkinLabs-reviewed products");
    if (routine.am?.length) {
      b.subheading("Morning");
      b.bullets(routine.am.map((p) => `${p.slot}: ${p.product.brand} ${p.product.product_name}`));
    }
    if (routine.pm?.length) {
      b.subheading("Evening");
      b.bullets(routine.pm.map((p) => `${p.slot}: ${p.product.brand} ${p.product.product_name}`));
    }
    b.paragraph(
      "Products are matched to your skin type and main concern from SkinLabs' published product reviews. Check each product's label for ingredients you avoid.",
      { muted: true, size: 8.5 },
    );
  }

  if (r?.routineStrategy || r?.preferences || r?.context) {
    b.section("How we shaped it");
    const rows: Array<[string, string]> = [];
    if (r?.routineStrategy) {
      rows.push(["Target routine size", `${r.routineStrategy.targetStepCount} steps`]);
      rows.push(["Active ingredient intensity", title(r.routineStrategy.activeIntensity)]);
      rows.push(["Budget", r.routineStrategy.budgetStance === "constrained" ? "Budget-conscious" : "Flexible"]);
    }
    if (r?.preferences?.priority) {
      const label = PRIORITY_PREFERENCE_QUESTION.options.find((o) => o.value === r.preferences?.priority)?.label;
      rows.push(["Your priority", label ?? title(r.preferences.priority)]);
    }
    if (r?.context?.status) {
      const label = CHANGE_QUESTION.options.find((o) => o.value === r.context?.status)?.label;
      rows.push(["What's happening with your skin", [label ?? title(r.context.status), r.context.detail].filter(Boolean).join(": ")]);
    }
    b.keyValues(rows);
  }

  b.section("Your full analysis");
  b.markdown(data.recommendation);

  const completeness = r?.completeness ? withoutPhotoFactor(r.completeness) : null;
  if (completeness?.factors?.length) {
    b.section("How complete your answers were");
    b.keyValues(completeness.factors.map((f) => [f.label, `${f.value}%`] as [string, string]));
    b.paragraph(
      `Overall ${completeness.overall}%. This shows how much you told us, not how accurate the analysis is.`,
      { muted: true, size: 8.5 },
    );
  }

  const answers = r?.answers;
  if (answers && Object.keys(answers).length) {
    b.section("Your answers");
    b.keyValues(
      QUESTIONS.filter((q) => typeof answers[q.id] === "number").map((q) => [
        q.title,
        q.options.find((o) => o.value === answers[q.id])?.label ?? "-",
      ]),
    );
  }

  b.callout("Important", DISCLAIMER);
  return b.finish();
}

export async function downloadSkincarePdf(data: SkincarePdfData) {
  const doc = await buildBasicAnalysisPdf(data);
  doc.save(`skinlabs-basic-ai-skin-analysis-${safeFileName(data.clientName || "client")}.pdf`);
}
