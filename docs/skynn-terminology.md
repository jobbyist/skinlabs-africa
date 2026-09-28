# SKYNN AI terminology (v2.1 — beta)

The canonical names live in `src/lib/skynn/terminology.ts` (mirrored for edge
functions in `supabase/functions/_shared/skynn/terminology.ts`).
`src/lib/__tests__/skynnTerminology.test.ts` fails when a retired name shows up
in current product-facing code, and when the two copies drift apart.

## Canonical terms

| Use | Meaning |
| --- | --- |
| **SKYNN AI** | The product. |
| **SKYNN AI v2.1 — beta** | The current release (machine form `2.1.0-beta`). |
| **Basic AI Skin Analysis** | The free, deterministic analysis at `/skynn-ai`. One per rolling 7 days for Glow Explorer / Glow Lite; unlimited for Glow Insider / VIP. Never spends an Analysis Pass. |
| **Basic AI Skin Analysis report** | Its PDF. |
| **Advanced AI Dermatology Analysis** | The Analysis Pass product at `/skynn-ai/advanced`. |
| **Advanced AI Dermatology Analysis submission** / **— Pending** | A fallback (pre-approval intake) record. Never call it a report, reviewed, approved or released. |
| **Advanced AI Dermatology Analysis report** | Only for a completed report from the production workflow. |
| **Analysis Pass** / **Analysis Passes** | Always capitalised. |
| **Monk Skin Tone (MST)** | Full name first; always optional, self-reported, never inferred from a photo, not a diagnosis. |

## Retired names → replacement

| Retired | Replacement |
| --- | --- |
| Starter Analysis, Starter AI Analysis, Starter Skin Analysis, Basic Analysis, Free Skin Analysis | Basic AI Skin Analysis |
| Advanced Assessment, Advanced Analysis, Advanced Skin Analysis, Advanced AI Analysis, Advanced (AI) Dermatology Report, SKYNN AI Advanced | Advanced AI Dermatology Analysis |
| AI Formulator | SKYNN AI (`/ai-formulator` remains only as a redirect to `/skynn-ai`) |
| SKYNN AI (beta) | SKYNN AI v2.1 — beta |
| Weekly live AI report / "live AI routine" | Retired (the `skincare-ai` path). Members get unlimited Basic AI Skin Analysis. |

## Intentionally kept

| Kept | Why |
| --- | --- |
| DB: `save_starter_analysis()`, `get_formulator_allowance()`, `starter_analyses_used`, `skynn_fairness_events.source = 'starter'`, `advanced_assessment_*` tables and RPCs | Renaming breaks compatibility and historical data for no user-visible gain. |
| Code: `src/lib/starter-analysis/*`, the `AIFormulator` component, `useAdvancedAssessment`, `ai_analysis.live_weekly` FeatureKey (now means unlimited Basic re-analysis) | Internal identifiers. |
| Analytics: `formulator_started`, `analysis_generated`, `advanced_assessment_upsell_*`, … | Historical reporting; see `docs/conversion-events.md`. |
| Routes: `/ai-formulator` redirect, FAQ slug `how-does-the-ai-formulator-work` | Existing links and bookmarks. |
| Historical content: `Announcements.tsx`, the About roadmap, dated newsroom articles | They record what shipped at the time. |
| Saved history rows created before v2.1 | Shown as "Basic AI Skin Analysis" (result payload) or "Legacy live AI report" (old `skincare-ai` rows). |
