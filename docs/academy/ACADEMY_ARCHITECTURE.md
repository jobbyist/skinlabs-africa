# SkinLabs® Academy — Architecture

Status: **Phase 1 deliverable (discovery + design). No application code, migrations or live-DB changes were made.**
Audit date: 2026-10-07, repo at `main` @ `e0997dc`, live Supabase project `gnkpzijxuciiaamakgzm` (read-only queries only).
Companion docs: `ACADEMY_DATABASE_SPEC.md`, `ACADEMY_ROUTES.md`, `ACADEMY_ROLES_AND_PERMISSIONS.md`, `ACADEMY_IMPLEMENTATION_PLAN.md`.

## 1. Product framing

SkinLabs Academy is a premium professional skincare-education surface that **reuses** SkinLabs auth, membership, payments, design system, PWA, PDF and admin patterns. It follows the standing product principle in `CLAUDE.md`: reusable data models over page features, no fabricated ratings/reviews/enrolment counts/scarcity, never make an unfinished feature look operational, editorial independence preserved.

### Accreditation rule (hard constraint)
Nothing in the UI, emails, PDFs, SEO, JSON-LD or search may claim SAQA / NQF / QCTO / CPD accreditation unless a row in `academy_accreditations` has `status = 'verified'` with reference number, evidence and a named verifier. Until then the only allowed vocabulary is: **SkinLabs Academy Certificate of Completion**, *professional development course*, *accreditation-ready curriculum*, *certificate of completion*. This is enforced in three places: a DB constraint + public view (data), a pure `academyTerminology.ts` module (copy), and a banned-terms test modelled on `skynnTerminology.test.ts` (CI). See DB spec §6.

## 2. Audit findings (validated against the repo)

