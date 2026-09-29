# 08 — AI: SKYNN AI

## SKYNN AI v2.1 — beta (CURRENT)

**Released**: 2026-09-28

### Critical Safety Boundaries

**SKYNN AI is cosmetic skincare personalization, NOT medical diagnosis**:

- Educational information only
- Triage guidance (when to see a dermatologist)
- NOT medical diagnosis
- NOT treatment prescription

**Do NOT introduce medical-diagnostic claims** into cosmetic skincare functionality.

### Terminology (REQUIRED)

Source: `src/lib/skynn/terminology.ts` (mirrored in edge functions)

**CURRENT NAMES**:

- **SKYNN AI v2.1 — beta** (system name)
- **Basic AI Skin Analysis** (free tier)
- **Advanced AI Dermatology Analysis** (paid tier)
- **Analysis Pass** (purchase item)
- **Monk Skin Tone (MST)** (fairness signal)

**RETIRED NAMES** (do not reintroduce):

- ~~Starter Analysis~~
- ~~AI Formulator~~
- ~~Advanced Assessment~~
- ~~(Advanced) Dermatology Report~~
- ~~SKYNN AI (beta)~~

Test: `skynnTerminology.test.ts` fails on retired names.

## Basic AI Skin Analysis (CURRENT)

### Access

- **Deterministic** (no AI model calls)
- Free for all tiers with limits:
  - **Glow Explorer/Lite**: 1 analysis per rolling **7 days**
  - **Glow Insider/VIP**: Unlimited
- Enforced by `save_starter_analysis()` RPC only
- **Never spends an Analysis Pass**
- Raises `profile_missing` without profile row

### Flow

1. **Anonymous flow** (no account):
   - Complete quiz
   - See skin type + top 2 concerns preview
   - Gate full results behind "Save your results — free"
   
2. **Authenticated flow**:
   - Complete quiz
   - Save via `save_starter_analysis()` (idempotent on `client_analysis_id`)
   - Get full on-screen results + PDF download

### Never Analyze Photos

**CRITICAL**: Photos never leave device, MST never inferred

- Photos used for self-assessment only
- MST is **self-reported** (`mst_source = 'user_reported'` CHECK constraint)
- Test: `skynnNoToneInference.test.ts` scans edge code for violations

### Output

Generated deterministically from quiz responses:

- Skin type (Baumann-inspired)
- Top concerns
- AM/PM routine with **grounded product recommendations**
- Ingredient guidance (with MST fairness signals)
- PDF report

**Grounded recommendations**: `src/lib/skynnProductMatch.ts`

- Picks from **real** `src/data/reviews.ts` products
- Falls back to generic product-type text (never fabricates)
- `matchStats` tracks coverage for fairness pipeline

### Limits

Configured in `pricing_settings`:

```sql
free_ai_analysis_allowance: 1
free_analysis_window_days: 7
```

Client reads via `usePricingConfig()`, enforced server-side by `save_starter_analysis()`.

### PDF Claims

**Basic PDF must never claim**:

- Dermatologist review
- Specialist review
- Medical diagnosis
- Treatment prescription

## Advanced AI Dermatology Analysis (CURRENT)

### Access

**Hybrid gate** (membership OR Analysis Pass):

- **NOT granted by membership alone** (not in ladder tiers)
- Requires **Analysis Pass** (one pass consumed per submission)
- Server gate: `get_advanced_assessment_access()` RPC
- Never use `hasCapability()` alone

### Current Status

**FEATURE_FLAGGED** (`rollout_stage = 'pass_holders_review'`):

- Route exists: `/skynn-ai/advanced`
- NOT linked from nav/dashboard/header
- Admin must enable via config

### Architecture

**Assessment Definition**: `assessment_definitions` (versioned JSONB)

- Current: `2026.2` (73 questions)
- Sections stored as JSONB (evolving schema)

**Prompts**: `assessment_prompt_versions`

- Service-role only (zero RLS policies)
- Current: `skynn-v2.0.0` (6 role prompts)
- Dermatologist-approved (**pending sign-off record**)
- md5 verified against source

**Evidence**: `advanced_assessment_evidence`

- 16 efficacy citations (C1-C16, PubMed verified)
- 8 methodology refs (M1-M8)
- Model can only cite from allowed list
- Unknown citations stripped

### Submission Flow

1. **Create session**: `start_advanced_assessment_session()`
2. **Autosave progress**: Column-limited UPDATE (responses, completeness)
3. **Submit**: `submit_advanced_assessment_session()`
   - Server-side completeness check (never trust client)
   - Consume Analysis Pass (idempotent on `session_id:submission_version`)
   - Refuse second open submission (`duplicate_pending`)

### Processing Pipeline

**Stages** (all persisted, resumable):

```
Consent Gate
    ↓
Deterministic Scores (Baumann, GAGS, Glogau, mMASI, QoL, MST)
    ↓
Haiku Intake (structured data extraction)
    ↓
Haiku Safety (triage, red flags)
    ↓
Sonnet Fairness (MST validation, never inferred)
    ↓
Sonnet Reasoner (evidence synthesis, PubMed-only)
    ↓
Sonnet Writer (report generation)
    ↓
Regulatory Scan (scanRegulatoryFlags)
    ↓
Opus QA (one redline rewrite, then reject if still flagged)
```

**Models** (`modelConfig.ts`):

- **Report generation**: Claude Opus 5 (`claude-opus-5`)
- **Reasoning/writing**: Claude Sonnet 5 (`claude-sonnet-5`)
- **Classification/intake**: Claude Haiku 4.5 (`claude-haiku-4-5`)

