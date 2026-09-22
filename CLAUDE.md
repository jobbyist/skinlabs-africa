# SkinLabs — project memory

Durable context for future work on this repo. Keep this updated as major
architecture changes land; don't duplicate detail that already lives in
code comments or `supabase/SCHEMA.md` — link to it instead.

## Product principle (standing instruction, do not violate)

SkinLabs = South African skincare intelligence infrastructure, not a
content subscription. Optimise for: free acquisition, AI analysis
completion, first-party skin-profile creation, SEO discovery,
ingredient/product knowledge accumulation, retention, trust, selective
monetisation, proprietary data accumulation, strategic value. Avoid
feature sprawl; prefer reusable data models over page-level features;
never sacrifice editorial independence for monetisation; never fabricate
social proof, scarcity, product data, reviews, ratings or performance
claims; never expose sensitive user data; never make an unfinished
feature appear operational.

## Major systems

- **Entitlements** — `src/lib/entitlements.ts` is the single source of
  truth for plan tiers (Glow Explorer/Lite/Insider/VIP, founding member,
  professional). Use `isPaidSubscriptionStatus()` — `subscription_status`
  is written as `"insider"`/`"vip"`, never literally `"premium"`. Gating
  goes through `useEntitlements` + `FeatureGate`/`UpgradePrompt`, not ad
  hoc checks.