| Area | Finding | Consequence for Academy |
|---|---|---|
| Frontend | Vite SPA, React Router in `src/App.tsx`, every page `lazyWithRetry()`. A few content types are TanStack Start SSR routes in `src/routes/*` (`briefings`, `reviews`, `ingredients`, `spotlight`, `web-stories`, `sitemap[.]xml`). Prerender via `scripts/prerender.ts`. | Public course pages need SSR (SEO + JSON-LD) → new `src/routes/academy.courses.$slug.tsx`, registered in `scripts/assemble-vercel-output.ts`. Learner/studio pages stay SPA. |
| Existing placeholder | `/learn` renders `ComingSoon` (`src/pages/ComingSoon.tsx`); Header badge "Coming Soon" (`Header.tsx:91`), Footer `isComingSoon` (`Footer.tsx:80`), `search-index.ts:44`. Placeholder copy targets *starting a skincare business* (formulation, compliance, sourcing); the brief targets *professional skincare education*. | Keep placeholder until launch; `/learn` becomes a permanent redirect to `/academy` (never delete old routes). Reconcile positioning (decision D1). |
| Auth | Supabase Auth via `useAuth`; `AuthDialog` is the single auth surface; `IntentResolver` + `pendingIntent` resume actions after sign-up (`trial|subscribe|save_analysis|unlock`). | No second auth. Add intent action `enrol` (validated `returnTo`) so anon → sign-up → enrolled works. |
| Roles | `app_role` enum = `admin, moderator, user` (live confirmed); `user_roles` (live: admin 4, moderator 1); `has_role()` SECURITY DEFINER. `/admin` checks `has_role(admin)`. | Do **not** `ALTER TYPE app_role` (project notes: DDL tooling quirks, and instructors are scoped, not global). Add scoped `academy_role_assignments` + helper functions; `has_role(admin)` implies Academy admin. |
| Entitlements | `src/lib/entitlements.ts` is the single capability source; ladder `anonymous→free→glow_lite→insider→vip` + `foundingMember`/`isProfessional` flags. `useEntitlements`, `useMembership` (15 s shared read), `useViewerContext`. | Per-course access is **not** a ladder capability. Add one optional `FeatureKey` (`academy.member_courses`) for membership-included courses; actual access always decided server-side by `academy_can_access_course()`. `is_professional` exists but no live flow sets it (verified in header comment + live) — do not depend on it. |
| Conversion gates | `useConversionAction(feature, source)`, `useStartTrial()`, `/pricing` only secondary (`SeeAllPlansLink`), VIP "coming soon" while `is_purchasable=false`. | Academy gates extend the pure `conversionAction.ts` rule set (new `academy` branch), never link `/pricing` as primary. |
| Payments | PayFast (ZAR) **temporarily disabled** (`PAYFAST_ENABLED=false` in `src/lib/payments.ts`); PayPal live (USD, FX via `_shared/payments/fx.ts`). `PurchaseType = plan|credit_pack|founding_member` in `_shared/payments/types.ts`; `resolveCharge` prices server-side; `completePurchase` is idempotent on `reference`. `payment_transactions.purchase_type` has **no CHECK** (live: only currency + gateway checks). `PaymentGatewayDialog` supports an inline PayPal one-off purchase. | Course purchase = new `PurchaseType "course"` through the same three functions + `payment_checkout_intents` (CHECK on that table **not yet inspected** → Phase 3 pre-flight). Initial launch can be PayPal-only; PayFast works automatically when its flag flips. |
| Storage | Live buckets: `openhaus-product-images` (public), `web-stories` (public), `skynn-advanced-intake` (private, service role only), `skin-analysis-photos` (private). **Podcast audio is not in storage**: `public/epNskinlabs.mp3` static files served from the deployment (~60 MB, flagged in CLAUDE.md as a deployment-size problem). | Academy audio/PDF must **not** go in `public/`. New private buckets + signed URLs (§8–9). |
| PWA | Hand-written service worker; privacy contract: only same-origin GETs + 3 public Supabase tables cached; auth/RPC/storage/functions never intercepted; member HTML never cached. Podcast offline downloads use Cache Storage + IndexedDB. | Academy v1 is online-only for lessons; offline Academy audio is a later, explicit `swCore.ts` extension with tests first. Learner routes added to `KNOWN_EXCLUSIONS`/spa lists. |
| Audio player | Global `PodcastPlayer` + `usePodcastPlayer` context, `mediaSession.ts`, `playbackProgress.ts`. | Academy lesson audio uses its own lesson-scoped player reusing `mediaSession.ts` patterns; must pause the podcast player when it starts (integration test). |
| PDF | `jspdf` + `src/lib/pdf/brandPdf.ts` (`BrandDoc`: logo header, brand rule, "Page n of N"); invoices from `payment_transactions`. | Certificates use `BrandDoc`, rendered from the issued certificate row (never from client-supplied data). |
| Markdown | `react-markdown` ^10 is a dependency; briefings render markdown. | Lesson text = validated block JSON whose text blocks render via `react-markdown` (no raw HTML). No new dependency. |
| Dashboard | `UserDashboard` IA: Home · My Skin · Saved · Inbox · Settings, `?tab=` leaf sections (`dashboardTabs.ts`, unit tested). | Do not restructure. Add a Home "Continue learning" card; learner hub lives at `/academy/my-learning`. |
| Admin | `AdminDashboard` has ~13 tabs; sub-panels are lazy components; admin RPCs are SECURITY DEFINER + `has_role(admin)`; audit logs append-only (`admin_audit_log` action is CHECK-limited and cannot be widened — project note). | New "Academy" admin tab (lazy). Own append-only `academy_audit_log`. |
| Notifications / email | Notification engine (`enqueue_notification`, 10 fixed categories incl. none for learning); email outbox categories CHECK-limited (`PRODUCT, SUPPORT, FORMS, SECURITY, SYSTEM, ADMIN, MARKETING, MEMBERSHIP…`). | Phase 8 only; a new notification category needs a migration on `notification_preferences` — not assumed. |
| Analytics | `trackConversionEvent` → Vercel + `analytics_events`; `trackSkynnEvent`/`trackPwaEvent` whitelist pattern; admin `admin_events_overview`. | Add `trackAcademyEvent()` with a payload whitelist; never forward learner events to TikTok. |
| Ads | `AdFrame`, ad policy by tier, ad-block wall with `AD_BLOCK_WALL_EXEMPT_PREFIXES` in `src/lib/viewerContext.ts:57`. | No ad units inside lesson player/assessments; exempt `/academy/learn`, `/academy/studio`, `/academy/verify`. Catalogue pages follow `AdFrame` rules. |
| Tooling baseline | `node_modules` absent in this sandbox; `tsc` needs generated `src/routeTree.gen.ts`; CLAUDE.md contains conflicting notes on whether `tsc` is clean (317 errors noted 2026-10-04; "clean again" noted earlier). | Phase 0 captures a fresh baseline (`bun install`, `build:tanstack-start`, tsc, eslint, `bun test`) so later phases prove "no new failures". |
| Live DB | No `academy*`, `course*`, `lesson*` or `certificate*` tables exist. | Greenfield schema, no collision. |

