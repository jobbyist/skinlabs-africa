/**
 * Pure formatting for the pre-approval intake record (PDF + internal
 * email). The question wording and option labels always come from the
 * session's own pinned assessment definition — nothing is re-authored here —
 * so the record reflects exactly what the member was shown.
 */
import type { DeterministicScores } from "../scoring/index.ts";
import type { DeterministicTriage } from "../safety.ts";

export interface IntakeQuestion {
  id: string;
  type: string;
  prompt: string;
  options?: Array<{ value: string; label: string }>;
  min?: number;
  max?: number;
  minLabel?: string;
  maxLabel?: string;
  showIf?: { questionId: string; oneOf: string[] };
}

export interface IntakeSection {
  id: string;
  title: string;
  questions: IntakeQuestion[];
}

export interface FormattedAnswer {
  questionId: string;
  prompt: string;
  answer: string;
}

export interface FormattedSection {
  title: string;
  answers: FormattedAnswer[];
}

const MAX_TEXT = 2000;

/** Collapses whitespace/control characters and caps length — member text is
 *  rendered as plain text only, never interpreted. */
export function cleanText(value: string, max = MAX_TEXT): string {
  // eslint-disable-next-line no-control-regex -- stripping control characters is the point -- deno-lint-ignore no-control-regex
  const flat = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function isVisible(q: IntakeQuestion, responses: Record<string, unknown>): boolean {
  if (!q.showIf) return true;
  const dep = responses[q.showIf.questionId];
  const values = Array.isArray(dep) ? dep.map(String) : dep === undefined || dep === null ? [] : [String(dep)];
  return values.some((v) => q.showIf!.oneOf.includes(v));
}

function labelFor(q: IntakeQuestion, value: unknown): string {
  const v = String(value);
  return q.options?.find((o) => o.value === v)?.label ?? v;
}

export function formatAnswer(q: IntakeQuestion, value: unknown): string {
  if (value === undefined || value === null || value === "" || (Array.isArray(value) && value.length === 0)) {
    return "Not answered";
  }
  switch (q.type) {
    case "multi_select":
      return (Array.isArray(value) ? value : [value]).map((v) => labelFor(q, v)).join("; ");
    case "scale": {
      const range = q.min !== undefined && q.max !== undefined ? ` (scale ${q.min}–${q.max}` : "";
      const ends = range && (q.minLabel || q.maxLabel) ? `: ${q.minLabel ?? ""} → ${q.maxLabel ?? ""})` : range ? ")" : "";
      return `${String(value)}${range}${ends}`;
    }
    case "product_list": {
      const entries = Array.isArray(value) ? value : [];
      const names = entries
        .map((e) => (typeof e === "string" ? e : [e?.productName, e?.category, e?.frequency].filter(Boolean).join(" · ")))
        .filter((s) => typeof s === "string" && s.trim().length > 0)
        .map((s) => cleanText(String(s), 200));
      return names.length ? names.join("; ") : "Not answered";
    }
    case "text":
      return cleanText(String(value));
    default:
      return q.options?.length ? labelFor(q, value) : cleanText(String(value), 500);
  }
}

/** Every visible question in definition order; hidden (showIf-unmet)
 *  questions are skipped so the record matches what the member saw. */
export function formatResponses(sections: IntakeSection[], responses: Record<string, unknown>): FormattedSection[] {
  return sections.map((s) => ({
    title: s.title,
    answers: s.questions
      .filter((q) => isVisible(q, responses))
      .map((q) => ({ questionId: q.id, prompt: q.prompt, answer: formatAnswer(q, responses[q.id]) })),
  }));
}

/** Human-readable deterministic score lines, each carrying its own
 *  "self-reported / not a clinical instrument" label from the scoring code. */
export function summariseScores(scores: DeterministicScores): Array<[string, string]> {
  const rows: Array<[string, string]> = [];
  const b = scores.baumannStyle;
  const axes = Object.values(b.axes).map((a) => `${a.letter} ${a.score}/${a.max}`).join(", ");
  rows.push([b.label, b.code ? `${b.code} (${axes})` : `Incomplete (${axes})`]);

  const a = scores.acne;
  rows.push([a.label, a.present
    ? `GAGS-style ${a.gagsStyleTotal} (${a.gagsStyleBand?.replace("_", " ")}); IGA-style ${a.igaStyleGrade ?? "n/a"}${a.igaStyleLabel ? ` (${a.igaStyleLabel})` : ""}${a.nodularReported ? "; deep painful lumps reported" : ""}`
    : "No breakouts reported"]);

  rows.push(["Glogau-style photoageing (self-reported)", scores.glogauStyle.type ? `Type ${scores.glogauStyle.type}: ${scores.glogauStyle.label}` : "Not answered"]);

  const m = scores.melasmaTracker;
  rows.push([m.label, m.present ? `${m.mmasiStyleScore} / ${m.max}` : "No dark patches reported"]);

  const q = scores.qolImpact;
  rows.push([q.label, q.score === null ? `Incomplete (${q.answered}/10 answered)` : `${q.score} / 30 (${q.band?.replace(/_/g, " ")})`]);

  const t = scores.mst;
  rows.push(["Monk Skin Tone (self-selected)", t.tier
    ? `MST ${t.tier} (group ${t.group})${t.skinOfColourPriority ? "; skin-of-colour priority" : ""}${t.ironOxideSpfIndicated ? "; tinted (iron-oxide) SPF indicated" : ""}`
    : "Not provided"]);
  rows.push(["Scoring rules version", scores.version]);
  return rows;
}

const CATEGORY_LABEL: Record<string, string> = {
  suspected_malignancy: "Possible suspicious lesion reported",
  possible_infection: "Possible infection signs reported",
  pregnancy_breastfeeding: "Pregnant or breastfeeding",
  severe_systemic: "Severe / systemic symptoms reported",
  distress: "Skin-related distress reported",
};

export function summariseTriage(t: DeterministicTriage): string {
  const cats = t.categories.map((c) => CATEGORY_LABEL[c] ?? c);
  return `${t.triage.toUpperCase()}${cats.length ? ` — ${cats.join("; ")}` : ""}`;
}

/** SAST timestamp for records (the business operates in South Africa). */
export function formatSast(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return `${d.toLocaleString("en-ZA", { timeZone: "Africa/Johannesburg", year: "numeric", month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })} SAST`;
}

export const REFERENCE_PATTERN = /^SKYNN-ADV-\d{8}-[23456789ABCDEFGHJKMNPQRSTVWXYZ]{6}$/;
