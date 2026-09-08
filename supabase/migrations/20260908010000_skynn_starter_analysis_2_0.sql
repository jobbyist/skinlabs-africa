-- SKYNN AI Starter Analysis 2.0 — minimal schema extension.
--
-- Per the audit in CLAUDE.md/this feature's implementation notes: no new tables
-- are required. `skincare_recommendations` already holds one row per saved
-- Starter Analysis (see 20260120012950 + 20260907130000); this migration only
-- adds what's genuinely missing:
--   1. result_payload      — the full structured Result Engine 2.0 output
--                            (Skin Story, ranked priorities, routine strategy,
--                            context, preferences, refinement history, version
--                            stamps) as one JSON document, avoiding a sprawl of
--                            narrow typed columns for a shape that's still
--                            versioned and expected to evolve.
--   2. client_analysis_id  — a client-generated id, set once per analysis, that
--                            makes "save to account" idempotent: a retried save
--                            after a network error or a duplicate click upserts
--                            the same row instead of creating a duplicate.
--   3. photo_storage_path  — set only when a signed-in, photo-consenting member
--                            saves their result, pointing at the private
--                            `skin-analysis-photos` bucket object below, so a
--                            later Advanced SKYNN AI analysis can reuse the
--                            photo without asking the visitor to re-upload it.

alter table public.skincare_recommendations
  add column if not exists result_payload jsonb,
  add column if not exists client_analysis_id text,
  add column if not exists photo_storage_path text;

-- Idempotency key: one row per (user, client-generated analysis id). A plain
-- (non-partial) unique constraint is required here, not just a unique index —
-- PostgREST's upsert `on_conflict` param generates a bare `ON CONFLICT (user_id,
-- client_analysis_id)`, which Postgres will only match against a constraint/index
-- with no WHERE predicate (a partial index was tried first and rejected with
-- 42P10 "no unique or exclusion constraint matching the ON CONFLICT specification").
-- This still doesn't constrain historical rows with a null client_analysis_id —
-- Postgres treats every NULL as distinct from every other NULL in a unique
-- constraint, so no WHERE clause is needed for that.
alter table public.skincare_recommendations
  add constraint skincare_recommendations_user_client_analysis_key
  unique (user_id, client_analysis_id);

-- Pre-existing gap, surfaced by this migration: public.has_role() only granted
-- EXECUTE to service_role/postgres, not authenticated. That was invisible until
-- now because nothing previously ran an authenticated-role UPDATE (or an
-- INSERT ... ON CONFLICT DO UPDATE, which Postgres RLS plans as if it might
-- run one) against skincare_recommendations — the "Admins can update all
-- recommendations" policy's USING clause calls has_role(), and Postgres must
-- be able to evaluate every permissive policy for the command, admin policy
-- included, even for a plain owner-only upsert with no actual conflict. The
-- idempotent save-to-account upsert added in this migration is the first
-- client-side path to hit that. Matches the EXECUTE grant already given to
-- the equivalent public.is_member() helper.
grant execute on function public.has_role(uuid, app_role) to authenticated;

comment on column public.skincare_recommendations.result_payload is
  'Full Starter Analysis 2.0 structured result (Skin Story, priorities, routine strategy, context, preferences, refinement history, version stamps). Never used for RLS/auth decisions.';
comment on column public.skincare_recommendations.client_analysis_id is
  'Client-generated id set once per analysis, used as an idempotency key for save-to-account upserts.';
comment on column public.skincare_recommendations.photo_storage_path is
  'Path within the private skin-analysis-photos storage bucket, set only for signed-in, photo-consenting saves.';

-- Private bucket for a visitor's Starter Analysis photo, uploaded only once
-- they're signed in and have given photo consent (never for anonymous
-- visitors — there's no durable, RLS-scoped identity to own the file until
-- then). Stored so a later Advanced SKYNN AI run can reuse it without asking
-- the member to re-upload.
insert into storage.buckets (id, name, public)
values ('skin-analysis-photos', 'skin-analysis-photos', false)
on conflict (id) do nothing;

create policy "Users can upload their own analysis photos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'skin-analysis-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can view their own analysis photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'skin-analysis-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own analysis photos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'skin-analysis-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own analysis photos"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'skin-analysis-photos' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Admins can view all analysis photos"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'skin-analysis-photos' and public.has_role(auth.uid(), 'admin'));