## 3. Architectural principles

1. **Content is data.** Courses, modules, lessons, quizzes, sources live in Postgres; React renders blocks. No course text in components.
2. **Server decides access.** Every gate resolves through SECURITY DEFINER functions; the client mirrors for UX only (same rule as `get_advanced_assessment_access`).
3. **Immutable published versions.** Editing creates a new draft version; learners are pinned to the version they enrolled on.
4. **Answer keys never leave the server.** Grading, completion and certificate issuance are RPCs; clients cannot write status, scores or certificates.
5. **Evidence-sensitive publishing.** A lesson that makes a skincare claim needs attributed sources and a recorded editorial review before publish.
6. **Reuse before build.** Existing: auth, `useViewerContext`, `useConversionAction`, payments, `BrandDoc`, `lazyWithRetry`, `AdFrame`, `SectionNav`, `PaginationControls`/`getPageWindow`, `feature_waitlist`, markdown renderer, SAST-day helpers, probe-based SQL testing.
7. **Feature-flagged rollout.** Singleton `academy_config.rollout_stage` (`disabled|preview|public`) read through an RPC, mirroring `skynn_advanced_assessment_config`. Header "Coming Soon" badge stays until `public`.

## 4. System overview

```
Browser (SPA)                         Edge/SSR                       Supabase
─────────────────                     ────────────────               ───────────────────────────
/academy, /academy/courses ──SSR──►   TanStack route (catalogue,     views: academy_catalogue (published only)
/academy/courses/:slug ────SSR──►     JSON-LD Course)                RPC: academy_course_public(slug)
/academy/learn/** (SPA) ───────────► supabase-js (user JWT) ───────► RLS tables + SECURITY DEFINER RPCs
/academy/studio/** (SPA) ──────────► supabase-js (role-checked RPCs)  academy_* tables, private buckets
checkout ──► paypal-payment/payfast-payment (+ "course" PurchaseType) ──► completePurchase ──► academy_grant_enrolment_from_purchase()
certificate PDF ◄── BrandDoc(jsPDF, client) ◄── academy_certificates row (server-issued)
signed URLs ◄── RPC academy_get_asset_url() (access check, 5-min TTL)
```

## 5. Course publication workflow (H)

States on `academy_course_versions.status`: `draft → in_review → changes_requested → approved → published → superseded | archived`.

1. **Author** (instructor/course_manager) edits a draft version; autosave.
2. **Submit for review** runs the *publish gate* (server-side `academy_validate_version()`): every module has ≥1 lesson; every lesson has objectives; every audio lesson has a **transcript**; every asset has alt text/licence note; every lesson flagged `makes_claims` has ≥1 source with `verification_status ≠ unverified`; every assessment has a pass mark and keys for all questions; no banned accreditation terms; accessibility checklist ticked.
3. **Reviewer** (≠ author, enforced by trigger) records a checklist + decision in `academy_publication_reviews` (approve / request changes). Evidence-sensitive claims are reviewed by a reviewer holding the `reviewer` role.
4. **Academy admin** publishes (sets `published_at`, snapshots `content_hash`, supersedes prior version, writes audit log). Existing enrolments stay on their pinned version; admin may offer migration via `stable_key` mapping.
5. **Unpublish/archive** hides from catalogue; enrolled learners keep access to their pinned version (unless revoked).

