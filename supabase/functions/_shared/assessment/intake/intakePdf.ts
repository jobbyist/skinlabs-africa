/**
 * Intake/submission record PDF for a pre-approval Advanced Dermatology
 * Report request. Deliberately NOT styled or worded like a report: it is an
 * administrative record of what the member submitted, clearly marked
 * "STATUS: PENDING", with no findings, recommendations or review claims.
 *
 * The jsPDF constructor is injected so this stays a pure, bun-testable
 * module (the edge runtime passes the esm.sh build; tests pass the npm one).
 * Everything is drawn with doc.text() — member text can't become markup,
 * links or PDF actions.
 */
import type { FormattedSection } from "./format.ts";

export interface IntakePdfData {
  referenceNumber: string;
  submittedAt: string; // already formatted
  userId: string;
  userEmail: string | null;
  processingMode: string;
  status: string;
  versions: Array<[string, string]>;
  consent: Array<[string, string]>;
  access: Array<[string, string]>;
  scores: Array<[string, string]>;
  triage: string;
  sections: FormattedSection[];
  generatedAt: string; // already formatted
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deno-lint-ignore no-explicit-any
type JsPdfCtor = new (opts: Record<string, unknown>) => any;

const INK: [number, number, number] = [24, 24, 27];
const MUTED: [number, number, number] = [113, 113, 122];
const LINE: [number, number, number] = [228, 228, 231];
const SOFT: [number, number, number] = [244, 244, 245];
const AMBER: [number, number, number] = [180, 83, 9];
const AMBER_BG: [number, number, number] = [255, 247, 237];

/** The standard PDF fonts only cover WinAnsi; anything else (emoji, CJK,
 *  maths symbols) is replaced rather than rendered as garbage. */
export function pdfSafe(text: string): string {
  return text
    .replace(/[\u2010-\u2015]/g, (c) => (c === "\u2014" || c === "\u2013" ? c : "-"))
    .replace(/[\u2192\u21D2]/g, "->")
    .replace(/\u2265/g, ">=")
    .replace(/\u2264/g, "<=")
    // eslint-disable-next-line no-control-regex -- deliberately keeps tab/newline, drops everything outside WinAnsi
    .replace(/[^\x09\x0A\x0D\x20-\x7E\u00A0-\u00FF\u2013\u2014\u2018\u2019\u201C\u201D\u2022\u2026\u20AC]/g, "?");
}

export const INTAKE_DISCLAIMER =
  "This document is an intake record of a member's SKYNN AI - v2.2 (beta) Advanced AI Dermatology Analysis submission. " +
  "It is not a report, not a medical diagnosis, and has not been reviewed by a dermatologist. The scores below are " +
  "computed by fixed rules from the member's own answers and are self-reported tracking aids, not clinical assessments. " +
  "Contains special personal information under POPIA: handle confidentially, do not forward, and delete any copies " +
  "if the member withdraws their submission.";

export function buildIntakePdf(JsPDF: JsPdfCtor, data: IntakePdfData): Uint8Array {
  const doc = new JsPDF({ unit: "pt", format: "a4" });
  const pageWidth: number = doc.internal.pageSize.getWidth();
  const pageHeight: number = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  let y = 0;

  const footer = () => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(`SKYNN AI - v2.2 (beta) · Advanced AI Dermatology Analysis submission · ${data.referenceNumber} · STATUS: PENDING · Confidential`), margin, pageHeight - 24);
  };
  const newPage = () => {
    footer();
    doc.addPage();
    y = 56;
  };
  const ensure = (needed: number) => {
    if (y + needed > pageHeight - 48) newPage();
  };
  const heading = (text: string) => {
    // Room for the heading AND its first row, so a heading is never
    // stranded at the bottom of a page.
    ensure(64);
    y += 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(text), margin, y);
    y += 6;
    doc.setDrawColor(...LINE);
    doc.line(margin, y, pageWidth - margin, y);
    y += 14;
  };
  const keyValues = (rows: Array<[string, string]>, keyWidth = 170) => {
    for (const [k, v] of rows) {
      doc.setFontSize(9);
      const valLines: string[] = doc.splitTextToSize(pdfSafe(v || "—"), contentWidth - keyWidth);
      const keyLines: string[] = doc.splitTextToSize(pdfSafe(k), keyWidth - 10);
      const h = Math.max(valLines.length, keyLines.length) * 11.5 + 4;
      ensure(h);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(keyLines, margin, y);
      doc.setTextColor(...INK);
      doc.text(valLines, margin + keyWidth, y);
      y += h;
    }
  };

  // Header band (neutral — this is an admin record, not a branded report).
  doc.setFillColor(...INK);
  doc.rect(0, 0, pageWidth, 78, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("SKINLABS® · SKYNN AI", margin, 36);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Advanced AI Dermatology Analysis submission — intake record (not a report)", margin, 56);
  y = 108;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...INK);
  doc.text(pdfSafe(data.referenceNumber), margin, y);

  // Status badge
  const badge = "STATUS: PENDING";
  doc.setFontSize(9);
  const bw = doc.getTextWidth(badge) + 18;
  doc.setFillColor(...AMBER_BG);
  doc.setDrawColor(...AMBER);
  doc.roundedRect(pageWidth - margin - bw, y - 14, bw, 20, 4, 4, "FD");
  doc.setTextColor(...AMBER);
  doc.text(badge, pageWidth - margin - bw + 9, y);
  y += 22;

  // Disclaimer box
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  const disc: string[] = doc.splitTextToSize(pdfSafe(INTAKE_DISCLAIMER), contentWidth - 20);
  const dh = disc.length * 11 + 16;
  doc.setFillColor(...SOFT);
  doc.setDrawColor(...LINE);
  doc.roundedRect(margin, y, contentWidth, dh, 4, 4, "FD");
  doc.setTextColor(...INK);
  doc.text(disc, margin + 10, y + 14);
  y += dh + 8;

  heading("Submission");
  keyValues([
    ["Reference", data.referenceNumber],
    ["Submitted", data.submittedAt],
    ["Status", data.status],
    ["Processing mode", data.processingMode],
    ["Account ID", data.userId],
    ["Account email", data.userEmail ?? "—"],
    ["Record generated", data.generatedAt],
  ]);

  heading("Framework versions");
  keyValues(data.versions);

  heading("Consent (POPIA)");
  keyValues(data.consent);

  heading("Access / Analysis Pass");
  keyValues(data.access);

  heading("Deterministic scores (fixed rules, no AI)");
  keyValues(data.scores, 230);

  heading("Red-flag safety floor (fixed rules on the member's answers)");
  keyValues([["Result", data.triage]]);

  heading("Questionnaire responses");
  for (const section of data.sections) {
    ensure(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...INK);
    doc.text(pdfSafe(section.title), margin, y);
    y += 14;
    for (const a of section.answers) {
      doc.setFontSize(8.8);
      const q: string[] = doc.splitTextToSize(pdfSafe(a.prompt), contentWidth);
      const ans: string[] = doc.splitTextToSize(pdfSafe(a.answer), contentWidth - 12);
      ensure(q.length * 11 + ans.length * 11 + 8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...MUTED);
      doc.text(q, margin, y);
      y += q.length * 11;
      doc.setTextColor(...INK);
      doc.setFont("helvetica", "bold");
      doc.text(ans, margin + 12, y);
      y += ans.length * 11 + 6;
    }
    y += 4;
  }

  footer();
  return new Uint8Array(doc.output("arraybuffer"));
}