- **SKYNN AI (beta)** — free-first acquisition funnel, rebranded from "AI
  Formulator": Intro → Consent → Photo → MST → Quiz → Results → signup
  gate. Lives at **`/skynn-ai`** (`/ai-formulator` is a permanent
  `<Navigate replace>` redirect in `src/App.tsx` — keep both routes; never
  delete the redirect). Page wrapper is `src/pages/AIFormulator.tsx`; all
  logic/UI is `src/components/AIFormulator.tsx` (still named
  `AIFormulator` deliberately — only the route/nav copy is branded SKYNN
  AI, the file/component names were left alone to minimise churn).
  `claim_starter_analysis` RPC gates one free analysis for signed-in free
  users; `isMember` routes Insider/VIP to the live `skincare-ai` edge
  function instead. Subcomponents live in `src/components/ai-formulator/`
  (`StepperHeader`, `MstGrid`, `ConfidencePanel`). Nav/link text should
  always read "Skin Analysis (SKYNN AI)" (Header/Footer/About/Products/
  UserDashboard), never bare "AI Formulator" — except genuinely historical
  content (dated newsroom articles, the 2025 roadmap timeline entry in
  About.tsx, past `Announcements.tsx` entries) which must keep the old
  name since it's a factual record of what shipped at the time.
  - **"Advanced" tier naming (2026-09-15)** — the paid/membership tier of
    SKYNN AI's analysis (previously "Advanced Skin Analysis"/"Advanced
    Analysis") is now branded **"Advanced AI Dermatology Report"** across
    `src/pages/SmartRoutines.tsx`, `AdvancedAssessmentCard.tsx`,
    `AnalysisPassPurchaseModal.tsx` and `AnalysisPassesCard.tsx` —
    deliberately "from SKYNN AI" rather than a bare possessive, to avoid
    implying SKYNN AI itself is a dermatologist. The medical-advice FAQ on
    `/routines` was strengthened to explicitly say the report is
    AI-generated, not a clinical diagnosis, precisely because "Dermatology
    Report" reads more clinical than the old name — don't drop that
    disclaimer if this copy is touched again. `/routines`'s hero also
    gained a real, Adobe-Stock-licensed editorial photo
    (`public/images/smart-routines-hero.jpg`, licensed and cropped via the
    Adobe MCP connector, not AI-generated — this environment's Adobe
    connector has no text-to-image tool, only Stock search/license +
    Photoshop-style editing) and the page's duplicate bottom-of-page CTA
    (a second button that just repeated the primary "get your report" CTA)
    was replaced with a distinct "Compare access options" anchor to the
    pricing cards.
  - **`.gradient-text` utility + "flagship AI" visual treatment
    (2026-09-15)** — `src/index.css` gained a `.gradient-text` class
    (same brand gradient stops as the pre-existing `.gradient-border-anim`:
    emerald `#22c55e` → blue `#3b82f6` → purple `#a855f7` → pink
    `#ec4899`), applied deliberately sparingly — one accent phrase per
    view — to mark SKYNN AI as the site's flagship AI feature rather than
    a generic form: the "Smarter care." headline and "SKYNN AI" wordmark
    in `AIFormulator.tsx`'s intro/step-badge, `StepperHeader.tsx`'s
    current-step circle (now a gradient fill instead of a flat primary
    border), `ConfidencePanel.tsx`'s radial completeness ring (via an SVG
    `<linearGradient>` in Recharts' `<defs>`, id
    `skynn-confidence-gradient`) and percentage label, and the "SKYNN AI"
    mentions in `AdvancedAssessmentCard.tsx` and `SmartRoutines.tsx`'s
    hero badge. Homepage `Hero.tsx` got a lighter, Clerk.com-style pass
    instead (hover lift + shadow on the stat cards, a subtle two-tone
    gradient tint on their icon chips, hover scale on the primary CTA) —
    deliberately no full-page color-scheme change, since the base theme
    (`src/index.css` `:root`) is still intentionally monochrome/greyscale
    and a wholesale palette swap wasn't asked for or warranted. Don't add
    more than one gradient-text moment per screen — it's meant to read as
    a rare accent, not a new default text color.
  - **Site-wide design-system pass (2026-09-15, same day follow-up)** —
    on top of the above, a broader Clerk.com-style consistency pass:
    - `--gradient-brand` is now the single CSS variable both `.gradient-text`
      and `.gradient-border-anim` are meant to derive from (`.gradient-text`
      references it directly; `.gradient-border-anim`'s `conic-gradient()`
      still spells the four stops out again in `src/index.css` because
      conic gradients need their own repeated closing stop to loop — that
      duplication is intentional, not drift). A new `.gradient-bg-soft`
      utility blends the same gradient into `--accent` at low opacity for
      "hint of colour" surfaces (the floating bottom nav's active-tab tint).
    - The gradient treatment now also appears on the homepage hero's
      eyebrow pill (`Hero.tsx`, `.gradient-border-anim`) and on
      `Header.tsx`'s `NavBadge` ("NEW"/"BETA" → the brand gradient,
      "Coming Soon" → an amber→orange gradient) — still one clear accent
      per element, not a background-color replacement everywhere.
    - `--shadow-*` (both `:root` and `.dark` in `src/index.css`) were
      rewritten from single-layer box-shadows to a genuine two-layer
      "contact + ambient" stack per Clerk's documented approach — every
      component using the `shadow-*` Tailwind utilities (most of them, via
      the theme's `boxShadow` mapping in `tailwind.config.ts`) picked this
      up automatically; no per-component changes were needed or made. In
      passing, fixed a pre-existing gap where `tailwind.config.ts`'s
      `boxShadow` mapped `2xs`/`xs`/`sm`/`md`/`lg`/`xl`/`2xl` to their CSS
      vars but never mapped bare `shadow` (Tailwind's `DEFAULT` key) to
      `--shadow` — that variable existed in `index.css` but every plain
      `shadow` class in the app (sidebar, several page heroes) was silently
      falling back to Tailwind's built-in default instead. Added
      `DEFAULT: 'var(--shadow)'` so it isn't stranded again.
    - Radii were made consistent at the shared-primitive level rather than
      per-usage: `ui/card.tsx`'s default is now `rounded-2xl` (was
      `rounded-lg`), and `ui/dialog.tsx` / `ui/alert-dialog.tsx` are now
      `sm:rounded-xl` (was `sm:rounded-lg`). `ui/sheet.tsx` was deliberately
      left un-rounded — it's an edge-anchored drawer, not a floating modal,
      and rounding the anchored edge would look wrong. `ui/badge.tsx` /
      `ui/avatar.tsx` were already `rounded-full` and needed no change.
    - Headings get a default `letter-spacing: -0.015em` via a `@layer base`
      rule targeting `h1`–`h4` and `.font-heading` in `src/index.css` —
      lands below Tailwind's `utilities` layer regardless of source-file
      order (layer precedence is set by the `@tailwind base;` /
      `@tailwind utilities;` directive order at the top of the file, not by
      where a given `@layer` block physically sits), so any component with
      an explicit `tracking-*` utility still wins; this just raises the
      *default* for headings that don't specify one.
    - `Header.tsx` gained a new `ScrollProgressBar` component
      (`src/components/ScrollProgressBar.tsx`) — a 2px `--gradient-brand`
      bar absolutely positioned at the fixed header's own bottom edge,
      width driven by `scrollTop / (scrollHeight - clientHeight)`. It's
      `aria-hidden` (purely decorative) and its own component specifically
      so Header.tsx (already large) didn't need its own scroll listener.
    - `FloatingBottomNav.tsx` no longer gates the whole nav behind
      `!!user` — five of its six destinations (Home/News/Stream/Reviews/
      Book) are free public content, so hiding it from anonymous mobile
      visitors worked against the free-acquisition/SEO-discovery product
      principle for most first-time traffic. The last tab now adapts
      instead of the whole bar disappearing: signed in it's "Profile" ->
      `/dashboard`; signed out it's "Sign In" -> opens the existing
      `AuthDialog` in place (never a route to `/dashboard` that would just
      bounce a logged-out visitor back out). Its active-tab tint now uses
      `.gradient-bg-soft` instead of a flat `bg-primary/10`.
  - **Nav gradient accents + search dialog polish (2026-09-15, second
    follow-up)** — extended `.gradient-border-anim` to the rest of
    `Header.tsx`'s nav chrome: every `ExploreCard` in the Explore grid
    (desktop popover and mobile sheet share the one component), plus
    every button that renders a white background with black text in
    light mode — the desktop "Menu"/"Search"/"Account" pills (all
    `variant="outline"`, which is `bg-background` + default foreground —
    that's the literal criterion, not "every outline button sitewide")
    and the mobile sheet's "Create account"/"Sign out" buttons. Buttons
    that are black-bg/white-text (`variant="default"` — "Log In / Sign
    Up", "Sign in", the desktop panel's "Sign Up / Log In") were
    deliberately left alone since they don't match that criterion.
    `outline`-variant buttons need `border-transparent` alongside
    `gradient-border-anim` or the CVA's own `border-input` shows through
    underneath the animated ring — `cn()`'s `tailwind-merge` resolves
    that cleanly since both are the same `border-color` utility group.
    Mobile also gained a compact icon-only SKYNN AI button (same
    `gradient-border-anim` white pill, just `h-9 w-9` with no label) next
    to the search icon in the header's mobile row — previously the whole
    SKYNN AI affordance was `hidden` below the `sm:` breakpoint, i.e.
    invisible on actual phones until you opened the hamburger menu.
    Separately, `ui/command.tsx`'s `CommandDialog` (shared by both
    `SiteSearch.tsx` and `MarketplaceSearch.tsx`) got a real polish pass:
    anchored higher (`top-20`/`sm:top-[15%]`, not dead-center, so it
    reads as a command palette and an on-screen keyboard never covers
    it), `w-[calc(100%-2rem)]` + `rounded-2xl` on mobile instead of the
    generic Dialog's edge-to-edge full-bleed sheet, the default Dialog
    close (X) hidden via `[&>button]:hidden` (it was sitting directly
    over the search input — ESC and the overlay click already close it,
    and ESC is now advertised in a new desktop-only keyboard-hint footer
    row), and `CommandList` given a responsive `max-h-[60vh] sm:max-h-
    [420px]` instead of a flat 300px. While in there, fixed a real
    overflow bug in `SiteSearch.tsx`: several `CommandItem` result rows
    paired a `flex-1 truncate` title span with a `shrink-0 truncate`
    subtitle/reasons span — `shrink-0` on the second span meant it never
    gave up space, so on narrow (mobile) widths the row overflowed the
    dialog instead of truncating. Fixed by adding `min-w-0` to the title
    span (a flex item's implicit `min-width: auto` is what actually
    blocks `truncate` from working, not just the visible width) and
    hiding the secondary subtitle span below `sm:` where there isn't
    room for a title *and* a reason on one line anyway.
  - **Light/dark mode wired up (2026-09-15, third follow-up)** — before
    this, `tailwind.config.ts` had `darkMode: ["class"]` and `index.css`
    had a full `.dark { ... }` variable block, but **nothing in the app
    ever added the `dark` class or wrapped anything in a theme
    provider** — dark mode was unreachable dead CSS in production, and
    there was no toggle anywhere in the UI. Fixed by adding `next-themes`
    (already an installed dependency, previously only imported inside
    `ui/sonner.tsx` for toast styling) as the outermost provider in
    `App.tsx`: `<ThemeProvider attribute="class" defaultTheme="system"
    enableSystem disableTransitionOnChange>`. Visitors now get their
    OS/browser `prefers-color-scheme` automatically with zero action —
    verified by loading fresh pages with Playwright's `colorScheme:
    'dark'`/`'light'` emulation and confirming `<html>` picks up
    `class="dark"` (or not) with no manual toggle click. `src/components/
    ThemeToggle.tsx` is a single Sun/Moon button (`useTheme()`'s
    `resolvedTheme`/`setTheme`) that lets a visitor override the OS
    default; the choice then persists in `localStorage` ("theme") and
    wins over the OS setting on future visits. It's rendered twice: in
    `Header.tsx`'s desktop right cluster (`hidden sm:inline-flex`,
    ghost-variant so it's exempt from the "white-bg/black-text gets
    gradient-border-anim" rule — ghost has no visible background at
    rest) and in the mobile hamburger `Sheet`'s header row next to the
    close button (the persistent mobile top bar was already tight —
    search icon, SKYNN AI icon, hamburger — so the mobile toggle lives
    one tap deeper instead of crowding it further). Known limitation:
    `scripts/prerender.ts` crawls pages with a plain headless browser
    (no forced color scheme) for SEO/social-card snapshots, and
    `main.tsx` uses `createRoot` (not `hydrateRoot`), so a visitor whose
    OS prefers dark will see the prerendered light-mode HTML for an
    instant before client JS mounts and swaps in the correct theme —
    an inherent tradeoff of static-prerendering an SPA, not something
    next-themes' usual "no flash" script-injection trick can fully
    solve here (that trick targets SSR/hydration mismatches, not a
    pre-JS static snapshot). Not worth solving further unless it's
    actually reported as a visible problem.
  - **`docs/SkinLabs-Design-System.pdf`** — a generated, versioned
    snapshot reference of the whole visual design system (brand logo
    usage, color tokens in both modes, the brand gradient and everywhere
    it's used, typography, the shadow/radius scales, core component
    patterns, and the theming setup above), written for onboarding both
    human engineers and other AI coding assistants working on this repo
    without needing to reverse-engineer `index.css`/`tailwind.config.ts`
    from scratch. Every value in it was read directly from the live
    source files at generation time (see its own final "Source Index"
    page for the exact file list) — it is a snapshot, not a second
    source of truth, and **the code always wins** if the two ever
    disagree. Regenerate it (HTML authored by hand, rendered to PDF via
    a headless-Chromium `page.pdf()` call — the generation script itself
    wasn't kept, since it's a one-off, not a build step) after a design-
    system change substantial enough to warrant its own dated bullet in
    this file, not for every minor tweak.
  - **Advanced Dermatology Assessment engine (2026-09-16)** — a new,
    separate backend foundation for a future Claude-powered "Advanced AI
    Dermatology Report", distinct from both the free Starter Analysis above
    and the existing premium tier of the live `skincare-ai` edge function.
    Ships **feature-flagged off** (`skynn_advanced_assessment_config.
    rollout_stage = 'disabled'`) and reachable only at the unlinked route
    `/skynn-ai/advanced` — nothing in existing navigation (Header, Footer,
    `AdvancedAssessmentCard.tsx`, the dashboard) points at it, and it must
    stay that way until a human flips the flag, per the standing "never make
    an unfinished feature appear operational" instruction. Two reasons it's
    off: no dermatologist-approved SKYNN methodology/system prompt exists
    yet (see below), and it hasn't been through a real end-to-end QA pass.
    - **Schema** — `supabase/migrations/20260916130000_advanced_assessment_
      engine_core.sql` (+`...130100_..._seed.sql`, +`..._advisor_fixes.sql`):
      `assessment_definitions` (versioned question library, one JSONB
      `sections` doc per version — same "evolving-shape JSONB column"
      precedent as `skincare_recommendations.result_payload`, not a
      normalised questions table), `assessment_prompt_versions` (the
      PromptRegistry — RLS-enabled with **zero** policies for anon/
      authenticated, so only `service_role` can ever read it; seeded with a
      `1.0.0-placeholder` row, `system_prompt IS NULL`, `is_placeholder =
      true` — no clinical prompt is fabricated anywhere in this feature),
      `skynn_advanced_assessment_config` (the singleton feature-flag row,
      same zero-policy lockdown), `advanced_assessment_evidence` (controlled
      citation catalogue, empty until SkinLabs supplies sourced content),
      `advanced_assessment_sessions`, `advanced_assessment_reports`,
      `advanced_assessment_events`. Session mutations are deliberately NOT
      reachable via a plain client `INSERT`/whole-row `UPDATE` — only a
      column-limited autosave `UPDATE` (`responses`/`current_section_id`/
      `completeness_pct`) plus `SECURITY DEFINER` RPCs
      (`start_advanced_assessment_session`, `save_advanced_assessment_
      progress`, `submit_advanced_assessment_session`, and service-role-only
      `mark_advanced_assessment_processing`/`complete_advanced_assessment_
      session`/`fail_advanced_assessment_session`) — a bare ownership-only
      RLS policy would still let a client write `status = 'completed'` or an
      arbitrary `pass_transaction_id` directly, which this closes off
      structurally. `compute_assessment_completeness()` is the ONLY thing
      `submit_advanced_assessment_session` trusts to gate submission
      (recomputed server-side from the session's own pinned definition +
      actual `responses` every time) — the client-writable `completeness_pct`
      column is a cosmetic progress-bar cache only, never trusted for the
      gate. Reuses existing infra rather than duplicating it: `is_member()`
      for membership, and the **same** `consume_analysis_pass()`/
      `refund_analysis_pass()` pair the existing Advanced AI Dermatology
      Report already uses — an Analysis Pass is consumed exactly once, at
      submission (never at session creation), with an idempotency key
      (`session_id:submission_version`) so a retried submit returns the
      existing report instead of charging or generating twice.
    - **Provider abstraction** — `supabase/functions/_shared/assessment/`:
      `provider.ts` (`AssessmentAIProvider` interface) →
      `claudeProvider.ts` (`ClaudeAssessmentProvider`, the only Anthropic
      implementation so far) — the Anthropic Messages API called directly
      via `fetch` (no SDK dependency, matching this repo's existing
      thin-fetch-wrapper convention for `_shared/ai.ts`'s Lovable Gateway
      equivalent), forcing structured output via a single tool call whose
      `input_schema` mirrors `reportSchema.ts`'s zod schema, with one
      repair retry on a malformed response. Model is
      `SKYNN_ADVANCED_MODEL`-configurable (default `claude-sonnet-5` —
      reconfirm against Anthropic's current model list before activating,
      same caution already given elsewhere in this file for the Gemini
      model id); `ANTHROPIC_API_KEY` and `SKYNN_SYSTEM_PROMPT_VERSION`
      (an operational override to pin a specific prompt version) are the
      other two env vars, neither ever exposed to Vite/client-side env.
      `promptRegistry.ts` loads the active (non-placeholder) prompt via a
      service-role client and throws a safe `not_configured` error
      otherwise — this is what actually enforces the "don't fabricate the
      methodology" boundary at runtime, not just a comment.
      **`AI_GATEWAY_API_KEY` fallback (2026-09-16, same-day follow-up)** —
      `claudeProvider.ts` resolves its transport at call time:
      `ANTHROPIC_API_KEY` wins when set (direct Anthropic Messages API, as
      above); if absent, it falls back to `AI_GATEWAY_API_KEY` — the same
      key already configured as a Vercel project env var for the
      product-review pipeline's Gemini calls (see that section above) —
      routed to Claude through Vercel AI Gateway's OpenAI-compatible chat
      completions endpoint (`https://ai-gateway.vercel.sh/v1/chat/
      completions`, model string `anthropic/<SKYNN_ADVANCED_MODEL>`,
      OpenAI-style forced function-calling in place of Anthropic's native
      tool_use block) rather than a second `AssessmentAIProvider`
      implementation, since it's still Claude either way and the report
      contract stays identical. **Unverified**: this environment has no
      way to set a Supabase edge function secret, so the gateway path has
      never been exercised against a real `AI_GATEWAY_API_KEY` — confirm
      Vercel AI Gateway's exact endpoint/response shape once a human adds
      that secret, the same category of gap already documented for
      `MARKETPLACE_CRON_SECRET`/`GEMINI_API_KEY` elsewhere in this file.
    - **Safety screening** (`_shared/assessment/safety.ts`) — a
      deterministic, non-clinical triage heuristic computed from the
      respondent's own `safety_red_flags` answer only (never from the
      model's output, so a hallucination can't suppress or invent a flag).
      Explicitly documented as NOT dermatologist-approved diagnostic
      criteria — SkinLabs hasn't supplied any yet — kept in application code
      specifically so it can be reviewed/replaced without a migration.
    - **Evidence/compliance** (`_shared/assessment/evidence.ts`,
      `compliance.ts`) — `validateCitedEvidence()` strips any citation id
      the model returns that wasn't in the `advanced_assessment_evidence`
      rows actually given to it (never trusts the model's restatement of an
      allowed citation either — always substitutes the server's own record);
      `scanComplianceFlags()` reuses the exact `FORBIDDEN_DIAGNOSIS_TERMS`
      list from `skincare-ai/index.ts` so the two AI paths can't drift on
      what counts as a named-diagnosis violation.
    - **API** — single action-routed edge function
      `supabase/functions/skynn-advanced-assessment/index.ts` (same
      one-function/JSON-`action` convention as `payfast-payment`/
      `newsroom-sync`): `access`, `create_session`, `get_session`,
      `update_session`, `submit`, `status`, `get_report`, `list_reports`,
      `log_event`. The frontend never talks to `advanced_assessment_*`
      tables/RPCs directly — everything goes through this function, which
      holds both a user-scoped client (RLS-honest, forwards the caller's
      JWT) and a service-role client (prompt/evidence reads, completion/
      failure RPCs). Generation is synchronous within the `submit` request —
      **documented limitation**: this platform has no background worker/
      queue infra, so there's no async job step; the function is structured
      so a future queue-based worker could pick up `generation_status =
      'pending'` reports without a rewrite. Simple per-user daily rate
      limits (10 session creates / 5 submits per 24h) reuse the existing
      count-query pattern from `newsroom-sync`'s daily cap rather than new
      infra.
    - **Frontend contract** — `src/lib/assessment/` (`types.ts`, `client.ts`
      edge-function wrapper, `completeness.ts` — a client-side mirror of the
      SQL completeness function for instant progress-bar UX only, never
      trusted for gating), `src/hooks/use-advanced-assessment.ts`,
      `src/components/advanced-assessment/*` (question renderer, section
      progress, the assess/review/processing/report-reveal flow),
      `src/pages/AdvancedAssessment.tsx` at `/skynn-ai/advanced` (see
      feature-flag note above — deliberately unlinked). `entitlements.ts`
      gained an `"assessment.advanced"` `FeatureKey` on Insider/VIP for
      documentation purposes only — actual access is hybrid (membership OR
      an Analysis Pass, same shape as the existing card), so the real gate
      is always the server-side `get_advanced_assessment_access()` RPC via
      `useAdvancedAssessmentAccess()`, never `hasCapability()` alone.
      `buildRoutineHandoffContext()` in `src/lib/assessment/types.ts` is the
      Smart Routines integration CONTRACT only (section 35) — no write path
      into `use-routine.ts` exists yet, deliberately, to avoid building a
      second routine engine.
    - **"Get started for free" CTA copy (2026-09-16, same-day follow-up)**
      — `AIFormulator.tsx`'s intro-screen primary CTA (rendered both at
      `/skynn-ai` and embedded in the dashboard's "Skin Analysis (SKYNN
      AI)" tab via `FormulatorTab.tsx`) now reads "Start My Analysis"
      instead of "Get started for free" whenever `isMember` (Insider/VIP)
      or `passBalance > 0` (an Explorer/Lite member holding an Analysis
      Pass) — both already resolved in that component for the "Want to go
      deeper?" panel just below it, reused rather than re-fetched. "Get
      started for free" only remains for a visitor who genuinely has
      neither, since telling an already-entitled paying member to "get
      started for free" misrepresents what they're actually doing. This is
      copy-only — `handleStartAnalysis()` and the entitlement/pass-
      consumption logic underneath are unchanged.
    - **Deferred / not yet safe to build**: the actual dermatologist-
      approved SKYNN methodology and system prompt (blocks activation
      entirely — the registry/interface boundary is ready for it); sourced
      `advanced_assessment_evidence` content (table is empty); per-concern
      dynamic sub-forms (v1 asks duration/impact/triggers/progression once
      for the concern set rather than looping per selection); a real
      product-catalogue search for the `product_list` question type
      (currently name-only entries); true async/background generation;
      end-to-end QA with a real (non-placeholder) prompt.
  - **MST (Monk Skin Tone)** — a self-reported, OPTIONAL 1–10 scale
    (`src/data/mstScale.ts`, official Google/Ellis Monk hex values, plus
    `mstBand()` bucketing into light 1-3/medium 4-7/deep 8-10). It is a
    fairness/context signal only, never inferred and never treated as
    diagnostic — see `deriveMstSignal()` in `src/data/formulaResults.ts`
    for the (general, non-fabricated) dermatology guidance it can trigger
    (PIH risk, sunscreen texture) and `supabase/migrations/
    20260907130000_skynn_ai_mst_fields.sql` for its `mst_tone`/
    `mst_source` columns on `skincare_recommendations`.
  - **Grounded recommendations** — `src/lib/skynnProductMatch.ts` picks
    real, SkinLabs-reviewed products from `src/data/reviews.ts` (the same
    pattern as `RoutineBuilder.tsx`) for the starter analysis's AM/PM
    routine and PDF, falling back to generic product-type text rather
    than ever fabricating a product. `matchStats` on the returned
    `GroundedRoutine` records how many of the 4 attempted category
    lookups actually found a product — this feeds the fairness pipeline
    below, don't let it silently drift out of sync with `am`/`pm`.
  - **"Analysis completeness"** (`computeCompleteness()` in
    `formulaResults.ts`, rendered by `ConfidencePanel`) is deliberately an
    INPUT-completeness measure, not a clinical-accuracy or bias-free-
    performance claim — never rename/relabel it into an accuracy score.
  - **Fairness-benchmarking pipeline** (`supabase/migrations/
    20260907140000_skynn_fairness_pipeline.sql`) — append-only,
    no-PII `skynn_fairness_events` table (write via `src/lib/
    skynnFairness.ts`'s `logFairnessEvent()` from the starter path, and
    directly from `supabase/functions/skincare-ai/index.ts` for the live
    AI path, which additionally runs `scanComplianceFlags()` against the
    model's own output for named-diagnosis violations — the one rule
    that's actually checkable without fabricated ground truth). Admin-only
    `skynn_fairness_summary` view aggregates completeness/grounded-match-
    rate/compliance-flag-count per MST band so a gap for e.g. "deep" tones
    surfaces as a real catalogue/prompt gap to fix, not a hidden average.
    No admin UI reads this yet (deliberately — query it directly via SQL
    until there's a concrete reason to build one; don't add a dashboard
    tab speculatively).
- **Auth + membership onboarding redesign (2026-09-16)** — reworked
  `src/components/AuthDialog.tsx` (still the single auth surface app-wide —
  no new `/auth/*` routes were introduced) into a clearer sign-in/sign-up
  experience: a theme-aware SkinLabs® wordmark (`skinlabs-logo-black.svg`
  light / `skinlabs-logo-white.svg` dark, via `next-themes`), a full-screen
  presentation below the `sm:` breakpoint (edge-to-edge, no nested-modal
  feel) and a centered card above it, a "Forgot password?" link, inline
  `role="alert"` error text alongside the existing toasts, and password
  visibility toggles. Magic-link sign-in is disabled (not deleted) via
  `src/lib/auth-flags.ts`'s `AUTH_FLAGS.magicLinkEnabled = false` — flip
  that one flag back on once the project's SMTP delivery issue is
  resolved; `useAuth().signInWithMagicLink()` itself is untouched.
  - **Pending-plan intent** (`src/lib/pendingPlan.ts`) — replaces the
    plain-React-state `pendingAction` that used to live in `Pricing.tsx`
    (lost on refresh or a full-page Google OAuth redirect) with a durable
    `sessionStorage`-backed intent, plus a URL-query-param fallback channel
    (`withPendingPlanParams()`) for a cross-tab email-confirmation click.
    `Pricing.tsx` now runs the pending trial/checkout from a `useEffect`
    keyed on `user` transitioning to signed-in, rather than from
    `AuthDialog`'s `onAuthenticated` callback, so it fires the same way
    whether auth completed in-page or via a full redirect back. This is a
    UX convenience only — it never grants anything itself. The actual
    authority was already in place before this change and was not
    modified: `start_free_trial()` (`supabase/migrations/
    20260907000001_starter_analysis_and_trial_variants.sql`) is
    `SECURITY DEFINER`, re-validates the plan against `pricing_plans`
    server-side, and enforces one trial per account via `trial_used_at`;
    paid checkout prices itself server-side in the `payfast-payment`/`paypal-payment` edge
    function. A tampered `?plan=` or forged `pendingPlan` intent simply
    gets rejected by that RPC/edge function exactly as a stale legitimate
    one would.
  - **`/reset-password`** (`src/pages/ResetPassword.tsx`, new route in
    `App.tsx`) — Supabase's own recovery flow end to end:
    `useAuth().sendPasswordReset()` calls `resetPasswordForEmail()` with
    `redirectTo` pointed here; this page waits for the resulting
    `PASSWORD_RECOVERY` session (supabase-js's `detectSessionInUrl`
    exchanges the recovery token automatically) and calls
    `useAuth().updatePassword()`. No separate token-validation endpoint or
    reset system — an expired/invalid/reused link simply never produces a
    session, which is how the "Link expired" state is detected. Both
    `sendPasswordReset()` and the "check your email" confirmation
    deliberately don't reveal whether the address is registered.
  - **`/admin` gate** (`api/admin-auth.ts`, `src/hooks/use-admin-gate.ts`,
    `src/components/admin/AdminLoginScreen.tsx`) — this project already had
    a real admin system before this change: a genuine Supabase Auth
    account (`admin@skinlabs.co.za`) holding the `admin` role via
    `has_role()`/`user_roles`, which every admin-facing RLS policy is
    keyed to. That was reused as-is, not duplicated. What's new is one
    additional, dedicated credential gate in front of it: `api/admin-auth.ts`
    (same HMAC-cookie pattern as the pre-existing `api/marketplace-auth.ts`)
    checks a submitted password against the Vercel-only `ADMIN_PASSWORD`
    secret with a timing-safe compare, sets a short-lived (12h)
    `HttpOnly`/`SameSite=Lax`/`Secure`-in-prod `skinlabs_admin_gate` cookie
    scoped to `/admin` on success, and — using the `SUPABASE_SERVICE_ROLE_KEY`
    already required by `api/product-review-sync.ts` — calls GoTrue's
    `admin/generate_link` endpoint for that one fixed account and returns
    the resulting one-time `token_hash` (never the password, never a
    standing secret). The browser exchanges that for a real session via
    `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` — no email
    is sent, so this is unaffected by the SMTP issue disabling consumer
    magic-link above. `AdminDashboard.tsx`'s own `has_role` check and every
    RLS policy keep working completely unmodified; if
    `SUPABASE_SERVICE_ROLE_KEY` isn't configured, the password gate still
    passes but `tokenHash` comes back `null`, and `AdminDashboard.tsx`
    falls back to a minimal inline Supabase sign-in for that one account
    (not the consumer `AuthDialog` — the admin never goes through the
    normal membership onboarding flow) so `has_role` can still resolve.
    `ADMIN_PASSWORD` is never returned in any response, logged, or
    embedded client-side — verified by unit-testing `api/admin-auth.ts`'s
    handler directly (missing-secret, wrong-password, correct-password,
    cookie-GET, invalid-cookie-GET and DELETE/logout paths all checked).
    While wiring this in, also fixed a real pre-existing bug in
    `AdminDashboard.tsx`: its `useEffect` only ever called `checkAdmin()`
    (which resolves both `loading` and `isAdmin`) `if (user)` — a
    signed-out visitor hitting `/admin` spun on "Checking access" forever
    instead of ever reaching "Access Denied", because nothing resolved
    `isAdmin` away from `null`. Now resolves both to `false` immediately
    once `useAuth()` confirms there's no session.
  - New analytics events (`src/lib/analytics-events.ts`):
    `membership_plan_selected`, `auth_started`, `signin_completed`,
    `password_reset_started`, `password_reset_completed`,
    `trial_activation_started`, `trial_activation_failed`,
    `dashboard_entered`, `admin_login_success`, `admin_login_failure` —
    fired through the same existing `trackConversionEvent()`/Vercel
    Analytics pipeline as every other conversion event in this file, not a
    new analytics platform.
- **Monetisation** — DB-driven, not hardcoded: `pricing_plans`,
  `credit_packs`, `pricing_experiment_variants` tables; `src/lib/
  pricing-config.ts` does variant bucketing; `payfast-payment`/`paypal-payment` edge
  function is DB-driven. Pricing page and dashboard read plan config from
  the DB, not from constants in code. `credit_packs` includes both
  `single_1` (R25, one "Analysis Pass") and `starter_3` (R59, 3 passes) —
  `single_1` already existed on the live project with this exact
  price/credits (name "1 Analysis Pass", not "Analysis Pass") before
  `20260908150000_user_dashboard_redesign.sql`'s `ON CONFLICT DO NOTHING`
  insert ran, so the row currently reads the pre-existing name; harmless
  functionally, but don't be surprised the display name doesn't match the
  migration file. Every verified charge is also logged to `payment_transactions` by the
  webhook (idempotent on `reference`), which is what the dashboard's
  Billing tab reads for transaction history and downloadable receipts
  (`src/lib/generateInvoicePdf.ts` — a real receipt from that row, never a
  fabricated invoicing system).
  - **Paystack removed, replaced by PayFast + PayPal (2026-09-18)** —
    Paystack is fully gone: `supabase/functions/paystack-payment/` deleted,
    `src/lib/paystack.ts` deleted. `payment_transactions` gained
    `gateway`/`currency`/`amount_original` columns (migration
    `20260918010000_payment_gateway_migration.sql`) — every historical row
    was backfilled `gateway='paystack'` for accuracy, but no code writes
    that value going forward. Charge-resolution (server-side price lookup
    from `pricing_plans`/`credit_packs`/`founding_member_offers`) and
    entitlement-granting (the "a verified charge turns into a membership/
    Analysis Passes/founding-member slot" logic) both used to live
    duplicated inline in `paystack-payment`'s webhook handler; extracted
    into `supabase/functions/_shared/email/` 's sibling,
    `supabase/functions/_shared/payments/` (`resolveCharge.ts`,
    `completePurchase.ts`, `failPurchase.ts`, `authedUser.ts`, `fx.ts`), so
    the two new gateways can't drift on what a plan costs or what a
    successful charge actually grants.
    - **`payfast-payment`** — a full rewrite, not a patch: the version this
      replaced predated the DB-driven pricing architecture entirely
      (hardcoded R99/R299 amounts, a standalone `preorders` table for a
      since-superseded physical-product line) and was never wired into any
      frontend checkout flow. The rewrite implements PayFast's full
      documented ITN validation — signature check AND a server-to-server
      POST back to PayFast's own `/eng/query/validate` endpoint requiring
      the literal response `"VALID"` — deliberately not the source-IP
      allowlist step (that list changes over time and isn't reliable
      behind arbitrary hosting infra); the signature + validate round-trip
      is what most production PayFast integrations rely on regardless.
      ZAR-native, no currency conversion. Defaults to PayFast's sandbox
      host (`PAYFAST_MODE=live` required for real charges — same
      conservative-default philosophy as `GEMINI_MODEL`/quota placeholders
      elsewhere in this file). The historical `preorders` table read path
      (Admin Dashboard, `UserDashboard.tsx`'s own "Pre-Orders" tab) is
      untouched — only the now-superseded *write* path (hardcoded pricing,
      unreachable from any current UI) was dropped.
    - **`paypal-payment`** — new, built from scratch (no PayPal code
      existed anywhere in this repo before). PayPal has no ZAR-native
      settlement path this environment can confirm one way or the other
      for a South African merchant account, so charges are placed in USD,
      converted from the ZAR list price via `marketplace_fx_rates` (the
      same table OpenHaus already uses for multi-currency display) — a
      reasoned safe default, not a verified fact about PayPal's actual
      South African merchant support. Server-side Orders v2 flow:
      `initialize` creates an order and parks its metadata in the new
      `payment_checkout_intents` table (PayPal's own `custom_id` field is
      capped at 127 characters — too small for a JSON metadata blob, unlike
      PayFast's 255-character `custom_str1`, which round-trips metadata
      directly); `capture` (called by the frontend once PayPal redirects
      back) does the actual server-side capture call and grants the
      entitlement — never trusting a client-side "it worked". A registered
      PayPal webhook (`?webhook=true`, signature-verified via PayPal's
      `/v1/notifications/verify-webhook-signature`) is a crash-safety
      backstop for the gap between "PayPal accepted the capture" and "our
      own DB write completed" — idempotent on `reference` (the capture id),
      so both paths firing is safe. Defaults to PayPal's sandbox API
      (`PAYPAL_ENV=live` required for real charges). `payment_checkout_intents`
      rows older than 24h are swept by a daily cron
      (`payment-checkout-intents-cleanup`) — abandoned checkouts (order
      created, never captured) shouldn't accumulate forever.
    - **Frontend** — `src/lib/paystack.ts` → `src/lib/payments.ts`
      (gateway-parameterized: `startCheckout`/`startCreditPackCheckout`/
      `startFoundingMemberCheckout` all take a `PaymentGateway` first arg).
      New `src/components/PaymentGatewayDialog.tsx` (PayFast vs PayPal
      picker) is the one place gateway choice happens — wired into
      `Pricing.tsx` (plan subscribe, credit packs, founding-member offer),
      `SubscriptionPaywallModal.tsx`, `AnalysisPassPurchaseModal.tsx` and
      `BillingTab.tsx`'s Analysis Pass purchases. Gateway choice isn't
      persisted through an unauthenticated visitor's sign-up redirect
      (`src/lib/pendingPlan.ts` only ever stored plan/interval/variant) —
      on resume they pick a gateway again via the same dialog, a small,
      deliberate UX tradeoff rather than extending that persistence schema.
      `UserDashboard.tsx`'s existing "wait for the payment to land" poll
      (unique per purchase type: subscription_status / founding_member /
      AI-credit balance) needed one addition for PayPal specifically: it
      now also calls `capturePendingPaypalOrder()` on the same
      `?payment=success` return trip, since PayFast activates via its own
      independent server-to-server ITN but nothing grants a PayPal
      entitlement until the frontend's return trip triggers the capture
      call — the poll alone would just wait forever for an event nothing
      had triggered.
    - **Known gaps**: `PAYFAST_MERCHANT_ID`/`PAYFAST_MERCHANT_KEY`/
      `PAYFAST_PASSPHRASE`/`PAYPAL_CLIENT_ID`/`PAYPAL_CLIENT_SECRET`/
      `PAYPAL_WEBHOOK_ID` are Supabase Edge Function secrets no tool in
      this environment can set (same documented-gap pattern as
      `MARKETPLACE_CRON_SECRET` elsewhere in this file) — both functions
      run in their respective sandbox modes until a human sets these plus
      `PAYFAST_MODE=live`/`PAYPAL_ENV=live`. Neither gateway has been
      exercised against a real sandbox or live account from this
      environment (no credentials to test with) — the ITN/webhook
      signature-verification code paths are implemented per each
      provider's own documented contract but unverified end-to-end.
- **Email & lifecycle automation** (2026-09-16, extended 2026-09-19) —
  full design/inventory doc: **`docs/email-automation-system.md`** (read
  that first before touching anything here — this bullet is a pointer,
  not a substitute). Business-event → outbox → Resend pipeline:
  `email_events`/`email_outbox`/`email_delivery_events` tables,
  `SECURITY DEFINER` RPCs (`enqueue_email`/`enqueue_email_event`/
  `enqueue_email_job`/`claim_pending_email_jobs`/`complete_email_job`/
  `fail_email_job`/`cancel_email_job`), a `supabase/functions/email-
  processor` cron (every minute) that claims jobs, runs a per-template
  send-time guard, renders from the in-code template registry
  (`supabase/functions/_shared/email/templates/`), and calls the
  pre-existing `send-email` function (now service-role-only, was
  previously callable with any authenticated user's JWT — tightened as
  part of this work) — `email-webhooks` logs Resend delivery events.
  Covers auth/trial/membership/billing/SKYNN/account-lifecycle/forms/
  admin-alert templates, all idempotent via `UNIQUE idempotency_key`
  columns end to end.
  - **Marketing consent + weekly newsletter digest + membership
    cancellation email (2026-09-19)** — `profiles` gained
    `marketing_consent`/`marketing_consent_at`/
    `marketing_unsubscribe_token` (genuine opt-in, unchecked by default
    on `AuthDialog.tsx`'s sign-up checkbox, never inferred). New public
    `supabase/functions/email-unsubscribe` (RFC 8058 one-click
    unsubscribe: `List-Unsubscribe`/`List-Unsubscribe-Post` headers on
    every `MARKETING`-category send, GET → branded confirmation page,
    POST → mail-client one-click path) — deliberately no follow-up
    unsubscribe-confirmation *email*, since that defeats the point.
    `enqueue_weekly_newsletter_digest()` (plain SQL function + Monday
    07:00 UTC `pg_cron` job, matching the existing
    `enqueue_trial_expiring_events()` precedent rather than a new edge
    function) sources a real weekly digest from `news_articles` (top 3 by
    views), `ai_generated_product_reviews` (top 3 by score) and one
    active row from the new admin-authored `newsletter_offers` table —
    skips the send entirely if all three are empty, never fabricates
    content. The pre-existing `cancel_subscription()` RPC (already wired
    to a real "Cancel membership" button in `BillingTab.tsx`) now
    enqueues a `MEMBERSHIP_CANCELLED` email on success. **Bug fixed while
    wiring this in**: `cancel_subscription()` and the new
    `unsubscribe_marketing()` both ran `PERFORM set_config(
    'app.privileged_write', 'off', true)` immediately after their
    `UPDATE`, which silently clobbers Postgres's `FOUND` variable
    (`set_config()` always "finds" one row) — `RETURN FOUND` was always
    `true` regardless of whether the `UPDATE` matched anything. Harmless
    in `cancel_subscription()` before today (nothing checked its return
    value), consequential now that `enqueue_email()` is gated on it.
    Fixed by capturing `FOUND` into a local variable immediately after
    the `UPDATE`, before any later statement can overwrite it — this
    `PERFORM set_config(...)` -after- a-row-mutating-statement pattern is
    worth checking for in any future `SECURITY DEFINER` function that
    both uses the `app.privileged_write` escape hatch and relies on
    `FOUND`.
- **User dashboard** (`src/pages/UserDashboard.tsx`,
  `src/components/dashboard/*`) — tab-based member area:
  Home/Profile/Skin Analysis/Routine/Skin Journey/Billing/Inbox/Security/
  Account, with `?tab=` synced to the URL so notifications and emails can
  deep-link into a specific tab. "Profile strength" (`src/lib/
  profileStrength.ts`, shown as a ring on Home) is a broader,
  encouragement-only completeness score across optional fields (phone,
  address, allergies, routine time) — distinct from the stricter, RLS-
  enforced `is_profile_complete()`/`useProfileComplete()` gate used for
  commenting and the AI Formulator; don't conflate the two. The routine
  tracker (`routine_steps`/`routine_checkins` tables, `use-routine.ts`) is
  user-authored (no fabricated products) with a simple daily-completion
  streak. The inbox (`notifications` table) is populated only by real
  server-side triggers (a new AI analysis, a credit grant, a plan change —
  see `20260908150000_user_dashboard_redesign.sql`, hardened in
  `20260908160000_dashboard_redesign_hardening.sql` per the Supabase
  advisors: RLS policies use `(select auth.uid())`, and the trigger
  functions are explicitly revoked from `anon`/`authenticated` since a
  bare `CREATE OR REPLACE FUNCTION` doesn't carry forward an earlier
  `REVOKE`), never fabricated
  client-side; dermatologist messaging is a genuinely unshipped feature and
  is labelled "Coming soon" with a `feature_waitlist` opt-in rather than
  any working-looking chat UI. Temporary deactivation is a reversible
  `deactivate_account()`/`reactivate_account()` RPC pair; permanent
  deletion goes through the `account-delete` edge function (only the
  service-role admin API can remove an `auth.users` row) and cascades via
  `ON DELETE CASCADE` through every user-owned table. Data export
  (`src/lib/generateAccountDataPdf.ts`) is a client-side PDF built from the
  same reads already used to render the dashboard — no separate export
  pipeline.
- **Skincare intelligence database** — normalized schema (brands,
  products, product_variants, product_versions, ingredients,
  product_ingredients, retailers, retailer_products, product_prices
  (append-only price history), reviews, etc.) meant to eventually power
  reviews, AI Skin Analysis, recommendations, ingredient analysis, Shelf
  Showdowns, Spotlight, climate-fit scoring, SEO pages, price
  intelligence, and future B2B APIs. Every fact table carries provenance
  (source_url/source_type/source_date/verification_status/verified_by/
  confidence/last_verified_at) and a data_quality_status
  (unverified/partially_verified/verified/deprecated). Full docs,
  entity list, and example queries: **`supabase/SCHEMA.md`**. Admin
  verification queue lives in the "Data Quality" tab of
  `src/pages/AdminDashboard.tsx`. Seed ETL: `scripts/seed-skincare-
  intelligence.ts` (imports real data from `src/data/reviews.ts` only —
  never fabricates).
- **Ingredients Intelligence Layer** (`/ingredients`, `/ingredients/:slug`,
  `/ingredients/checker`) — public, free, SEO-indexed directory/detail/
  checker built on the `ingredients`/`ingredient_concerns`/
  `ingredient_interactions` tables above, extended (never duplicated) by
  migrations `20260913080000_ingredients_intelligence_extensions.sql`
  (adds `ingredients.category`, a new `ingredient_aliases` table,
  `ingredient_interactions.explanation`/`usage_guidance`/
  `verification_status`/`verified_by`/`last_verified_at`, a `'compatible'`
  interaction-type enum value for myth-debunking, and three RPCs —
  `get_ingredient_interaction`, `search_ingredients`,
  `get_routine_conflicts`) and `20260913081000_ingredients_intelligence_
  curated_seed.sql` (category backfill, real aliases, real
  ingredient_concerns mappings, ~18 real sourced ingredient_interactions
  citing DermNet NZ / JAAD Pinnell et al. 2004 / dermnetnz.org). New
  interaction rows go through the same admin Data Quality verification
  queue as everything else (extended in `AdminDashboard.tsx`).
  - **Content population + ongoing weekly growth pipeline (2026-09-22)** —
    the 128-ingredient catalogue above shipped with every row a thin stub
    (only slug/inci_name/common_name/source_type/verification_status
    populated — `description`, `function_summary`,
    `typical_concentration_range`, `evidence_level`, `irritancy_risk`,
    `pregnancy_safe` were NULL for all 128). Two real bugs were found and
    fixed while wiring up rich content: (1) both ingredient detail pages
    (`src/pages/IngredientDetail.tsx` and its SSR twin
    `src/routes/ingredients.$slug.tsx` — **these two files duplicate the
    same four-query fan-out line-for-line and must be edited together**,
    per that route's own header comment) had two silent-content-loss
    display bugs — "What does it do?" required `function_summary` AND
    `description` both set, and "How to use" ignored `formulation_notes`
    entirely unless `typical_concentration_range` was also set; (2)
    `formulation_notes` was referenced by both pages from the start but
    the column never actually existed on `ingredients` — added via
    `20260922003514_ingredients_formulation_notes_column.sql` rather than
    removing the reference, since the content pipeline needs it. New
    `ingredient_sources` table (migrations `20260921200507_...`/
    `20260921200517_...`) gives real multi-citation support — every prior
    fact table had only one flat `source_url` column, which can't hold the
    2-4 real citations a rich profile needs; `IngredientDetail.tsx`/
    `ingredients.$slug.tsx` now prefer `ingredient_sources` rows over the
    legacy single `source_url` fallback.
    Content is populated by real per-ingredient research (PubMed +
    DermNet NZ via Firecrawl, never fabricated — see the worked example in
    `supabase/migrations/20260922020000_ingredient_content_batch_01.sql`),
    landing as `verification_status = 'partially_verified'` — **never**
    `'verified'`, which stays human-only via the admin Data Quality queue.
    A generic "Complex" stub name (not a real singular compound) or a real
    ingredient with genuinely no relevant literature found gets logged to
    a skip list rather than fabricated content — see
    `supabase/INGREDIENT_CONTENT_STATUS.md`'s "Track A skip list".
    This is now a **permanent, unbounded** growth process, not a
    one-time catch-up to a fixed number: two self-bound scheduled Routines
    drive it — a temporary catch-up burst (`trig_013mJnTVKGVFgQUMbL98G8TV`,
    ~every 2h, self-disables once the original 128 are enriched and the
    long-pending product-catalogue seed — see `SEED_MIGRATION_STATUS.md`
    — reaches 160/160) and a **permanent weekly pipeline**
    (`trig_012CnJXfuEkZxbUMwdfTBQg2`, Tuesdays 06:00 SAST, no end date,
    never self-disables) that adds 25+ new ingredients every week from the
    living candidate list `supabase/INGREDIENT_EXPANSION_CANDIDATES.md`
    (self-extending — a firing that runs low on unprocessed candidates
    researches and appends more before continuing) plus a
    `last_verified_at`-oldest-first refresh rotation over already-published
    ingredients. Full resumable state, live-verified counts and the
    append-only batch log live in `supabase/INGREDIENT_CONTENT_STATUS.md` —
    read that file first before touching this system again, the same way
    `SEED_MIGRATION_STATUS.md` already works for the product catalogue.
  - **Platform-wide internal linking (2026-09-22)** — the Ingredients
    layer was previously an island; six real integration points now link
    into it, all gated on a **confident exact match only** (never a fuzzy
    guess that could mislink) via the new shared resolver
    `src/lib/resolveIngredientSlug.ts` (wraps the same alias-aware
    `search_ingredients` RPC the checker's combobox already used) — an
    unresolved free-text name simply stays plain, unlinked text:
    Conflict Matcher flag cards now link each ingredient name to its
    profile (`src/lib/conflictMatcher.ts` gained `slug` on
    `RoutineIngredient`); ingredient detail pages gained a reverse-direction
    CTA to `/dashboard?tab=routine` (Insider/VIP) or `/skynn-ai`
    (everyone else — the SSR route gets one non-personalized CTA instead,
    since it has no per-user session boundary by design); product review
    `key_ingredients` pills, SKYNN AI Starter's `OpenHausShopLinks` widget,
    and the still-feature-flagged-off Advanced Dermatology Report
    (`ReportView.tsx` — linking here doesn't reactivate that feature, it
    only fixes rendering for whenever a human eventually flips
    `skynn_advanced_assessment_config.rollout_stage`) all resolve and link
    their ingredient mentions the same way. Separately, `profiles.allergies`
    (free text, existed since July, previously only fed a profile-
    completeness score) is now cross-referenced via
    `src/hooks/use-allergy-flags.ts` — a loose case-insensitive substring
    match (these are informal entries like "nut oils", not curated INCI
    names) that surfaces a non-blocking `AllergyCautionNote` ("worth
    discussing with a dermatologist") on ingredient pages and in the
    Conflict Matcher panel when a routine ingredient matches — advisory
    only, a miss is deliberately safer than a false "all clear."
  - **Active Ingredient Conflict Matcher** — Glow Insider & VIP exclusive
    (`"routine.conflict_matcher"` in `LADDER_CAPABILITIES.insider`/`.vip`,
    `src/lib/entitlements.ts` — both the `FeatureKey` union entry AND the
    ladder-array membership are required for the gate to actually pass;
    it's easy to add only the former and ship a feature nobody can reach).
    `src/lib/conflictMatcher.ts` resolves a member's **SKYNN AI generated
    routine only** (`GroundedRoutine.am`/`.pm` from
    `src/lib/skynnProductMatch.ts` — real `ProductReview` picks, `.id` ==
    `products.slug`) through `product_ingredients` (current
    `product_versions` only) to real `ingredients`, then calls
    `get_routine_conflicts` for every pairwise flag/synergy — never an LLM
    guess, and a pair with no seeded row simply produces nothing rather
    than being inferred. Deliberately does **not** scan the free-text
    manual dashboard Routine tracker (`use-routine.ts`), which has no
    product linkage to resolve ingredients from. `deriveSeasonalGuidance()`
    is pure, category-keyed, general non-fabricated seasonal/SPF guidance —
    same precedent as `deriveMstSignal()` in `formulaResults.ts`. Rendered
    via `ConflictMatcherPanel.tsx` inside `SavedAnalysisCard.tsx`, gated by
    `FeatureGate`. Unit tests: `src/lib/__tests__/conflictMatcher.test.ts`.
- **Product review pipeline** (`api/product-review-sync.ts`) — four clean
  roles: **Firecrawl = researcher** (finds/fetches real source pages),
  **Gemini = analyst + writer** (turns a source into a scored, grounded
  verdict, never inventing facts beyond it), **Supabase = memory +
  orchestration + publication** (dedup, research cache, quota bookkeeping,
  storage), **SkinLabs frontend = editorial presentation** (ReviewsGrid/
  ProductReview/SiteSearch just render whatever lands in
  `ai_generated_product_reviews`, with zero pipeline-specific UI code).
  Generates up to `DAILY_REVIEW_CAP` (3/day) grounded SA-context product
  reviews (70% South African brands, 30% global-available-in-SA, disclosed
  sponsored placements like Timeless Skincare), replacing the old
  newsroom-sync (Daily Skinny) auto-generation cron (that edge function and
  `/briefings` both still exist and can still be triggered manually — only
  its automatic daily pg_cron schedule was removed, see `supabase/
  migrations/20260913020100_unschedule_newsroom_sync_cron.sql`). Runs as a
  **Vercel Cron** (`vercel.json`'s `crons`, 07:00 UTC = 09:00 SAST daily),
  not a Supabase edge function, specifically because it needs
  `GEMINI_API_KEY` from Vercel's own project environment variables — a
  deliberate product decision, not an accident of convenience. Sources
  candidates from already-verified OpenHaus `marketplace_products` rows
  (no Firecrawl needed) plus Firecrawl-researched pages from Faithful to
  Nature's facial-skincare category and named SA/global brand sites (Geve,
  Orobaa, Kloom, Timeless), capped at `MAX_FIRECRAWL_SOURCES_PER_RUN` (5)
  real Firecrawl network calls per run. Writes to
  `public.ai_generated_product_reviews` (public SELECT, service_role write
  only), which `ReviewsGrid.tsx`, `ProductReview.tsx` and `SiteSearch.tsx`
  all merge in alongside the static `src/data/reviews.ts` catalogue via
  `src/hooks/use-generated-reviews.ts` — so a new day's reviews appear on
  `/reviews` with no code deploy.
  - **Research cache** (`public.pipeline_source_cache`, service-role only,
    migration `20260913040000_pipeline_cache_and_quota.sql`) — every real
    Firecrawl result is cached by source (a stable URL for the FTN scrape,
    a `search:<host>` key for the query-based brand-site searches) for
    `SOURCE_CACHE_TTL_MS` (3 days) before being fetched fresh again. A
    cache hit costs nothing against the per-run Firecrawl cap or the daily
    quota below — this is what actually keeps repeat daily runs against
    the same handful of listing pages cheap.
  - **Quota monitor** (`public.pipeline_api_usage`, same migration) — every
    real Firecrawl/Gemini call is logged here, and checked against
    `FIRECRAWL_DAILY_LIMIT` (20), `GEMINI_DAILY_LIMIT` (100) and
    `GEMINI_PER_MINUTE_LIMIT` (10) *before* the next call, so a free-tier
    ceiling is respected proactively rather than discovered as a run
    failure. All three are env-var overridable and are conservative
    placeholders, **not a confirmed reading of either provider's actual
    plan for this account** — nothing in this environment can check that
    live, so tune them against the real Firecrawl/Google AI Studio quota
    pages if they turn out to be wrong in either direction.
  - **Requires `GEMINI_API_KEY`, `FIRECRAWL_API_KEY`,
    `SUPABASE_SERVICE_ROLE_KEY` and `CRON_SECRET` as Vercel project
    environment variables** — none of these can be set from this codebase
    or from any tool available to Claude Code in this environment, so the
    function 401s/500s with a clear "not configured" message until a human
    adds them in the Vercel dashboard (same category of manual step as the
    already-documented `MARKETPLACE_CRON_SECRET` gap on the Supabase side
    below). `GEMINI_MODEL` defaults to `gemini-3.6-flash` — `gemini-2.0-
    flash` was retired by Google, confirmed live via a 404 naming
    `gemini-3.6-flash` as the replacement during this pipeline's first
    real end-to-end test (2026-09-13).
  - The first 10 reviews (ids prefixed `aigen-`, `generated_by =
    'claude-manual-seed'`) were hand-seeded by Claude during pipeline setup
    (2026-09-13) to test the merge end-to-end — real, Firecrawl/WebFetch-
    sourced products, not run through the live Gemini pipeline, and
    distinguishable from future real pipeline output by that `generated_by`
    value.
- **Spotlight editions** (`public.spotlight_editions` table,
  `src/hooks/use-spotlight-edition.ts`) — tracks Spotlight's edition label
  and methodology version live (seeded from the prior hardcoded
  `SPOTLIGHT_EDITION_MONTH`/`SPOTLIGHT_METHODOLOGY_VERSION` constants in
  `src/data/spotlight.ts`, which now only serve as an offline fallback).
  The product-review pipeline bumps this every 25 published reviews
  (static + generated combined) — new edition label, incremented minor
  methodology version, and a real archive row (`SpotlightArchive.tsx` now
  lists genuine past editions instead of its old "we don't have an archive
  yet" placeholder). Deliberately mechanical-only: the hand-written brand
  ranking narrative (`brandEditorial` in `spotlight.ts` — positioning
  statements, "SkinLabs take", etc.) is **not** touched by this and stays
  human-curated, so a Gemini-generated review can never grow into an
  unreviewed editorial opinion about a brand. A brand introduced only via
  generated reviews simply surfaces under the existing "new-on-the-radar"
  tier (real computed scores, no narrative) until an editor gives it a
  proper `brandEditorial` entry.
- **OpenHaus marketplace** (`/marketplace/*`, `src/pages/marketplace/`) —
  SkinLabs' in-app skincare marketplace, deliberately its own schema
  (`marketplace_brands`/`marketplace_products`/`marketplace_product_images`/
  `marketplace_product_ratings` [external]/`marketplace_product_user_ratings`
  [internal]/`marketplace_cart_items`/`marketplace_fx_rates`/
  `marketplace_skinlabs_picks`/`marketplace_price_sync_log`, migration
  `20260912000000_openhaus_marketplace_core.sql`) rather than folded into
  the editorial skincare-intelligence tables above, cross-linked only in
  two narrow places: `src/lib/marketplaceCrossLink.ts` (SKYNN AI grounded
  recommendations → "Shop on OpenHaus") and a "Sponsored"-badged link on
  `ProductReview.tsx`. Live-seeded with 84 real products (Lelive 21/Esse
  17/SKOON 26/Standard Beauty 20) transcribed from a Faithful to Nature
  wholesale catalog into `src/data/marketplace/ftn-catalog.ts`, with
  rewritten (non-copy-pasted) descriptions/tags in `src/data/marketplace/
  tags/*.ts` and Firecrawl-sourced, URL-verified image sets in
  `src/data/marketplace/tags/images-*.ts` — `scripts/seed-openhaus-
  marketplace.ts` joins these into `supabase/migrations/
  20260912010000_openhaus_marketplace_seed.sql` (idempotent upserts,
  applied and verified live: 84 products / 220 images / 4 brands via
  direct REST check). Pricing is `computeMarkedUpPrice()` (`src/lib/
  marketplace/pricing.ts`, also duplicated into the edge function below
  with a "keep in sync" comment since edge functions can't cleanly share
  a module with the Vite app): source ZAR price × 1.04, charm-rounded up
  to end in `.99`. Product images reference the verified FTN CDN URLs
  directly rather than being re-hosted into the (provisioned but not yet
  used) `openhaus-product-images` storage bucket — a deliberate
  simplification since this environment has no service-role key to
  upload with; fast-follow if re-hosting is ever needed. Ratings are
  dual and never blended: `marketplace_product_ratings` is
  externally-sourced (currently empty — the FTN wholesale catalog PDF
  had no ratings data, confirmed by re-rendering its pages, so nothing
  was fabricated there) shown with a source-crediting tooltip, separate
  from `marketplace_product_user_ratings` (SkinLabs' own signed-in-user
  1-5 star ratings, aggregated by the `marketplace_product_internal_
  rating_summary` view). Cart is `CartContext.tsx` (localStorage for
  guests, synced to `marketplace_cart_items` on sign-in) and currency
  display is `CurrencyContext.tsx` reading `marketplace_fx_rates`; both
  are display/local-storage layers only — ZAR stays canonical. Three
  edge functions keep the catalogue live: `openhaus-fx-sync` (Frankfurter.
  app rates, every 6h), `openhaus-picks-rotation` (weekly "SkinLabs
  Picks" diversity-favouring rotation, Mondays 00:00 SAST), and
  `openhaus-price-sync` (re-parses each product's FTN page JSON-LD for
  price drift, daily) — all three deployed and pg_cron-scheduled, but
  **the `MARKETPLACE_CRON_SECRET` project secret these cron jobs
  authenticate with has not been set** (no tool in this environment can
  set a Supabase project secret) — until a human runs `supabase secrets
  set MARKETPLACE_CRON_SECRET=<value>` (the value used in the cron job
  definitions) matching what's embedded in the `openhaus_fx_sync_cron`/
  `openhaus_picks_rotation_cron`/`openhaus_price_sync_cron` pg_cron jobs,
  scheduled runs will 401; an admin JWT still works as a manual-trigger
  fallback. `openhaus-price-sync` is also untested against a real FTN
  product page in production — FTN sits behind a Cloudflare bot
  challenge that blocks this sandbox's outbound fetches (confirmed
  browser-UA curl requests succeed, bare/HEAD requests don't), so whether
  Supabase's edge runtime gets a cleaner path is unverified.
- **The Skin Deep podcast** — episode content is a hardcoded array in
  `src/data/podcast.ts` (no DB-backed episode table); cover art lives in
  `public/podcast/`. `/podcast` (hub, `PodcastPage.tsx`) and
  `/podcast/:slug` (`EpisodePage.tsx`) both read from it, plus the
  homepage teaser (`PodcastSection.tsx`). New episodes publish **every
  Friday at 12:00 SAST** (`getNextEpisodeDate()`) — this replaced an
  earlier "last Friday of the month" cadence on 2026-09-13. Engagement
  (play/like/share counts, `usePodcastEngagement` +
  `PodcastEngagementBar.tsx`) follows the same seed-plus-localStorage
  pattern used elsewhere (briefings' `view_count`): each episode carries
  a deterministic `seedPlays`/`seedLikes`/`seedShares` baseline, with
  real increments in localStorage and best-effort Supabase writes to
  `podcast_plays`/`podcast_likes`/`podcast_shares` for cross-device sync
  — none of these are a literal live global counter. `podcast_plays`
  (migration `20260820000000_create_podcast_plays_table.sql`) shipped
  with RLS enabled but **no INSERT policy at all** (it ends mid-comment),
  so every play write 42501'd silently until
  `20260913070000_fix_podcast_plays_insert_policy.sql` fixed it;
  `podcast_likes` was referenced in `use-podcast-engagement.ts` from the
  start but never had a migration until
  `20260913071000_podcast_likes_and_shares.sql` (which also added
  `podcast_shares`). If engagement writes start failing again, check for
  exactly this pattern (RLS on, policy missing) before assuming a GRANT
  problem — this project's `public` schema has `ALTER DEFAULT
  PRIVILEGES ... GRANT ALL ON TABLES TO anon, authenticated` already set,
  so RLS policies (not GRANTs) are almost always the real gate here.
  **Episodes 1-4's real audio does not match what was originally written
  for them** — confirmed 2026-09-13 by actually transcribing the four
  `public/epNskinlabs.mp3` files (Adobe's `media_summarize` MCP tool has
  no working poll/status path in this headless CLI environment — every
  call starts a fresh job rather than checking an existing one — so the
  practical route was local: `apt-get install ffmpeg`, `ffmpeg` to 16kHz
  mono WAV, then Python `vosk` with the `vosk-model-en-us-0.22-lgraph`
  model). All four are a generic, non-SA-specific two-host "AI deep dive"
  style recording (think NotebookLM), not scripted SkinLabs-specific
  audio — e.g. episode 1 ("Weird Skincare") is actually about the beef
  tallow trend, not snail mucin/edible serums, and real runtimes are far
  shorter than originally listed (~5-8 min actual vs. 18-22 min claimed).
  `showNotes`/`timestamps`/`transcript`/`duration` for episodes 1-4 were
  rewritten from the real transcripts (timestamps verified against
  word-level ASR timing, not guessed); `productsMentioned` was cleared to
  `[]` for all four since the real audio never names any SkinLabs-
  reviewed product — the previous entries were fabricated. The
  `transcript` field intentionally stays a handful of short paraphrased
  pull-quotes (the pre-existing pattern, gated behind membership via
  `GatedOverlay`), not a raw ASR dump — the vosk output has real
  disfluencies and misheard proper nouns (e.g. dermatologist "Rebecca
  Marcus" transcribed as "Rebecca tablets") that would misinform readers
  if published verbatim. Full raw transcripts/JSON word-timing data from
  this pass were only saved to the session scratchpad, not committed —
  regenerate with the same ffmpeg+vosk pipeline if needed again.
  **Episodes 5-9 published 2026-09-13** (same ffmpeg+vosk transcription
  method), one per week starting 2026-09-18 (`publishedAt`
  2026-09-18/25, 10-02/09/16). Unlike 1-4, their real audio actually
  matches the pre-written titles/topics reasonably well — no rewrite of
  title/topics was needed, only description/showNotes/timestamps/
  transcript/duration from the real transcripts (same reasoning as 1-4:
  no fabricated `productsMentioned`, chapter timestamps from word-level
  ASR timing). One notable trait worth knowing before touching this data
  again: all nine published episodes (1-9) are the same synthetic
  "two-host NotebookLM-style deep dive" format, and episodes 5-9
  specifically frame themselves as reading from and discussing SkinLabs'
  *own* internal materials/ecosystem (editorial independence, the AI
  formulator, Seasons, the Review Engine, the dermatologist directory,
  budget-vs-luxury packaging stability) rather than being independently
  produced audio — i.e. the podcast is largely narrating the rest of the
  site back to itself. That's not necessarily a problem, but don't be
  surprised by it, and don't assume future episode audio will follow the
  same format without checking. Episode 10 is still `comingSoon: true`
  (real cover art and audio file are wired in — `public/ep10skinlabs.mp3`
  — but it has no publishedAt/showNotes/transcript yet, deliberately not
  published without the same transcription/QA pass).
- The engagement seed generator changed 2026-09-13 from a deterministic
  `seed(id, base, spread)` formula to a fixed `engagementSeed` lookup
  table (per explicit request: every published episode starts at a
  minimum of 3286 plays, likes/shares randomised proportionally). If
  asked to reseed again, generate fresh numbers the same way (Python
  `random` with a fixed seed for reproducibility) rather than reusing the
  old formula.
- `latestPublishedEpisode` (`src/data/podcast.ts`) drives the "New"
  badge on the hub grid, homepage teaser cards, and the episode page —
  it's whichever published episode has the most recent `publishedAt`,
  computed automatically, not hardcoded. When a new episode publishes,
  this updates itself; no manual badge toggling needed.
- **Podcast RSS feed** — `scripts/generate-podcast-rss.ts` (bun, build-time,
  wired into `npm run build` right after the sitemap step) generates
  `public/podcast.xml` from `publishedPodcastEpisodes`, served at
  `https://skinlabs.co.za/podcast.xml`. Standard RSS 2.0 + iTunes
  namespace (title/summary/duration/episode/season/explicit per item,
  channel-level owner/category/image) — this is what Apple Podcasts
  Connect and Spotify for Podcasters both want as the feed URL when
  submitting the show. `itunes:duration` reads from each episode's
  `durationSeconds` (ffprobe-verified, not derived at build time — see
  the QA note above) and `enclosure length` reads the real file size off
  disk via `fs.statSync`, so both stay accurate without needing ffmpeg on
  the build server. **Known gap: there is no show-level (or per-episode)
  artwork in this repo that meets Apple/Spotify's 1400x1400+ square
  minimum** — the feed currently points `itunes:image` at
  `public/podcast/ep-coming-soon.jpg` (1024x1024) as a placeholder, and
  episode-level images are 1080x1350 portrait, not square at all. The
  feed will generate and validate fine, but submitting it as-is to Apple
  Podcasts Connect or Spotify for Podcasters will likely get flagged or
  rejected on artwork grounds — a human needs to supply real ≥1400x1400
  (ideally 3000x3000) square show art before that submission step.
  Generating this feed is also **not** the same as being live on Apple/
  Spotify: actually submitting the feed URL through each platform's own
  podcaster console (Apple Podcasts Connect, Spotify for Podcasters) is a
  manual step by a human with ownership of those accounts — nothing in
  this environment can do that submission itself. The hub page links to
  `/podcast.xml` directly ("Subscribe via RSS") and via
  `<link rel="alternate" type="application/rss+xml">` for feed-reader
  autodiscovery in the meantime.

## Temporary, single-client features

- **`/quote-ss-beauty` (2026-09-16)** — an unlisted, noindex'd interactive
  multistep quote-request form built for one Business Suite client
  (Siphokazi / SS Beauty) who wants contract manufacturing + white-label
  + branding/labelling for a hair growth oil, hair food and leave-in
  conditioner line. Not linked from nav/sitemap. **Delete once her quote
  has been handled**: the route + lazy import in `src/App.tsx`, `src/
  pages/QuoteSSBeauty.tsx`, `src/components/quote-ss-beauty/`, `src/lib/
  quoteSsBeautyPricing.ts`, the `quote-ss-beauty-submit` edge function
  (`supabase/functions/quote-ss-beauty-submit/` + its `config.toml`
  entry), and the `quote_ss_beauty_requests` table (already applied live
  on `gnkpzijxuciiaamakgzm`).
  - On submit, the `quote-ss-beauty-submit` edge function computes an
    indicative ZAR estimate (pricing logic duplicated — different
    runtimes — between `src/lib/quoteSsBeautyPricing.ts` for the form's
    own live preview and the edge function itself, which is the
    authoritative copy for the PDF; keep both in sync if pricing
    changes), generates a branded PDF quotation with `jspdf` (works fine
    via `npm:jspdf@4.2.1` in the Deno edge runtime — no canvas/DOM
    dependency for the plain text/rect drawing this uses), records the
    submission in `quote_ss_beauty_requests` (RLS enabled, zero
    policies — reachable only via the function's service-role client,
    never from anon/authenticated), and emails the full submission +
    PDF to **michael@skinlabs.co.za only** (never to the client
    directly — matches the existing "I'll put together a tailored
    proposal on a call" plan already communicated to her, so a human
    reviews the numbers before anything goes back to her). Estimate
    numbers are explicitly labelled "preliminary/indicative" everywhere
    they appear (in-form review step and the PDF) — never presented as
    a binding quote.
  - Sending actually depends on the `RESEND_API_KEY` project secret,
    which **is already set** on this project (confirmed live: a real
    smoke-test submission returned `email_sent: true` with no
    `email_error`, and the row/estimate math checked out — then
    deleted from the table afterwards). It was *not* set up by any tool
    available in this session, and its value doesn't correspond to the
    "Onboarding" key on the connected `Resend_for_SkinLabs` MCP account
    (which has zero verified domains and shows no matching request in
    its own `/emails` or request logs for that send) — so it's a
    separate, already-configured Resend key/account a human set up
    directly in Supabase, not something this session provisioned.
    Concretely: confirm the smoke-test PDF actually landed in
    michael@skinlabs.co.za's inbox before trusting `email_sent: true`
    at face value for a real client submission — it's a strong signal,
    not independently cross-verified end-to-end from this environment.
  - Deliberately did **not** integrate the Perspective AI connector for
    this form — its toolset (perspective_create/respond/
    get_embed_options, participant_invite, workspace_get_default) is
    built for embeddable AI-moderated conversational surveys, which
    would mean an off-brand iframe widget instead of a first-party
    stepper matching the rest of the site's design system (SKYNN AI's
    `StepperHeader`-style gradient current-step circle, `.gradient-
    text`, existing shadcn form primitives). "Intelligent" here means
    conditional per-product steps, honeypot spam protection, and a live
    running price estimate as she fills the form — revisit only if the
    Perspective AI product itself is specifically wanted.

## Infrastructure notes

- **There are two, unrelated live databases reachable from this
  environment — do not confuse them.** As of 2026-09-08 (verified by
  cross-checking a write against the real production REST API, not
  assumed):
  1. **The real production project** — Supabase ref `gnkpzijxuciiaamakgzm`
     ("SkinLabs® South Africa"), exactly what `.env`'s `VITE_SUPABASE_URL`
     and `supabase/config.toml`'s `project_id` point to, and therefore
     what the deployed app and its edge functions actually run against.
     Reachable from this environment via the **Supabase MCP server**
     (`mcp__Supabase__execute_sql` / `apply_migration` /
     `deploy_edge_function` / `get_advisors` etc., `project_id
     gnkpzijxuciiaamakgzm`) — despite older guidance in this file, the
     Supabase MCP connector in this environment does have working access
     to this project; don't assume otherwise without trying it fresh.
  2. **The Lovable-native "Cloud Database"** — reachable via
     `mcp__Lovable__query_database` (Lovable project_id
     `3a7fffe1-a651-4cb0-9824-839db53d00ae`, the same project also
     addressable via `mcp__Lovable__get_project`). This is Lovable's own
     bundled Supabase-backed database, separate from #1 — most likely a
     holdover from before the "Cut over app config to the Supabase
     connector project" commit (04298d8) moved the app to project #1.
     Writes made here (including DDL) succeed and are readable back
     through the *same* `query_database` tool, but do **not** appear on
     project #1's REST API, even for a trivial existing-row `UPDATE`, with
     no caching layer involved (`cf-cache-status: DYNAMIC` on the REST
     response) — this was misread as "PostgREST schema cache staleness"
     once already; it is not that. **Do not use the Lovable connector to
     apply or verify migrations** — anything done through it has no effect
     on what users actually experience. Its only remaining known use is
     inspecting the Lovable project's own metadata (name, screenshot,
     publish status) via `get_project`/`get_database_status`, not its data.
  Given this, always resolve the real project ref with
  `mcp__Supabase__list_projects` (or read `.env`/`supabase/config.toml`)
  before assuming it, rather than trusting a project ref documented here
  or anywhere else without a fresh check — it has already changed once.
- A migration is only "applied" once it succeeds via
  `mcp__Supabase__apply_migration` (or `execute_sql`) against the real
  project ref **and** a follow-up read — either
  `mcp__Supabase__execute_sql` against `information_schema`, or better, a
  live REST check (`curl "$VITE_SUPABASE_URL/rest/v1/<table>?select=*&limit=1"`
  with the publishable key — a `PGRST205` "could not find the table"
  response means it's NOT applied and reachable) — confirms it against
  that same project. Don't report a migration as "applied" from the SQL
  file looking correct, from a Lovable `query_database` result, or from
  `apply_migration` returning success without also confirming which
  project it landed on.
- After any DDL change, run `mcp__Supabase__get_advisors` (both
  `security` and `performance`) — it reliably catches missing FK indexes,
  RLS policies re-evaluating `auth.<fn>()` per row instead of
  `(select auth.<fn>())`, and SECURITY DEFINER functions left callable by
  `anon`/`authenticated` when they shouldn't be (a plain `CREATE OR
  REPLACE FUNCTION` does **not** carry forward a previous `REVOKE` on that
  function — each redefinition needs its own explicit `REVOKE ALL ... FROM
  PUBLIC, anon, authenticated` if that's still the intent). The
  `performance` advisor's JSON response is large enough to blow the tool's
  token budget on a database this size — expect it to save to a file and
  `grep` that file for the specific table/pattern you care about rather
  than requesting the whole thing.
- Deploying an edge function for real means
  `mcp__Supabase__deploy_edge_function` against the real project ref
  (`gnkpzijxuciiaamakgzm`) with the function's full source inlined as
  `files`, matching whatever `verify_jwt` setting `supabase/config.toml`
  declares for it (this codebase's payment/auth functions all set it to
  `false` and verify the JWT themselves inside the handler). Committing
  the function's source to this repo does **not** deploy it — confirm with
  `mcp__Supabase__list_edge_functions` (or a live request) that the
  function you expect actually exists and reflects the source you just
  committed, rather than assuming the commit was enough.
- The seed migration (`20260907120004_skincare_intelligence_seed.sql`,
  ~790KB) is too large for one `query_database` call and must be applied in
  chunks — see **`supabase/SEED_MIGRATION_STATUS.md`** for current
  live-application progress and the exact resume procedure (including
  `scripts/split-seed-migration-chunks.sh`, which regenerates the chunks
  deterministically so they don't need to be committed).
- Bun is used as a TS-native script runner for one-off ETL scripts
  (`bun run scripts/<name>.ts`), importing `.ts` data files directly.
- New tables need an **explicit `GRANT`** to `anon`/`authenticated` even
  when an RLS policy already covers the same role+command — an RLS policy
  alone does not imply the underlying table-level privilege on this
  project, and the failure mode is a misleading `42501 "new row violates
  row-level security policy"` even though `pg_policies` shows the policy
  is correct. Always pair `CREATE POLICY ... FOR INSERT TO anon` with
  `GRANT INSERT ON <table> TO anon` (see existing migrations for the
  pattern) and verify with a live REST insert, not just by reading the
  policy back.
- A `RETURNING`/`Prefer: return=representation` insert (or any `.select()`
  chained onto `.insert()` in supabase-js) additionally requires the
  connecting role to satisfy a **SELECT** policy on that table, since
  Postgres RLS treats the returned row as a read. A write-only table (like
  `skynn_fairness_events`, admin-only SELECT) must be inserted into
  WITHOUT `.select()`/`RETURNING` from anon/authenticated context, or the
  insert itself gets rejected — don't "fix" this by loosening the SELECT
  policy just to make a debug query work.
- Earlier revisions of this file claimed "the Supabase MCP connector has
  zero access to the SkinLabs project (only sees an unrelated project
  called 'Puntr')." That was true at the time but is **not current** —
  as of 2026-09-08 `mcp__Supabase__list_projects` correctly returns the
  real `gnkpzijxuciiaamakgzm` project (see the infrastructure bullet
  above), and edge functions can be deployed to it directly via
  `mcp__Supabase__deploy_edge_function`. Re-verify with
  `mcp__Supabase__list_projects` each session rather than trusting either
  version of this claim — access here has already changed once without
  this file being updated at the time.
- Headless Chromium (Playwright) launched in this sandbox does **not**
  automatically route through the environment's `HTTPS_PROXY` — every
  outbound call from a real browser page (Supabase, Google Fonts, ad
  networks) fails with `net::ERR_CONNECTION_RESET` unless the browser is
  launched with `proxy: { server: process.env.HTTPS_PROXY, bypass:
  "127.0.0.1,localhost" }`. Even then, some third-party hosts (ad/font/
  analytics CDNs) still fail inside the tunnel — expected sandbox noise,
  not a real bug. For verifying a Supabase read/write actually works,
  prefer a direct `curl` against the REST API (curl respects
  `HTTPS_PROXY` natively) over a full browser E2E test.
