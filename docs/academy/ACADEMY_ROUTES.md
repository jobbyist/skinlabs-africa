# SkinLabs® Academy — Routes

Conventions validated from `src/App.tsx`: pages are `lazyWithRetry()` (never `React.lazy`), old routes are never deleted (only redirected), SSR content routes live in `src/routes/*` and are added to `scripts/assemble-vercel-output.ts`, new public routes also go to `STATIC_SITEMAP_ROUTES`, `src/lib/search-index.ts` or `KNOWN_EXCLUSIONS` in `scripts/check-search-index.ts`, and (for non-indexable ones) the prerender/SPA exclusion lists.

Legend — **Render**: SSR = TanStack Start route; SPA = React Router page. **Index**: yes / noindex. **Access**: P public · L signed-in · E enrolled · S staff role.

## A. Public

| Route | Render | Index | Access | Notes |
|---|---|---|---|---|
| `/academy` | SSR | yes | P | Landing: value, featured courses (published only), how it works, honest certificate wording, waitlist (reuse `feature_waitlist`) while `rollout_stage ≠ public`. |
| `/academy/courses` | SSR (+ SPA filter hydration) | yes | P | Catalogue; filters (track, level, access, duration, language), search, sort, `PaginationControls`/`getPageWindow`; URL params `?track=&level=&access=&q=&page=`. Page ≥2 canonical to itself, filtered views `noindex,follow`. |
| `/academy/tracks/:slug` | SSR | yes | P | Category landing. |
| `/academy/courses/:slug` | SSR | yes | P | Course landing: outline, objectives, instructors, sources note, free preview lessons, reviews (real only), price/access CTA via `useAcademyAccess`. Course + Breadcrumb JSON-LD. |
| `/academy/courses/:slug/preview/:lessonSlug` | SSR | yes (only lessons with `is_free_preview`) | P | Free preview lesson text; audio plays via signed URL. |
| `/academy/instructors/:slug` | SSR | yes | P | Published instructors, verified credentials only. |
| `/academy/verify` | SPA | noindex | P | Code entry. |
| `/academy/verify/:code` | SPA | noindex | P | Calls `academy_verify_certificate`; rate-limited. |
| `/learn` | redirect | — | P | `<Navigate replace to="/academy">` + `vercel.json` redirect. Until launch `/academy` renders the existing "coming soon" treatment. |

## B. Learner (signed-in; signed-out opens `AuthDialog` in place with `returnTo`, as `/dashboard` does)

| Route | Render | Index | Access | Notes |
|---|---|---|---|---|
| `/academy/my-learning` | SPA | noindex | L | Hub: Continue learning (resume), In progress, Completed, Saved, Certificates, Streak, Bookmarks/notes entry. Section state via `?tab=` leaf values (`in-progress|completed|saved|certificates|notes`) following the `dashboardTabs.ts` pattern (pure resolver + unit test). |
| `/academy/learn/:courseSlug` | SPA | noindex | E | Course home inside the player: outline, progress, resume button; redirects to the resume lesson when `?resume=1`. |
| `/academy/learn/:courseSlug/:lessonSlug` | SPA | noindex | E (or preview) | Lesson player: text/audio/PDF/mixed, transcript, notes drawer, bookmark, prev/next, mark complete. No ads, no site chrome clutter on phones (same pattern as the Advanced assessment flow). |
| `/academy/learn/:courseSlug/assessment/:assessmentId` | SPA | noindex | E | Quiz/exam runner (one question per screen on phones; reuse `questionFlow`-style pure rules), results screen. |
| `/academy/learn/:courseSlug/assignment/:assessmentId` | SPA | noindex | E | Assignment brief, draft, upload, submit, feedback view. |
| `/academy/learn/:courseSlug/complete` | SPA | noindex | E | Completion summary → certificate name confirmation → issue. |
| `/academy/certificates/:id` | SPA | noindex | owner | Certificate view + PDF download + copy verification link (no social scraping of PII). |
| `/academy/checkout/return` | SPA | noindex | L | Return from PayPal/PayFast; polls for the enrolment (pattern: `?payment=success` poll in dashboard). Or reuse the inline PayPal buttons and skip a return route (preferred). |

