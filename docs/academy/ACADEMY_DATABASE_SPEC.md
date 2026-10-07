# SkinLabs® Academy — Database Specification

Status: **design only — no migration written or applied.** Live schema checked read-only on 2026-10-07: no `academy*`/`course*`/`lesson*`/`certificate*` tables; `app_role = admin, moderator, user`.

## 0. Conventions (from existing migrations and `CLAUDE.md`)

- Prefix `academy_`. UUID PKs (`gen_random_uuid()`), `created_at/updated_at timestamptz`, soft delete via `archived_at` where history matters.
- **`text` + `CHECK` instead of new enums** (avoids `ALTER TYPE … ADD VALUE` transaction limits and the SQL tool's DROP quirk). No new values added to `app_role`.
- RLS enabled on every table. Policies use `(select auth.uid())`. Helper functions are `SECURITY DEFINER`, `SET search_path = public`, `REVOKE ALL … FROM PUBLIC, anon, authenticated` then explicit `GRANT EXECUTE` (a `CREATE OR REPLACE` does not carry over earlier REVOKEs).
- Explicit table/column `GRANT`s; learners get **column-limited** write grants only where a direct write is safe (notes, bookmarks, saved courses). Everything that changes status, score, completion or entitlement is an RPC.
- Inserts that use `RETURNING` need a matching SELECT policy.
- Money: `numeric(10,2)` ZAR canonical (matches `pricing_plans`).
- Day boundaries for streaks and windows: SAST (UTC+2), matching trial/lifecycle code.
- Append-only audit: `academy_audit_log` written by triggers/RPCs only; no UPDATE/DELETE grants.
- Migrations are written with `CREATE … IF NOT EXISTS` / `CREATE OR REPLACE`, never `DROP`.
- After applying: `get_advisors` (security + performance), regenerate `types.ts`, add rolled-back probes in `supabase/tests/academy_*.sql`.

## 1. Entity overview

```
academy_config (singleton)
academy_role_assignments ─┐
academy_instructors ──────┼─ academy_course_instructors ─┐
academy_categories ───────┘                               │
                                                          ▼
academy_courses ──< academy_course_versions ──< academy_modules ──< academy_lessons ──1 academy_lesson_content
     │  │                    │                       │                    │
     │  │                    │                       └< academy_assessments ──< academy_questions ──1 academy_question_keys
     │  │                    └< academy_publication_reviews              ├< academy_lesson_assets >── academy_assets
     │  └< academy_course_prerequisites                                  └< academy_sources
     └< academy_accreditations
academy_enrolments ──< academy_lesson_progress
        │        ├──< academy_attempts
        │        ├──< academy_submissions
        │        └──1 academy_certificates
learner extras: academy_bookmarks, academy_notes, academy_saved_courses, academy_course_reviews, academy_learning_days
cross-cutting: academy_audit_log, academy_accommodations
```

## 2. Platform & people

### academy_config *(singleton)*
`id boolean PK default true CHECK (id)`, `rollout_stage text CHECK in (disabled, preview, public) default 'disabled'`, `paid_enrolment_enabled bool default false`, `certificates_enabled bool default false`, `reviews_enabled bool default false`, `updated_at`. RLS on, **zero client policies**; read through `get_academy_public_config()` (returns stage + feature booleans only), changed only by `academy_admin_set_config()` (audited). Mirrors `skynn_advanced_assessment_config`.

### academy_role_assignments
`id`, `user_id uuid → auth.users on delete cascade`, `role text CHECK in (academy_admin, instructor, reviewer, assessor)`, `course_id uuid null → academy_courses` (null = academy-wide), `granted_by`, `granted_at`, `revoked_at`. Unique `(user_id, role, coalesce(course_id, zero-uuid))` where `revoked_at is null`. No client grants; managed by `academy_admin_assign_role()` / `academy_admin_revoke_role()` (audited). Helpers: `academy_has_role(user, role, course)`; `has_role(uid,'admin')` always satisfies `academy_admin`.

### academy_instructors
`id`, `user_id uuid null` (linked account, optional), `slug unique`, `display_name`, `headline`, `bio_markdown`, `photo_path`, `credentials jsonb` (array of `{title, institution, year, evidence_note, verified_at, verified_by}`), `is_published bool`, `created_by`, timestamps. Public SELECT via view `academy_instructors_public` exposing only published rows and **only credentials with `verified_at`** (others shown as nothing — never as claims).

### academy_categories
`id`, `slug unique`, `name`, `description`, `sort_order`, `is_published`. Public SELECT when published. Used as tracks (e.g. ingredient science, consumer education, business) — names are editorial decisions (D1).

## 3. Courses, versions, content

### academy_courses *(stable identity, commercial settings)*
`id`, `slug unique`, `category_id`, `current_version_id` (published pointer, null until published), `status CHECK in (draft, published, unpublished, archived)`, `level CHECK in (introductory, intermediate, advanced)`, `language default 'en-ZA'`, `access_model CHECK in (free, members, paid, members_or_paid)`, `member_tiers_included text[] default {insider,vip}`, `price_zar numeric(10,2) null` (required when access_model has paid), `refund_window_days int null`, `enrolment_cap int null`, `external_ref text null` (future interoperability), `created_by`, timestamps, `archived_at`. 
RLS: SELECT published rows for anon/authenticated (commercial columns fine — price is public); staff SELECT own/all via role helpers; writes via RPC only.

### academy_course_versions *(immutable once published)*
`id`, `course_id`, `version_number int`, `status CHECK in (draft, in_review, changes_requested, approved, published, superseded, archived)`, `title`, `subtitle`, `summary`, `description_markdown`, `learning_objectives jsonb` (string[]), `audience`, `prerequisites_note`, `estimated_minutes`, `completion_rules jsonb` (`{min_progress_pct, require_all_lessons, required_assessment_ids?, min_overall_score_pct?}`), `cover_image_path`, `seo_title`, `seo_description`, `change_note`, `content_hash`, `created_by`, `submitted_at`, `approved_by/at`, `published_by/at`, timestamps. Unique `(course_id, version_number)`; partial unique: one `published` per course. A trigger rejects UPDATE/DELETE of content tables (modules/lessons/…) when the owning version is `published|superseded`.

### academy_modules
`id`, `version_id`, `stable_key uuid` (identity across versions), `position`, `title`, `summary`, `objectives jsonb`, `unlock_rule CHECK in (open, sequential)`. Unique `(version_id, position)`.

### academy_lessons *(outline — publicly readable for published versions)*
`id`, `module_id`, `version_id` (denormalised for RLS), `stable_key uuid`, `slug`, `position`, `title`, `lesson_type CHECK in (text, audio, pdf, mixed, quiz, assignment)`, `summary`, `objectives jsonb`, `estimated_minutes`, `is_free_preview bool default false`, `required_for_completion bool default true`, `makes_claims bool default true` (publish gate), `assessment_id null`. Unique `(version_id, slug)`.

### academy_lesson_content *(gated bodies)*
`lesson_id PK`, `body_blocks jsonb` (zod-validated block array, see Architecture §9), `transcript_markdown`, `updated_at`. RLS SELECT: `academy_can_read_lesson(lesson_id)` = published version AND (`is_free_preview` OR enrolment access valid) OR staff role for that course. This split keeps outline SEO-friendly while bodies stay protected under normal PostgREST access.

### academy_assets
`id`, `kind CHECK in (audio, pdf, image)`, `bucket`, `storage_path`, `mime_type`, `bytes`, `duration_seconds null`, `page_count null`, `checksum_sha256`, `title`, `alt_text`, `is_decorative bool`, `rights_note` (licence/permission, required), `uploaded_by`, `created_at`. Staff-only SELECT; learners never read rows directly (they receive signed URLs from `academy_get_asset_url`).

### academy_lesson_assets
`lesson_id`, `asset_id`, `role CHECK in (primary_audio, download, figure)`, `position`, `label`. PK `(lesson_id, asset_id, role)`.

### academy_sources *(per-lesson citations; evidence-sensitive content)*
`id`, `lesson_id`, `citation_text`, `url`, `doi`, `pmid`, `source_type` (reuse existing `data_source_type` values: `peer_reviewed_literature`, `regulatory_database`, … plus `text`-check for textbook/guideline), `accessed_on date`, `supports_claim text`, `verification_status CHECK in (unverified, checked, verified)`, `verified_by`, `verified_at`. Follows the `ingredient_sources` precedent. Publish gate requires ≥1 non-`unverified` source per `makes_claims` lesson. Rendered publicly as a "Sources" list.

### academy_course_instructors
`course_id`, `instructor_id`, `role CHECK in (lead, contributor, guest)`, `position`. 

### academy_course_prerequisites
`course_id`, `requires_course_id`, `requirement CHECK in (completed, certificate)`; CHECK `course_id <> requires_course_id`; cycle check by trigger. Enforced server-side in `academy_enrol*` (not only in UI).

### academy_publication_reviews
`id`, `version_id`, `reviewer_id`, `role_in_review CHECK in (editorial, subject_matter, accessibility)`, `decision CHECK in (approved, changes_requested)`, `checklist jsonb`, `comments`, `created_at`. Trigger: `reviewer_id <> version.created_by`.

## 4. Assessments

### academy_assessments
`id`, `version_id`, `module_id null`, `kind CHECK in (quiz, exam, assignment)`, `title`, `instructions_markdown`, `pass_mark_pct numeric`, `max_attempts int null`, `cooldown_minutes int default 0`, `time_limit_minutes int null`, `shuffle_questions bool`, `feedback_policy CHECK in (immediate, after_pass, after_final_attempt, none)`, `required_for_completion bool`, `weight numeric default 1`, `rubric jsonb null` (assignments: criteria with max points), `requires_manual_marking bool`.

### academy_questions
`id`, `assessment_id`, `stable_key`, `position`, `question_type CHECK in (single, multiple, true_false)`, `prompt_markdown`, `options jsonb` (`[{id, text}]` — **no correctness flags**), `explanation_markdown`, `points`, `source_id null`. Learners may SELECT only through attempt RPCs; direct SELECT denied (prompts of unstarted exams must not leak).

### academy_question_keys *(answer keys)*
`question_id PK`, `correct_option_ids text[]`. RLS on, **no policies, no grants** to anon/authenticated. Staff read/write only via `academy_studio_*` SECURITY DEFINER RPCs checking role. Grading reads it inside `academy_submit_attempt`.

## 5. Learning state

### academy_enrolments
`id`, `user_id`, `course_id`, `version_id` (pinned), `source CHECK in (free, membership, purchase, admin_grant, giveaway)`, `status CHECK in (active, paused, completed, expired, revoked, refunded)`, `payment_transaction_id uuid null → payment_transactions`, `granted_by`, `grant_note`, `access_expires_at null`, `enrolled_at`, `last_activity_at`, `completed_at null`, `progress_pct numeric default 0` (cache, recomputed by RPC), `external_ref`. Unique `(user_id, course_id)` where status not in (revoked, refunded, expired). Learner SELECT own; **no client writes**.

### academy_lesson_progress
`id`, `user_id`, `enrolment_id`, `lesson_id`, `status CHECK in (not_started, in_progress, completed)`, `started_at`, `completed_at`, `time_spent_seconds`, `audio_position_seconds`, `client_updated_at`, unique `(user_id, lesson_id)`. Owner SELECT; written only by `academy_record_progress()` / `academy_complete_lesson()` (validates enrolment access, version membership, sequential unlock, monotonic completion; newest `client_updated_at` wins for positions).

### academy_attempts
`id`, `assessment_id`, `enrolment_id`, `user_id`, `attempt_number`, `status CHECK in (in_progress, submitted, graded, expired)`, `question_order jsonb` (server-chosen), `answers jsonb`, `score_pct`, `points_awarded`, `passed bool`, `started_at`, `expires_at`, `submitted_at`, `feedback jsonb`. Unique `(assessment_id, enrolment_id, attempt_number)`. Owner SELECT; RPC writes only.

### academy_submissions
`id`, `assessment_id`, `enrolment_id`, `user_id`, `attempt_number`, `text_response`, `file_asset_paths text[]` (private bucket), `status CHECK in (draft, submitted, in_review, returned, passed, failed)`, `submitted_at`, `assessor_id`, `rubric_scores jsonb`, `grade_pct`, `feedback_markdown`, `graded_at`. Learner SELECT own; assessors SELECT assigned/course-scoped; transitions via RPC. Files in `academy-submissions/{user_id}/{submission_id}/…` (storage policy: owner insert, owner + assessor read).

### academy_accommodations
`id`, `user_id`, `course_id null`, `time_multiplier numeric default 1`, `granted_by`, `reason` (not displayed to instructors), timestamps. Admin-managed; read inside attempt start.

### academy_certificates
`id`, `verification_code text unique` (Crockford, ≥12 chars), `user_id`, `course_id`, `version_id`, `enrolment_id unique`, `display_name_snapshot`, `public_name_consent bool`, `course_title_snapshot`, `course_version_number`, `notional_minutes`, `final_score_pct null`, `issued_at`, `status CHECK in (valid, revoked)`, `revoked_at/by/reason`, `accreditation_snapshot jsonb null`, `template_version`. Owner SELECT; inserts only via `academy_issue_certificate()`; revocation via admin RPC. Public access only through `academy_verify_certificate(code)`.

### Engagement
- `academy_bookmarks(user_id, lesson_id, created_at)` PK pair; owner full via column-limited grants + enrolment-or-preview check in policy.
- `academy_notes(id, user_id, lesson_id, body (≤4000), audio_second null, created_at, updated_at)`; owner only; never in analytics; included in account data export and deleted with account.
- `academy_saved_courses(user_id, course_id, created_at)`.
- `academy_course_reviews(id, user_id, course_id, rating 1–5, title, body, status CHECK in (pending, published, rejected, removed), created_at, moderated_by/at)`. Unique `(user_id, course_id)`; insert via RPC requiring an enrolment with `progress_pct ≥ 30` (D5); public SELECT of `published` only through view that shows handle (via existing `useCommentHandle` rules — no email/name leakage); aggregate view `academy_course_rating_summary` computed from real rows only. **No seeded ratings.**
- `academy_learning_days(user_id, day date, seconds int, lessons_completed int)`; streak computed by `academy_get_streak()` on SAST days; written by progress RPCs only.

## 6. Accreditation and audit

### academy_accreditations
`id`, `course_id null`, `scope CHECK in (course, academy)`, `scheme text` (e.g. SAQA/QCTO/CPD body name), `body_name`, `reference_number`, `nqf_level int null`, `credits int null`, `status CHECK in (none, in_preparation, submitted, verified, expired, withdrawn)`, `valid_from`, `valid_to`, `evidence_asset_id null`, `verified_by`, `verified_at`, `notes`, timestamps. 
**Constraint:** `status = 'verified'` ⇒ `reference_number, body_name, verified_by, verified_at, evidence_asset_id` all NOT NULL and `valid_from` ≤ today ≤ `valid_to` (nullable end). Setting `verified` only via `academy_admin_verify_accreditation()` (admin; audited). Only `academy_public_accreditation` view is ever read by the app; it returns nothing unless currently verified. `in_preparation`/`submitted` rows are staff-only and never shown as claims. Curriculum alignment working data (intended NQF level, notional hours, outcomes mapping) lives in `academy_course_versions` fields/docs, not here.

### academy_audit_log *(append-only)*
`id`, `at`, `actor_id`, `actor_role`, `action text`, `entity_type`, `entity_id`, `detail jsonb`. Actions include: `role_grant/revoke`, `version_submitted/approved/published/archived`, `course_unpublished`, `enrolment_granted/revoked/refunded`, `assessment_graded`, `attempt_reset`, `certificate_issued/revoked`, `accreditation_changed`, `config_changed`, `asset_uploaded/removed`. Admin-only SELECT; no INSERT grant (written inside SECURITY DEFINER functions/triggers). Separate from `admin_audit_log` because that table's action CHECK cannot be widened (known tool limitation).

## 7. RPC / function inventory

| Group | Functions |
|---|---|
| Public | `get_academy_public_config()`, `academy_course_public(slug)`, `academy_verify_certificate(code)` |
| Access | `academy_can_access_course(course)`, `academy_can_read_lesson(lesson)` (STABLE, used in RLS), `academy_authorize_asset(asset, lesson)` (Phase 4; called by the `academy-asset-url` edge function, which signs the URL — Postgres cannot sign Storage URLs) |
| Enrolment | `academy_enrol(course, source_hint)`, `academy_grant_enrolment_from_purchase(...)` (service role), `academy_admin_grant_enrolment(user, course, note, expires)`, `academy_revoke_enrolment(enrolment, reason, refunded)` |
| Progress | `academy_record_progress(...)`, `academy_complete_lesson(lesson)`, `academy_evaluate_completion(enrolment)`, `academy_get_resume(enrolment)`, `academy_get_streak()` |
| Assessment | `academy_start_attempt(assessment)`, `academy_save_attempt(attempt, answers)`, `academy_submit_attempt(attempt)`, `academy_submit_assignment(...)`, `academy_assessor_claim/grade/return(...)` |
| Certificates | `academy_issue_certificate(enrolment, display_name, consent)`, `academy_admin_revoke_certificate(cert, reason)` |
| Studio | `academy_studio_create_course`, `…_create_draft_version`, `…_save_*` (module/lesson/content/assessment/question/key), `academy_validate_version(version)`, `academy_submit_for_review`, `academy_review_version`, `academy_admin_publish_version`, `academy_admin_archive` |
| Reviews | `academy_submit_review`, `academy_moderate_review` |
| Analytics | `admin_academy_overview(days)`, `admin_academy_course_funnel(course)`, `admin_academy_assessment_stats(assessment)` (aggregates only; admin-gated) |

## 8. RLS matrix (summary)

| Table group | anon | authenticated learner | instructor / reviewer / assessor | academy_admin / platform admin |
|---|---|---|---|---|
| courses, published versions, modules, lesson **outline**, categories, public instructor view | SELECT published | same | + own drafts (role-scoped) | all |
| `academy_lesson_content` | preview lessons only | preview + enrolled-with-access | role-scoped to their course | all |
| assets / private buckets | none | none (signed URL via RPC after check) | course-scoped upload | all |
| questions / keys | none | none (attempt RPC only) | via studio RPC (keys), course-scoped | all |
| enrolments, progress, attempts, submissions, certificates, notes, bookmarks, saved | none | own rows only (SELECT); writes via RPC | assessors: assigned submissions; instructors: aggregates only | all via admin RPCs |
| reviews | published via view | own + published | moderation (moderator role allowed) | all |
| config, role assignments, accreditations (non-verified), audit log | none | none | none | admin RPCs |

## 9. Index & performance notes
Index every FK; `(user_id, enrolment_id)` on progress; `(course_id, status)` on enrolments; partial indexes for published versions; GIN `to_tsvector` on course title/summary for catalogue search (or reuse client-side `search-index` pattern for small catalogues). `academy_can_read_lesson` must be `STABLE` and index-backed to be safe in RLS. Run `get_advisors` after apply.

## 10. Test plan (SQL probes, all rolled back, `supabase/tests/`)
`academy_access.sql` (anon/learner/instructor boundaries, content gating), `academy_progress.sql` (monotonic completion, sequential unlock, spoofed user_id 42501), `academy_assessments.sql` (keys never readable, attempt limits, timer, grading), `academy_certificates.sql` (idempotent issue, only on completion, verify minimal fields, revoke), `academy_accreditation.sql` (cannot mark verified without evidence; public view empty otherwise), `academy_publication.sql` (author≠reviewer, publish gate, immutability), `academy_purchase.sql` (idempotent grant on replay), `academy_privacy.sql` (notes/submissions invisible to others).

## 11. Phase 1 as built (2026-10-07) — deviations from the sections above

`supabase/migrations/20261007100000_academy_foundations.sql` (repo only; **not applied live**). Differences from the design:
- `academy_assets.course_id` added (nullable; null = academy-wide evidence). Storage path convention `{course_id}/{asset_id}/{file}`, `shared/…` admin-only.
- `academy_lessons`: `lesson_type` is `text|audio|pdf|mixed` for now (quiz/assignment arrive with assessments in Phase 5, by `ALTER … CHECK`); new column `mentions_accreditation_topic` (lets a lesson that *teaches about* SAQA/QCTO pass the wording scan; version-level fields are always scanned).
- `academy_enrolments` exists as a table (owner SELECT only, no writes) so the access helpers are real; enrolment RPCs are Phase 3.
- Not yet created: assessments/questions/keys, progress, attempts, submissions, certificates, bookmarks/notes/saved, reviews, learning days, accommodations (Phases 3–8).
- Public reads use RLS + **column-level grants** (PostgREST callers must list columns, `select=*` on `academy_courses`/`academy_course_versions`/`academy_instructors`/`academy_sources` is refused). Internal columns (`created_by`, `external_ref`, `enrolment_cap`, review/approval stamps, `content_hash`, instructor `credentials`) are not granted; credentials are exposed only through `academy_public_instructor_credentials()` (verified ones, no evidence notes).
- Catalogue visibility is double-gated: published AND (`rollout_stage = 'public'` OR the viewer has an Academy role). The "preview" stage is staff-only (no allow-list yet).
- Added helper/RPC set beyond the spec: `academy_user_*` internal helpers (uid explicit, no client access), `academy_is_admin/is_staff/staff_for_course/catalogue_open/version_readable`, `academy_my_roles`, `get_academy_public_config`, `academy_public_accreditation`, `academy_public_instructor_credentials`, `academy_can_manage_path/view_path`, `academy_validate_version`, `academy_submit_version_for_review`, `academy_review_version`, `academy_admin_publish_version`, `academy_admin_unpublish_course`, `academy_admin_set_config`, `academy_admin_assign_role/revoke_role`, `academy_admin_save_accreditation/verify_accreditation`.
- Review rule as built: approval needs an `editorial` approval, plus a `subject_matter` approval when any lesson `makes_claims`, both recorded after the latest submission; the author can never review (trigger).
