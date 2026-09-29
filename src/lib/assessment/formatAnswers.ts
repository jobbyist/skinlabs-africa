/**
 * Formats Advanced AI Dermatology Analysis answers for people: the question
 * wording and option labels always come from the session's own pinned
 * definition, so a summary shows exactly what the member was asked.
 *
 * Browser copy of supabase/functions/_shared/assessment/intake/format.ts
 * (formatAnswer / formatResponses / cleanText). Deno and Vite are separate
 * build targets here; src/lib/__tests__/formatAnswers.test.ts checks the two
 * produce identical output, so keep them in sync.
 */
import type { AssessmentSection } from "@/lib/assessment/types";

export interface FormattedAnswer {
  questionId: string;
  prompt: string;
  answer: string;
}

export interface FormattedSection {
  title: string;
  answers: FormattedAnswer[];
}

type Question = AssessmentSection["questions"][number];

const MAX_TEXT = 2000;

export function cleanText(value: string, max = MAX_TEXT): string {
  // eslint-disable-next-line no-control-regex -- stripping control characters is the point
  const flat = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max)}…` : flat;
}

function isVisible(q: Question, responses: Record<string, unknown>): boolean {
  if (!q.showIf) return true;
  const dep = responses[q.showIf.questionId];
  const values = Array.isArray(dep) ? dep.map(String) : dep === undefined || dep === null ? [] : [String(dep)];
  return values.some((v) => q.showIf!.oneOf.includes(v));
}

function labelFor(q: Question, value: unknown): string {
  const v = String(value);
  return q.options?.find((o) => o.value === v)?.label ?? v;
}

export function formatAnswer(q: Question, value: unknown): string {
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
        .map((e) =>
          typeof e === "string"
            ? e
            : [
                (e as Record<string, unknown>)?.productName,
                (e as Record<string, unknown>)?.category,
                (e as Record<string, unknown>)?.frequency,
              ]
                .filter(Boolean)
                .join(" · "),
        )
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

/** Every visible question in definition order (hidden follow-ups skipped). */
export function formatResponses(sections: AssessmentSection[], responses: Record<string, unknown>): FormattedSection[] {
  return sections.map((s) => ({
    title: s.title,
    answers: s.questions
      .filter((q) => isVisible(q, responses))
      .map((q) => ({ questionId: q.id, prompt: q.prompt, answer: formatAnswer(q, responses[q.id]) })),
  }));
}
