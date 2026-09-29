/**
 * SKYNN AI — canonical product terminology (SKYNN AI v2.1 — beta).
 *
 * Every current product-facing surface (UI, PDFs, emails, SEO, admin) should
 * read its SKYNN AI names from here, so the product can't drift back into the
 * six-names-for-one-thing state the v2.1 audit found. The edge-function copy
 * (supabase/functions/_shared/skynn/terminology.ts) mirrors these values; a
 * unit test keeps the two identical.
 *
 * Legacy identifiers intentionally kept (renaming them would break
 * compatibility or falsify history — see docs/skynn-terminology.md):
 *   - DB: save_starter_analysis(), starter_analyses_used,
 *     skynn_fairness_events.source = 'starter', advanced_assessment_* tables.
 *   - Code: the `starter-analysis` module, the AIFormulator component, the
 *     `/ai-formulator` → `/skynn-ai` redirect.
 *   - Analytics: existing event names (formulator_started, analysis_generated,
 *     advanced_assessment_upsell_* …) — kept for historical reporting.
 *   - Historical content: Announcements, the About roadmap, dated newsroom posts.
 */
export const SKYNN_PRODUCT = "SKYNN AI";
export const SKYNN_RELEASE_LABEL = "SKYNN AI v2.1 — beta";
/** Machine-readable version stamped on analytics, fairness events and intake records. */
export const SKYNN_FEATURE_VERSION = "2.1.0-beta";

export const BASIC_NAME = "Basic AI Skin Analysis";
export const BASIC_REPORT_NAME = "Basic AI Skin Analysis report";
/** Shown next to saved rows created before v2.1, which were called "Starter Analysis". */
export const BASIC_LEGACY_NOTE = "formerly Starter Analysis";

export const ADVANCED_NAME = "Advanced AI Dermatology Analysis";
export const ADVANCED_PENDING_LABEL = "Advanced AI Dermatology Analysis — Pending";
export const ADVANCED_SUBMISSION_NAME = "Advanced AI Dermatology Analysis submission";

export const ANALYSIS_PASS = "Analysis Pass";
export const ANALYSIS_PASSES = "Analysis Passes";
export const analysisPassCount = (n: number) => `${n} ${n === 1 ? ANALYSIS_PASS : ANALYSIS_PASSES}`;

export const MST_FULL_NAME = "Monk Skin Tone";
export const MST_SHORT = "MST";
/** The one sentence every MST surface must be consistent with. */
export const MST_STATEMENT =
  "Monk Skin Tone (MST) is optional and self-reported. SKYNN AI never infers it from your photo, and it is not a diagnosis.";

/** Rolling window for the free Basic AI Skin Analysis (mirrors pricing_settings.free_analysis_window_days). */
export const BASIC_WINDOW_DAYS = 7;
export const BASIC_LIMIT_MESSAGE = `Your ${BASIC_NAME} is available once every ${BASIC_WINDOW_DAYS} days.`;

export const SKYNN_ROUTE = "/skynn-ai";
export const SKYNN_ADVANCED_ROUTE = "/skynn-ai/advanced";
