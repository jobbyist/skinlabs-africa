# SkinLabs® Academy — Implementation Plan

Branch: `claude/skinlabs-academy-architecture` (docs only so far). Each phase = its own branch/PR (draft), its own change log in `docs/academy/changelog/PHASE-NN-<name>.md` (what changed, files, migrations, decisions, deviations, verification output, open items).

## 0. Standing rules for every phase
- Reuse before build (auth, entitlements, `useViewerContext`, `useConversionAction`, payments, `BrandDoc`, `lazyWithRetry`, `AdFrame`, markdown renderer). No new dependencies unless a phase doc justifies one.
- No course text in React components; no fabricated ratings, counts, scarcity, instructors or credentials.
- Accreditation vocabulary guard (`academyTerminology.ts` + test) lands in Phase 1 and runs forever.
- **Exit gate each phase** (record outputs in the change log): `bun install` → `npm run build:tanstack-start` (route tree) → `npx tsc -p tsconfig.app.json --noEmit` → `npx eslint .` (+ `search-index:check`, `types:check`) → `bun test` → `npx vite build` (full `npm run build` before launch) → `npx playwright test` for affected specs → `scripts/run-sql-probes.sh` for DB phases. "No new failures versus the Phase-0 baseline" is the bar; any pre-existing failure is listed, not hidden.
- DB work: migrations written to the repo; **applied live only with owner approval** (project rule), then `get_advisors`, regenerate `types.ts`, run probes, record in the change log. Never `DROP`; explicit GRANTs; `(select auth.uid())` in policies.
- Everything ships behind `academy_config.rollout_stage` (`disabled` → `preview` (admins/staff + allow-list) → `public`).
- Doc updates: add a dated Academy section to `CLAUDE.md` at the end of each phase (standing rules only).

## 1. Decisions register (owner input; defaults let work proceed)

| # | Decision | Recommended default | Blocks |
|---|---|---|---|
| D1 | Positioning & tracks: placeholder says *start/run a skincare business*; brief says *professional skincare education*. | Two launch tracks: "Skincare science & ingredients" and "Skincare business foundations"; copy reconciled before Phase 2. | Phase 2 copy, category seed |
| D2 | Pricing: which courses are free / membership-included / paid; price points. | First course free (acquisition); later courses `members` (Insider+VIP) or paid. | Phase 3 |
| D3 | Membership inclusion & trials: do promo/trial users get member courses? | Yes (trial = tier, existing convention); access pauses if membership lapses. | Phase 3 |
| D4 | Payment rails at launch. | PayPal (USD, live) first; PayFast follows when `PAYFAST_ENABLED` flips. | Phase 3 |
| D5 | Review eligibility. | Enrolled with ≥30 % progress, moderated before publish. | Phase 8 |
| D6 | Refund policy for courses. | Human/legal decision; `refund_window_days` null until set. | Public launch |
| D7 | Instructor onboarding & real credentials. | Admin invites; credentials shown only after admin verification with evidence. | First course |
| D8 | Certificate data on account deletion. | Keep verification validity, anonymise name. Needs POPIA review. | Phase 6 |
| D9 | Platform `moderator` may moderate reviews. | Yes (reviews only). | Phase 8 |
| D10 | Accreditation target (SETA/QCTO/SAQA/CPD body) and timeline. | None assumed; data model + guard only. | Never blocks build |
| D11 | Offline Academy audio. | Out of v1; later `swCore.ts` extension. | Phase 4 scope |
| D12 | Ads on Academy catalogue pages. | Catalogue/landing follow `AdFrame` rules; none in player/assessments/studio/verify. | Phase 2 |

## 2. Phases

### Phase 0 — Baseline & approvals (0.5 day)
`bun install`; generate route tree; record baseline results of tsc/eslint/`bun test`/vite build/Playwright (CLAUDE.md contains conflicting notes about tsc cleanliness — measure). Owner answers D1–D4 (or accepts defaults). Spike (no commit): `PodcastPlayer` pause/ownership API for cross-player coordination; inspect `payment_checkout_intents` CHECK and email category list. **Output:** `changelog/PHASE-00-baseline.md`.

### Phase 1 — Foundations: schema, RLS, roles, audit, guard (3–4 days)
Migrations (repo only, then applied with approval): config, roles, instructors, categories, courses, versions, modules, lessons, lesson content, assets, lesson assets, sources, course instructors, prerequisites, publication reviews, accreditations (+ constraint + public view), audit log, helper functions (`academy_has_role`, `academy_can_access_course`, `academy_can_read_lesson`), immutability triggers, storage buckets + policies. Frontend: `src/lib/academy/{types.ts, terminology.ts, blocks.ts (zod), access.ts}` + tests; `academyTerminology.test.ts` banned-terms guard; `useAcademyConfig`, `useAcademyRoles`. Probes: access, publication, accreditation, privacy. **Exit:** probes green live; advisors clean; types regenerated; no UI exposed (stage `disabled`).

### Phase 2 — Public catalogue, course landing, SEO (3–4 days)
SSR routes (`/academy`, `/academy/courses`, tracks, course landing, instructors, preview lesson) via `src/routes/academy.*`; components under `src/components/academy/` using existing design tokens (`card-interactive`, `eyebrow`, `gradient-bg` one accent per screen); Course JSON-LD builders in `src/lib/seo/jsonLd.ts` + tests; sitemap/search/prerender/vercel wiring; `/learn` redirect; waitlist via `feature_waitlist`; Header/Footer badge logic tied to config. Seed **no fake courses**: a single clearly-labelled internal `preview`-stage sample course for QA, removed before public. **Exit:** Lighthouse/SEO check on SSR HTML, axe on catalogue.