Instructor profile credentials (`academy_instructors.credentials`) are shown publicly only with `verified_at` set by an admin. No invented bios or qualifications.

## 6. Assessment workflow (I)

- **Quiz/exam (auto-marked):** `academy_start_attempt` (checks enrolment, attempt limit, cooldown, creates server-held question order/snapshot) → learner answers (autosaved) → `academy_submit_attempt` grades against `academy_question_keys` inside the DB → returns score, pass/fail and feedback per the assessment's `feedback_policy`. Timer enforced server-side (`expires_at`); late submissions auto-submit what was saved. Accessibility: time-limit extension per learner (`academy_accommodations`, Phase 5).
- **Assignment (manually marked):** learner submits text and/or file to private bucket `academy-submissions`; assessor claims, scores against rubric, returns with feedback or marks pass/fail; resubmission allowed per rule; every grade writes an audit row.
- Pass marks and "required for completion" are per assessment; module/course completion consumes them.
- Question types v1: single choice, multiple choice, true/false. (No free-text auto-marking.)

## 7. Certificate workflow (J)

1. `academy_evaluate_completion(enrolment)` (pure SQL, re-run on every progress/attempt/grade event): all required lessons complete AND required assessments passed AND minimum course progress met AND enrolment active.
2. On first success sets `enrolments.completed_at`; a learner then confirms the **name to print** (profile name vs custom, stored as snapshot, with explicit consent for public verification display).
3. `academy_issue_certificate(enrolment)` (SECURITY DEFINER, idempotent, one per enrolment) creates the row with a random Crockford-alphabet verification code (precedent: SKYNN `reference_number`), snapshots title/version/hours/score, and snapshots accreditation **only if verified at that moment**.
4. PDF generated client-side with `BrandDoc` from the row; text says "Certificate of Completion — SkinLabs Academy" plus the verification URL. No QR dependency (as with the skin-story feature) — text URL and code.
5. `/academy/verify/:code` calls `academy_verify_certificate(code)` which returns only: valid/revoked, course title, issue date, display name (if consented, else initials), and accreditation line only if verified. Revocation by admin with reason + audit.
6. Retention: certificates survive account deletion in anonymised form (decision D8, POPIA review).

## 8. Payment / entitlement model (K)

Three access models on `academy_courses.access_model`: `free` (any signed-in learner), `members` (included for tiers in `member_tiers_included`, default insider+vip), `paid` (one-off ZAR price, `price_zar`); `members_or_paid` allowed. Enrolment `source`: `free | membership | purchase | admin_grant | giveaway`.

- **Access check** `academy_can_access_course(course_id)`: purchase/admin_grant/free → always (until `access_expires_at`); membership → live tier check (mirrors `is_member()` rules; trial = tier, consistent with `useMembership`); lapse **pauses** access and preserves progress.
- **Purchase:** `resolveCharge` gains `purchaseType: "course"`, reading `academy_courses.price_zar` server-side (client never sends price); PayPal converts to USD at live FX; `completePurchase` calls `academy_grant_enrolment_from_purchase()` idempotent on `reference`; row appears in Billing history and invoice PDF unchanged.
- **Refunds:** `academy_revoke_enrolment(reason)` admin RPC marks `refunded`; per-course `refund_window_days` (null until a human sets policy; Refund Policy page needs a legal read — D6).
- **No "Course Pass" currency.** Avoid a second ledger; Analysis Passes remain SKYNN-only.
- **Gating UI:** `useAcademyAccess(courseId)` + extended pure `conversionAction.ts` → CTA ∈ {Sign up, Enrol free, Start free trial (if included for Insider and viewer is an Explorer with no trial used), Subscribe, Buy course, Continue}. VIP-only logic not used.

