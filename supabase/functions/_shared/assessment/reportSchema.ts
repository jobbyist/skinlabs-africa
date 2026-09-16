/**
 * Strict structured report schema (section 12) — Claude's raw output is
 * never persisted or returned to the frontend without passing this. Uses
 * zod (already a project dependency — see package.json — imported here via
 * esm.sh the same way supabase-js is imported across every edge function in
 * this repo) rather than introducing a second validation library.
 */
import { z } from "https://esm.sh/zod@4.1.13";

const evidenceRefSchema = z.object({
  id: z.string(),
  title: z.string(),
  publisher: z.string().nullable().optional(),
  sourceType: z.string(),
  url: z.string().nullable().optional(),
  publicationDate: z.string().nullable().optional(),
  relevance: z.string().optional(),
});

const safetyFlagsSchema = z.object({
  requiresProfessionalReview: z.boolean(),
  urgency: z.enum(["routine", "prompt", "urgent"]),
  reasons: z.array(z.string()),
  userMessage: z.string(),
});

export const advancedDermatologyReportSchema = z.object({
  summary: z.string().min(1),
  skinProfile: z.object({
    skinType: z.string(),
    keyTraits: z.array(z.string()),
  }),
  observations: z.array(z.string()),
  primaryConcerns: z.array(
    z.object({
      concern: z.string(),
      priority: z.number().int(),
      rationale: z.string(),
    }),
  ),
  secondaryConcerns: z.array(z.string()),
  contributingFactors: z.array(
    z.object({
      factor: z.string(),
      explanation: z.string(),
    }),
  ),
  routineAssessment: z.object({
    strengths: z.array(z.string()),
    gaps: z.array(z.string()),
  }),
  recommendations: z.array(
    z.object({
      area: z.string(),
      recommendation: z.string(),
      rationale: z.string(),
    }),
  ),
  ingredientGuidance: z.array(
    z.object({
      ingredientOrCategory: z.string(),
      guidance: z.string(),
    }),
  ),
  routineStrategy: z.object({
    amFocus: z.string(),
    pmFocus: z.string(),
    notes: z.string(),
  }),
  lifestyleContext: z.array(z.string()),
  whatToAvoid: z.array(z.string()),
  // safetyFlags/evidence/confidence are overwritten by the edge function
  // after generation (the deterministic safety screen and the server-
  // validated evidence set, respectively) — accepted loosely here so a
  // model that omits or varies them doesn't fail validation before that
  // overwrite happens.
  safetyFlags: safetyFlagsSchema.partial().optional(),
  evidence: z.array(evidenceRefSchema).optional().default([]),
  confidence: z.enum(["high", "moderate", "limited"]),
  uncertainties: z.array(z.string()),
});

export type AdvancedDermatologyReportShape = z.infer<typeof advancedDermatologyReportSchema>;

export interface ReportValidationResult {
  success: boolean;
  data?: AdvancedDermatologyReportShape;
  issueCount?: number;
}

/** Never throws — a malformed response is a normal, expected outcome to
 *  handle (retry once, then fail the session safely), not an exception. */
export function validateReportShape(raw: unknown): ReportValidationResult {
  const result = advancedDermatologyReportSchema.safeParse(raw);
  if (result.success) return { success: true, data: result.data };
  return { success: false, issueCount: result.error.issues.length };
}