### Phase 3 — Enrolment, entitlements, payments (3–4 days)
`academy_enrolments` + RPCs; `useAcademyAccess`; extend `conversionAction.ts` (+tests) and `IntentResolver` with `enrol` intent; CTA states; PayPal one-off `course` purchase through `resolveCharge/completePurchase/paypal-payment` (+ payfast path), idempotent grant by `reference`; Billing history/invoice show course; admin grant/revoke RPC. **Exit:** probes (`academy_purchase.sql`), e2e: anon → sign-up → enrol free; member → included; buy → enrolled; replay webhook → single enrolment.

### Phase 4 — Learning experience (5–6 days)
Lesson player (text blocks, audio, PDF downloads, transcript, sources), signed-URL RPC, progress/resume, lesson & module completion, sequential unlock, bookmarks, notes, saved courses, streaks, `/academy/my-learning`, dashboard Home card, `trackAcademyEvent`, podcast-player coordination, focus-mode chrome rules. **Exit:** e2e journeys; audio resume; signed-URL expiry retry; keyboard + screen-reader smoke.

### Phase 5 — Assessments (4–5 days)
Question runner, attempts, server grading, answer-key isolation, feedback policies, attempt limits/cooldown/timer, accommodations; assignments: submission upload, assessor queue, rubric marking, return/resubmit. **Exit:** `academy_assessments.sql` proves keys unreadable and grading authoritative; e2e quiz + assignment.

### Phase 6 — Completion & certificates (3 days)
`academy_evaluate_completion`, completion screen, name confirmation + consent, `academy_issue_certificate`, `BrandDoc` certificate PDF (`generateCertificatePdf.ts`), `/academy/verify`, revocation, anonymisation hooks, account export/delete extension. Copy guard confirms no accreditation claims. **Exit:** probes; PDF snapshot test; verify page returns minimal fields only.

### Phase 7 — Studio & admin console (6–8 days)
Studio routes (outline/block editors, assets upload, sources, assessments & keys, validation panel, review queue, marking queue), publication workflow RPCs, admin Academy tab (courses, learners/enrolments, certificates, accreditation, roles, config, audit log), `docs/academy/ACCREDITATION_READINESS.md`. **Exit:** author→review→publish e2e with two accounts; immutability proven.

### Phase 8 — Engagement & communications (3 days)
Reviews (+ moderation + real-only aggregate JSON-LD), reminders/emails/notifications (inspect email/notification category constraints first; transactional: enrolment confirmation, certificate issued, assignment returned; lifecycle reminders opt-in), streak milestones. **Exit:** guards for send-time conditions; `notification_preferences` change applied only with approval.

### Phase 9 — Analytics, hardening, launch readiness (3–4 days)
`admin_academy_overview` panels, `admin_events_overview` category, full a11y audit (axe + manual VoiceOver/NVDA), performance budget (main bundle must not gain Academy code; chunks lazy), security review (`security-review`), RLS probe sweep from the matrix, load check of signed-URL path, legal copy updates (Terms, Privacy, Refund, Cookie), CLAUDE.md + `llms.txt` + `docs/academy/LAUNCH_CHECKLIST.md`, first real course content loaded by a human author through the studio and taken through review. Flip `rollout_stage` to `preview` then `public` **only** after human sign-off.

Rough total: ~35–45 engineering days; content authoring and accreditation are separate human workstreams.

## 3. Reuse map
| Need | Reuse |
|---|---|
| Auth/sign-up/resume | `useAuth`, `AuthDialog`, `pendingIntent` + `IntentResolver` |
| Gating CTA | `useConversionAction` + `conversionAction.ts` |
| Plan/tier | `useMembership`, `entitlements.ts`, `useViewerContext` |
| Payments | `_shared/payments/*`, `PaymentGatewayDialog`, inline PayPal buttons, invoices |
| PDF | `BrandDoc` / `generateInvoicePdf` patterns |
| Waitlist | `feature_waitlist` |
| Pagination/search | `getPageWindow`, `PaginationControls`, `search-index`, SiteSearch group |
| SEO | `buildHeadTags`, `canonicalUrl`, `jsonLd.ts`, live sitemap |
| Audit/admin patterns | `AdminDashboard` tabs, `callAdmin`-style RPC wrapper, append-only log precedent |
| Testing | `bun test`, Playwright mocked Supabase (`e2e/support/mockSupabase.ts`), `supabase/tests/*.sql` probes |
| Terminology guard | `skynnTerminology.test.ts` pattern |
| Config rollout | `skynn_advanced_assessment_config` pattern |

## 4. Risk register (top)
1. **Content/claims risk** — platform can't supply or vouch for educational content. Mitigation: source + review gates, no seeded content.
2. **Accreditation misstatement** — constraint + view + guard + test + review checklist.
3. **Answer-key / paid-content leakage** — separate tables, no grants, RPC-only, probes.
4. **Bundle/perf regression** — all Academy routes lazy, SSR for public, no new libs; check main-bundle size each phase.
5. **Private media delivery** — signed-URL TTL vs long audio; mitigation: refresh-on-403 and range support test.
6. **Payments** — PayFast off, PayPal USD conversion on ZAR price; display ≈USD note (existing `PaypalQuote`).
7. **Deployment-size** — no media in `public/` (existing 60 MB audio problem).
8. **Scope creep** — SCORM/LTI, offline audio, live cohorts, video, discussion forums are explicitly out of v1.
9. **Legal/POPIA** — certificate names, submissions, learner data; human review before `public`.

## 5. Explicitly out of scope for v1
Video lessons, live classes/cohorts, forums, instructor payouts/revenue share, coupons, bundles/subscriptions-to-courses, SCORM/LTI/xAPI export, offline Academy audio, auto-marked free text, learning paths with AI recommendations, third-party accreditation integrations.
