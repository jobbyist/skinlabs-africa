/**
 * Model/provider abstraction (section 3). The rest of the engine depends on
 * this interface only — never on the Anthropic SDK/fetch calls directly —
 * so a future model swap, fallback provider, or A/B benchmark is a new
 * class behind this same contract, not a rewrite of the assessment engine.
 *
 *   AssessmentAIProvider
 *          |
 *          +-- ClaudeAssessmentProvider (claudeProvider.ts)
 *          |
 *          +-- (future) another provider
 */
import type { AssessmentGenerationInput, AssessmentGenerationResult } from "./types.ts";

export interface AssessmentAIProvider {
  generateReport(input: AssessmentGenerationInput): Promise<AssessmentGenerationResult>;
}