Dashboard integration (no new `?tab=` leaf): Home card "Continue learning" (`ForViewer`), nav link in Header "Academy" (badge removed at launch), Footer link, `FloatingBottomNav` unchanged.

## C. Studio (instructors, reviewers, assessors) — SPA, noindex, role-gated by RPC (not by URL)

| Route | Access | Notes |
|---|---|---|
| `/academy/studio` | S | Role-aware home: my courses, review queue, marking queue. |
| `/academy/studio/courses/new` | instructor/admin | Create course. |
| `/academy/studio/courses/:courseId` | instructor/admin | Course settings, versions, instructors, prerequisites, pricing (admin-only fields hidden). |
| `/academy/studio/courses/:courseId/versions/:versionId` | instructor/reviewer/admin | Outline editor (modules/lessons drag-reorder with keyboard alternative), block editor, assets, sources, validation panel (publish gate results). |
| `/academy/studio/courses/:courseId/versions/:versionId/assessments/:assessmentId` | instructor/admin | Question editor + keys (keys fetched via studio RPC only). |
| `/academy/studio/review` | reviewer/admin | Pending versions, checklist, decision. |
| `/academy/studio/marking` | assessor/instructor/admin | Submission queue, rubric grading, return. |
| `/academy/studio/learners/:courseId` | instructor (aggregates), admin (details) | Progress/pass-rate aggregates; PII only for admin. |

## D. Admin

Platform admin console lives in the existing `/admin` as a new lazy **Academy** tab (`AcademyAdminTab`) with sub-sections: Overview (analytics), Courses & publication, Learners & enrolments (search by email, grant/revoke with reason and `p_request_id` idempotency like Analysis Passes), Assessments & marking oversight, Certificates (search, revoke, reissue), Accreditation (status + evidence, verification), Roles, Reviews moderation, Audit log, Config (rollout stage / feature switches). Deep links into the studio for editing. `/admin` already authenticates via normal `AuthDialog` + `has_role(admin)`.

## E. APIs & functions (no new REST surface unless noted)

- Browser → Supabase RPC/tables with the user JWT (as everywhere).
- Edge: extend `paypal-payment` / `payfast-payment` / `_shared/payments/*` for `"course"`; optional new `academy-certificate-pdf` is **not** planned (client `BrandDoc`).
- `academy-notify` (Phase 8, optional) — only if emails can't be enqueued from SQL triggers like existing lifecycle emails.
- Storage uploads via signed upload URLs from studio RPCs.

## F. Repository wiring checklist (per new route)
1. `App.tsx` `lazyWithRetry` + `<Route>`; SSR files under `src/routes/academy.*` and entries in `scripts/assemble-vercel-output.ts` (`SSR_ROUTE_CONTENT_TYPES_*` — prefix `/academy/courses/`, pre-filesystem like `/reviews/`).
2. `STATIC_SITEMAP_ROUTES` (+ live course/instructor rows in `sitemap[.]xml.ts`).
3. `search-index.ts` or `KNOWN_EXCLUSIONS`; `scripts/prerender.ts` skip lists for noindex SPA routes.
4. `AD_BLOCK_WALL_EXEMPT_PREFIXES` (`src/lib/viewerContext.ts`): `/academy/learn`, `/academy/studio`, `/academy/verify`, `/academy/my-learning`, `/academy/certificates`.
5. `mobileChrome.showStoryRail`: hide story rail on all `/academy/learn*` and `/academy/studio*`.
6. `contentRail`/`FloatingBottomNav`: not shown inside the player (focus mode).
7. e2e route coverage in `e2e/academy.e2e.ts` with the mocked Supabase support module.