## 9. Content storage strategy (L)

- **Structured content:** Postgres. Outline (titles, order, durations, objectives, preview flag) in `academy_modules`/`academy_lessons` — publicly readable for published versions. Gated bodies (`body_blocks` jsonb, transcript) in `academy_lesson_content` with RLS = preview OR enrolled-with-access.
- **Block schema (zod, shared client/edge):** `heading | paragraph (markdown) | list | callout (info/caution) | image (asset_id + alt) | audio (asset_id) | download (asset_id) | citation (source_id) | divider | key_takeaways`. Validated on save and on publish; unknown types rejected (also the future SCORM/LTI export surface).
- **Media:** private buckets, never `public/`:
  - `academy-audio` (audio/mpeg, audio/mp4; 100 MB limit)
  - `academy-resources` (application/pdf, images; 25 MB)
  - `academy-submissions` (learner uploads; 10 MB; owner + assessor only)
  - `academy-course-media` (public: covers/instructor photos only; admin/instructor write) — only genuinely public marketing imagery.
- Storage policies: no learner SELECT on private buckets; objects served only through `academy_get_asset_url()` (checks `academy_can_read_lesson`), 5-minute signed URL, preview-lesson assets also signed but allowed for anyone.

## 10. Audio streaming strategy (M)

Signed Supabase Storage URLs (support HTTP range requests → seeking). Lesson player: native `<audio>` with custom controls, speed 0.75–2×, ±15 s, keyboard operable, Media Session metadata, no autoplay, transcript always available beside/below. Position saved every 10 s and on pause via `academy_record_progress` (newest client timestamp wins — same rule as podcast progress); resume prompt. Completion = ≥90% played OR learner marks complete (and any quiz). Signed-URL refresh on expiry/403 (single retry). Not cached by the service worker (storage is never intercepted — keep it that way). Transcode targets: mono 96 kbps MP3 for speech (CLAUDE.md audio finding); publish gate stores `duration_seconds`.

## 11. PDF strategy (N)

Resource PDFs in `academy-resources`; `download` blocks call `academy_get_asset_url()` with `disposition=attachment`; each file needs a title, page count, size and an HTML alternative or summary (accessibility). Certificates and receipts are generated, not stored (optional cached copy path on the certificate row for re-download parity). jsPDF output is untagged, so every PDF's content must also exist as accessible HTML on the page.

## 12. Analytics events (O)