Override: `SKYNN_ADVANCED_MODEL` env var

### Safety Screening

**Deterministic triage** (`_shared/assessment/safety.ts`):

- Based on `safety_red_flags` answer only
- NOT dermatologist-approved criteria (placeholder)
- Never from model output (hallucination-safe)
- Computes from respondent's own input

**Escalation messages**:

- Red flags → "Seek immediate medical attention"
- Moderate → "Consult dermatologist within 2 weeks"
- Mild → "Consider dermatologist consultation"

### Report Modes (CURRENT)

**Fallback Mode** (CURRENT: `report_mode = 'fallback'`):

1. Pass consumed at submission
2. Reference number assigned (`SKYNN-ADV-YYYYMMDD-XXXXXX`)
3. Intake PDF generated (jsPDF, no AI)
4. Email to reports@skinlabs.co.za with PDF attachment
5. Member sees "Advanced Dermatology Report — Pending"
6. Approx. 3-4 week turnaround
7. Can delete/withdraw (refund pass, alert sent)

**Production Mode** (PLANNED: `report_mode = 'production'`):

1. Pass consumed at submission
2. Async AI pipeline via worker (`skynn-advanced-worker`)
3. Report held for **manual admin review**
4. Admin approves → member can read
5. Admin rejects → pass refunded, member notified
6. Requires dermatologist sign-off record
7. Requires working AI key

### Admin Review (Production Mode)

**Admin Dashboard → SKYNN Reviews**:

- View all submissions (search by reference/email/user ID)
- Filter by status/mode/date
- Read full answers
- View intake PDF (60s signed URL)
- Approve/reject with reason
- "Send to production" (promote fallback to AI generation)

**Audit log**: `advanced_assessment_audit_log` (append-only, no content)

### Worker (`skynn-advanced-worker`)

**Runs every minute** (pg_cron, when pending reports exist):

- Auth: Vault secret (`skynn_worker_cron_secret`)
- Claims/leases one report
- Runs pipeline stages
- Persists state after each stage
- Releases lease on completion/failure
- Retry with backoff on transient errors

**Blocked states**:

- `blocked_not_configured`: Missing/invalid AI key
- Stays queued without using retries
- Admin must fix before resuming

### Go-Live Checklist

Before enabling:

1. Set working `ANTHROPIC_API_KEY` or `AI_GATEWAY_API_KEY` (Edge Function secret)
2. Record dermatologist sign-off (Admin → SKYNN Reviews)
3. `UPDATE skynn_advanced_assessment_config SET rollout_stage = 'pass_holders_review'`
4. For production mode: `SET report_mode = 'production'`
5. Link route from dashboard/nav when ready

## Fairness Pipeline (CURRENT)

**Append-only events**: `skynn_fairness_events`

Written by:

- `logFairnessEvent()` (Basic Analysis path)
- Edge function (legacy path, if still active)

**Metrics tracked**:

- Completeness (input completeness, not accuracy)
- Grounded match rate (real product recommendations)
- Compliance flags (named diagnosis violations)
- MST band (light 1-3 / medium 4-7 / deep 8-10)

**View**: `skynn_fairness_summary` (admin-only)

- Aggregates per MST band
- Surfaces gaps (e.g., low match rate for deep tones)
- No admin UI yet (query directly)

## Compliance Scanning

**Forbidden terms** (`FORBIDDEN_DIAGNOSIS_TERMS`):

- Shared between Basic and Advanced
- Scans model output for named diagnoses
- Never auto-fixes (rejects output if found)
- Test: Compliance scan in pipeline

Examples: psoriasis, eczema, rosacea, melanoma, dermatitis (in diagnostic context)

## Integration Points

### SKYNN AI → Routine

**Basic Analysis** generates:

- AM/PM routine (grounded products)
- Stored in `skincare_recommendations.result_payload`
- Dashboard displays via `SavedAnalysisCard.tsx`

**Advanced Analysis** builds handoff context:

- `buildRoutineHandoffContext()` (contract only)
- No write path exists yet (avoid duplicate engine)

### SKYNN AI → OpenHaus

**Cross-link** (`src/lib/marketplaceCrossLink.ts`):

- Grounded recommendations → "Shop on OpenHaus"
- Links to marketplace product if available
- Sponsored badge on marketplace links

### SKYNN AI → Ingredients

**Ingredient mentions** resolve to profiles:

- Links to `/ingredients/:slug`
- Displays profile excerpt if published
- "Coming soon" if unpublished
- Never generated on demand

## Testing

### Unit Tests

- `skynnTerminology.test.ts`: Terminology enforcement
- `skynnNoToneInference.test.ts`: Photo analysis guard
- `skynnV2Pipeline.test.ts`: Pipeline stages
- `skynnV2Scoring.test.ts`: Scoring algorithms

### E2E Tests

- `e2e/skynn.e2e.ts`: Full flow with mocked Supabase

### SQL Probes

- `supabase/tests/formulator_allowance.sql`: Limits enforcement
- `supabase/tests/advanced_pass_gate.sql`: Pass consumption

## Known Limitations

1. **Basic PDF**: Auto-downloads for anonymous (deliberate)
2. **Advanced**: No async background in fallback mode
3. **MST**: Self-reported only (no inference)
4. **Photos**: Never uploaded (client-side only)
5. **Evidence**: Limited to seeded citations
6. **Sign-off**: Pending dermatologist record details