New `trackAcademyEvent(event, props)` (whitelisted props: `course_slug`, `lesson_position`, `module_position`, `source`, `access_model`, `progress_bucket`, `result`, `count`; **no** names, notes, answers, essay text, emails). Events: `academy_catalogue_viewed, academy_search_used (count only), academy_course_viewed, academy_preview_started, academy_enrol_clicked, academy_enrolled, academy_checkout_started/completed (reuse existing checkout events with `purchase_type:"course"`), academy_lesson_started, academy_lesson_completed, academy_audio_milestone (25/50/75/100), academy_resource_downloaded, academy_quiz_started/submitted/passed/failed, academy_assignment_submitted, academy_module_completed, academy_course_completed, academy_certificate_issued/downloaded/shared, academy_certificate_verified, academy_review_submitted, academy_course_saved, academy_resume_clicked, academy_streak_milestone`. Authoritative business metrics (enrolments, completions, pass rates, drop-off) come from `admin_academy_overview()` over Academy tables — not from `analytics_events` (members can't read it and it is lossy). Added to `admin_events_overview` as an "Academy" category. Never forwarded to TikTok except an optional ViewContent on public catalogue/course pages via `contentForPath()`.

## 13. Accreditation metadata (P)

`academy_accreditations` (see DB spec §6) with statuses `none | in_preparation | submitted | verified | expired | withdrawn`. Public exposure only through view `academy_public_accreditation` (verified AND within validity). `curriculum_alignment` fields (intended NQF level, notional hours, outcomes mapping) are internal "accreditation-ready" documentation, never displayed as an accreditation claim. `docs/academy/ACCREDITATION_READINESS.md` (Phase 7) will hold the human process (SETA/QCTO/SAQA route, evidence list) — not authored here as no accreditation partner is known.

## 14. Future SCORM / LTI / xAPI considerations (Q)

Not built; designed not to block: stable `stable_key` ids per module/lesson/assessment; block JSON as the canonical content form (exportable to SCORM 2004 / cmi5 packages); `completion_rules` jsonb; `academy_lesson_progress` and `academy_attempts` carry the fields xAPI statements need (actor = pseudonymous learner id, verb, object stable_key, result score/completion, timestamps); optional `external_ref` columns on courses/enrolments; versioned immutable snapshots; admin CSV export of completions. LTI would sit behind a separate edge function and map LTI users to existing auth identities — explicitly out of scope; require legal/data-processing review.

## 15. Accessibility requirements (R)

Target WCAG 2.2 AA. Concretely: semantic headings per lesson; keyboard-complete player and quiz (no pointer-only); visible focus (existing tokens); `prefers-reduced-motion` respected (global block + `useReducedMotion` for JS animations); contrast via existing tokens in light and dark; ≥44 px touch targets on phone; **mandatory transcript for every audio lesson (publish gate)**; images require alt text or `decorative`; no autoplay; no timing-only information; quiz timers announced politely (`aria-live`), extendable; progress and results exposed as text, not colour alone; forms with labels/errors tied via `aria-describedby`; lesson navigation landmarks and skip link; PDFs have an HTML equivalent. A manual screen-reader pass (VoiceOver + NVDA) and axe e2e run are Phase 9 exit criteria.

## 16. SEO strategy (S)

Public, SSR, indexable: `/academy`, `/academy/courses`, `/academy/courses/:slug` (Course + CourseInstance + Organization JSON-LD, breadcrumbs, canonical via `canonicalUrl`), instructor pages, track pages, free preview lesson text. **Not indexed (noindex + excluded from sitemap):** learner area, lesson player (except preview lessons that are explicitly marked public), studio, verify pages, checkout returns. `aggregateRating` only from real `academy_course_reviews` rows, at most one per course (same rule as `productReviewJsonLd`); no `Course` rich-result claims about credentials/accreditation unless verified. Live sitemap (`sitemap[.]xml.ts`) queries published courses; `STATIC_SITEMAP_ROUTES` gains `/academy`, `/academy/courses`. Site search (`search-index.ts`) gets Academy entries, course results via a dedicated SiteSearch group; `scripts/check-search-index.ts` `KNOWN_EXCLUSIONS` updated. `/learn` → 301-style `<Navigate replace>` to `/academy` (client) plus a `vercel.json` redirect. `llms.txt` updated at launch with honest scope.

## 17. Risks and open validation items

1. `payment_checkout_intents.purchase_type` CHECK — not inspected; Phase 3 pre-flight.
2. Email category for Academy mails (existing CHECK list) and notification category creation — Phase 8 inspection.
3. How `PodcastPlayer` context exposes pause for cross-player coordination — Phase 4 spike.
4. `types.ts` regeneration (`mcp__Supabase__generate_typescript_types`) after each applied migration; `supabaseTypesGuard` must stay green.
5. Supabase SQL tool hangs on `DROP`; write migrations with `CREATE OR REPLACE` / `ALTER`, never `DROP … IF EXISTS` (project note).
6. Every new table needs explicit `GRANT`s and RLS policy pairs; insert-with-RETURNING needs SELECT policy (project notes).
7. Educational/skincare claims require editorial review — the platform provides the workflow but **cannot supply the clinical content**; first-course content authoring is a human dependency.
8. Legal: Terms of Service, Refund Policy (course refunds), Privacy Policy (learner data, submissions, certificate verification) and Cookie Policy all need updates and a human legal read before `public`.
