-- SkinLabs Academy — Phase 1 foundations (docs/academy/ACADEMY_DATABASE_SPEC.md).
-- Config, scoped roles, catalogue, versioned content, assets, sources, accreditation, audit,
-- minimal enrolments (schema only), access helpers, publication workflow and storage buckets.
-- Not here (later phases): assessments/attempts (5), progress/RPCs for learners (3-4), certificates (6), studio editing RPCs (7).
-- Never DROPs (Supabase SQL tool limitation). New tables get default ALL grants to anon/authenticated on this
-- project, so every table is REVOKEd first and re-granted narrowly.

-- ---------------------------------------------------------------- tables

CREATE TABLE IF NOT EXISTS public.academy_config (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  rollout_stage text NOT NULL DEFAULT 'disabled' CHECK (rollout_stage IN ('disabled', 'preview', 'public')),
  paid_enrolment_enabled boolean NOT NULL DEFAULT false,
  certificates_enabled boolean NOT NULL DEFAULT false,
  reviews_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);
INSERT INTO public.academy_config (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.academy_role_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('academy_admin', 'instructor', 'reviewer', 'assessor')),
  course_id uuid,
  granted_by uuid,
  granted_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  CHECK (role <> 'academy_admin' OR course_id IS NULL)
);
CREATE UNIQUE INDEX IF NOT EXISTS academy_role_assignments_active_uq
  ON public.academy_role_assignments (user_id, role, COALESCE(course_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS academy_role_assignments_user_idx ON public.academy_role_assignments (user_id) WHERE revoked_at IS NULL;

CREATE TABLE IF NOT EXISTS public.academy_instructors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  display_name text NOT NULL,
  headline text,
  bio_markdown text,
  photo_path text,
  credentials jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(credentials) = 'array'),
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false
);
-- D1 (accepted default): two launch tracks, unpublished until an editor publishes them.
INSERT INTO public.academy_categories (slug, name, description, sort_order) VALUES
  ('skincare-science', 'Skincare science & ingredients', NULL, 1),
  ('skincare-business', 'Skincare business foundations', NULL, 2)
ON CONFLICT (slug) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.academy_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  category_id uuid REFERENCES public.academy_categories(id),
  current_version_id uuid,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'unpublished', 'archived')),
  level text NOT NULL DEFAULT 'introductory' CHECK (level IN ('introductory', 'intermediate', 'advanced')),
  language text NOT NULL DEFAULT 'en-ZA',
  access_model text NOT NULL DEFAULT 'free' CHECK (access_model IN ('free', 'members', 'paid', 'members_or_paid')),
  member_tiers_included text[] NOT NULL DEFAULT ARRAY['insider', 'vip'],
  price_zar numeric(10,2) CHECK (price_zar IS NULL OR price_zar >= 0),
  refund_window_days int CHECK (refund_window_days IS NULL OR refund_window_days >= 0),
  enrolment_cap int CHECK (enrolment_cap IS NULL OR enrolment_cap > 0),
  external_ref text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  CHECK (member_tiers_included <@ ARRAY['glow_lite', 'insider', 'vip']::text[])
);
ALTER TABLE public.academy_role_assignments
  ADD CONSTRAINT academy_role_assignments_course_fk FOREIGN KEY (course_id) REFERENCES public.academy_courses(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.academy_course_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  version_number int NOT NULL CHECK (version_number > 0),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'changes_requested', 'approved', 'published', 'superseded', 'archived')),
  title text NOT NULL DEFAULT '',
  subtitle text,
  summary text,
  description_markdown text,
  learning_objectives jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(learning_objectives) = 'array'),
  audience text,
  prerequisites_note text,
  estimated_minutes int CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
  completion_rules jsonb NOT NULL DEFAULT '{"min_progress_pct": 100, "require_all_lessons": true}'::jsonb,
  cover_image_path text,
  seo_title text,
  seo_description text,
  change_note text,
  content_hash text,
  created_by uuid,
  submitted_at timestamptz,
  approved_by uuid,
  approved_at timestamptz,
  published_by uuid,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, version_number)
);
CREATE UNIQUE INDEX IF NOT EXISTS academy_course_versions_one_published ON public.academy_course_versions (course_id) WHERE status = 'published';
ALTER TABLE public.academy_courses
  ADD CONSTRAINT academy_courses_current_version_fk FOREIGN KEY (current_version_id) REFERENCES public.academy_course_versions(id);

CREATE TABLE IF NOT EXISTS public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.academy_course_versions(id) ON DELETE CASCADE,
  stable_key uuid NOT NULL DEFAULT gen_random_uuid(),
  position int NOT NULL CHECK (position > 0),
  title text NOT NULL,
  summary text,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(objectives) = 'array'),
  unlock_rule text NOT NULL DEFAULT 'open' CHECK (unlock_rule IN ('open', 'sequential')),
  UNIQUE (version_id, position)
);

CREATE TABLE IF NOT EXISTS public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES public.academy_course_versions(id) ON DELETE CASCADE,
  stable_key uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  position int NOT NULL CHECK (position > 0),
  title text NOT NULL,
  lesson_type text NOT NULL DEFAULT 'text' CHECK (lesson_type IN ('text', 'audio', 'pdf', 'mixed')),
  summary text,
  objectives jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(objectives) = 'array'),
  estimated_minutes int CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
  is_free_preview boolean NOT NULL DEFAULT false,
  required_for_completion boolean NOT NULL DEFAULT true,
  makes_claims boolean NOT NULL DEFAULT true,
  mentions_accreditation_topic boolean NOT NULL DEFAULT false,
  UNIQUE (version_id, slug),
  UNIQUE (module_id, position)
);
CREATE INDEX IF NOT EXISTS academy_lessons_version_idx ON public.academy_lessons (version_id);

CREATE TABLE IF NOT EXISTS public.academy_lesson_content (
  lesson_id uuid PRIMARY KEY REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  body_blocks jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(body_blocks) = 'array'),
  transcript_markdown text,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('audio', 'pdf', 'image')),
  bucket text NOT NULL CHECK (bucket IN ('academy-audio', 'academy-resources', 'academy-course-media')),
  storage_path text NOT NULL,
  mime_type text NOT NULL,
  bytes bigint CHECK (bytes IS NULL OR bytes >= 0),
  duration_seconds int CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  page_count int,
  checksum_sha256 text,
  title text NOT NULL,
  alt_text text,
  is_decorative boolean NOT NULL DEFAULT false,
  rights_note text,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (bucket, storage_path)
);

CREATE TABLE IF NOT EXISTS public.academy_lesson_assets (
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  asset_id uuid NOT NULL REFERENCES public.academy_assets(id) ON DELETE RESTRICT,
  role text NOT NULL CHECK (role IN ('primary_audio', 'download', 'figure')),
  position int NOT NULL DEFAULT 1,
  label text,
  PRIMARY KEY (lesson_id, asset_id, role)
);

CREATE TABLE IF NOT EXISTS public.academy_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  citation_text text NOT NULL,
  url text,
  doi text,
  pmid text,
  source_type text NOT NULL DEFAULT 'other' CHECK (source_type IN ('peer_reviewed_literature', 'regulatory_database', 'guideline', 'textbook', 'other')),
  accessed_on date,
  supports_claim text,
  verification_status text NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('unverified', 'checked', 'verified')),
  verified_by uuid,
  verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS academy_sources_lesson_idx ON public.academy_sources (lesson_id);

CREATE TABLE IF NOT EXISTS public.academy_course_instructors (
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  instructor_id uuid NOT NULL REFERENCES public.academy_instructors(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'lead' CHECK (role IN ('lead', 'contributor', 'guest')),
  position int NOT NULL DEFAULT 1,
  PRIMARY KEY (course_id, instructor_id)
);

CREATE TABLE IF NOT EXISTS public.academy_course_prerequisites (
  course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  requires_course_id uuid NOT NULL REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  requirement text NOT NULL DEFAULT 'completed' CHECK (requirement IN ('completed', 'certificate')),
  PRIMARY KEY (course_id, requires_course_id),
  CHECK (course_id <> requires_course_id)
);

CREATE TABLE IF NOT EXISTS public.academy_publication_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id uuid NOT NULL REFERENCES public.academy_course_versions(id) ON DELETE CASCADE,
  reviewer_id uuid NOT NULL,
  role_in_review text NOT NULL CHECK (role_in_review IN ('editorial', 'subject_matter', 'accessibility')),
  decision text NOT NULL CHECK (decision IN ('approved', 'changes_requested')),
  checklist jsonb NOT NULL DEFAULT '{}'::jsonb,
  comments text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academy_accreditations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.academy_courses(id) ON DELETE CASCADE,
  scope text NOT NULL DEFAULT 'course' CHECK (scope IN ('course', 'academy')),
  scheme text NOT NULL,
  body_name text,
  reference_number text,
  nqf_level int CHECK (nqf_level IS NULL OR nqf_level BETWEEN 1 AND 10),
  credits int CHECK (credits IS NULL OR credits >= 0),
  status text NOT NULL DEFAULT 'in_preparation' CHECK (status IN ('none', 'in_preparation', 'submitted', 'verified', 'expired', 'withdrawn')),
  valid_from date,
  valid_to date,
  evidence_asset_id uuid REFERENCES public.academy_assets(id) ON DELETE RESTRICT,
  verified_by uuid,
  verified_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((scope = 'course') = (course_id IS NOT NULL)),
  -- A "verified" accreditation must carry its reference, issuing body, evidence and a named verifier.
  CONSTRAINT academy_accreditation_verified_needs_evidence CHECK (
    status <> 'verified' OR (
      reference_number IS NOT NULL AND length(trim(reference_number)) > 0
      AND body_name IS NOT NULL AND length(trim(body_name)) > 0
      AND evidence_asset_id IS NOT NULL AND verified_by IS NOT NULL AND verified_at IS NOT NULL
      AND valid_from IS NOT NULL
    )
  )
);

CREATE TABLE IF NOT EXISTS public.academy_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  at timestamptz NOT NULL DEFAULT now(),
  actor_id uuid,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  detail jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX IF NOT EXISTS academy_audit_log_at_idx ON public.academy_audit_log (at DESC);

-- Schema only in Phase 1; RPCs that create/advance enrolments arrive in Phase 3.
CREATE TABLE IF NOT EXISTS public.academy_enrolments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.academy_courses(id),
  version_id uuid NOT NULL REFERENCES public.academy_course_versions(id),
  source text NOT NULL CHECK (source IN ('free', 'membership', 'purchase', 'admin_grant', 'giveaway')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired', 'revoked', 'refunded')),
  payment_transaction_id uuid,
  granted_by uuid,
  grant_note text,
  access_expires_at timestamptz,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  last_activity_at timestamptz,
  completed_at timestamptz,
  progress_pct numeric(5,2) NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  external_ref text
);
CREATE UNIQUE INDEX IF NOT EXISTS academy_enrolments_live_uq ON public.academy_enrolments (user_id, course_id) WHERE status IN ('active', 'paused', 'completed');
CREATE INDEX IF NOT EXISTS academy_enrolments_course_idx ON public.academy_enrolments (course_id, status);
CREATE INDEX IF NOT EXISTS academy_enrolments_version_idx ON public.academy_enrolments (version_id);

-- ---------------------------------------------------------------- lock everything down first

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'academy_config', 'academy_role_assignments', 'academy_instructors', 'academy_categories', 'academy_courses',
    'academy_course_versions', 'academy_modules', 'academy_lessons', 'academy_lesson_content', 'academy_assets',
    'academy_lesson_assets', 'academy_sources', 'academy_course_instructors', 'academy_course_prerequisites',
    'academy_publication_reviews', 'academy_accreditations', 'academy_audit_log', 'academy_enrolments']
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
  END LOOP;
END $$;

-- ---------------------------------------------------------------- internal helpers (uid explicit; clients cannot call)

CREATE OR REPLACE FUNCTION public.academy_user_is_admin(p_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_uid IS NOT NULL AND (
    public.has_role(p_uid, 'admin')
    OR EXISTS (SELECT 1 FROM public.academy_role_assignments a WHERE a.user_id = p_uid AND a.role = 'academy_admin' AND a.revoked_at IS NULL));
$$;

-- p_course NULL = any assignment of that role. Academy admins satisfy every role.
CREATE OR REPLACE FUNCTION public.academy_user_has_role(p_uid uuid, p_role text, p_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_uid IS NOT NULL AND (
    public.academy_user_is_admin(p_uid)
    OR EXISTS (SELECT 1 FROM public.academy_role_assignments a
               WHERE a.user_id = p_uid AND a.role = p_role AND a.revoked_at IS NULL
                 AND (p_course IS NULL OR a.course_id IS NULL OR a.course_id = p_course)));
$$;

CREATE OR REPLACE FUNCTION public.academy_user_is_staff(p_uid uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_uid IS NOT NULL AND (
    public.academy_user_is_admin(p_uid)
    OR EXISTS (SELECT 1 FROM public.academy_role_assignments a WHERE a.user_id = p_uid AND a.revoked_at IS NULL));
$$;

CREATE OR REPLACE FUNCTION public.academy_user_staff_for_course(p_uid uuid, p_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_uid IS NOT NULL AND (
    public.academy_user_is_admin(p_uid)
    OR EXISTS (SELECT 1 FROM public.academy_role_assignments a
               WHERE a.user_id = p_uid AND a.revoked_at IS NULL AND (a.course_id IS NULL OR a.course_id = p_course)));
$$;

-- Mirrors resolveTier() in src/hooks/use-membership.ts (an active trial counts as its plan's tier).
CREATE OR REPLACE FUNCTION public.academy_user_tier(p_uid uuid) RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE r record; s text;
BEGIN
  SELECT subscription_status, trial_plan, trial_ends_at INTO r FROM public.profiles WHERE user_id = p_uid;
  IF NOT FOUND THEN RETURN 'explorer'; END IF;
  s := lower(coalesce(r.subscription_status, ''));
  IF s = 'trial' AND r.trial_ends_at IS NOT NULL AND r.trial_ends_at > now() THEN
    RETURN CASE r.trial_plan WHEN 'vip' THEN 'vip' WHEN 'glow_lite' THEN 'glow_lite' ELSE 'insider' END;
  END IF;
  IF s = 'vip' THEN RETURN 'vip'; END IF;
  IF s = 'glow_lite' THEN RETURN 'glow_lite'; END IF;
  IF s IN ('active', 'insider', 'premium') THEN RETURN 'insider'; END IF;
  RETURN 'explorer';
END $$;

-- Enrolment-based access only (staff access is separate). Membership enrolments pause when the tier lapses.
CREATE OR REPLACE FUNCTION public.academy_user_course_access(p_uid uuid, p_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT p_uid IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.academy_enrolments e JOIN public.academy_courses c ON c.id = e.course_id
    WHERE e.user_id = p_uid AND e.course_id = p_course
      AND e.status IN ('active', 'completed')
      AND (e.access_expires_at IS NULL OR e.access_expires_at > now())
      AND (e.source <> 'membership' OR public.academy_user_tier(p_uid) = ANY (c.member_tiers_included)));
$$;

CREATE OR REPLACE FUNCTION public.academy_audit(p_action text, p_entity_type text, p_entity_id uuid, p_detail jsonb DEFAULT '{}'::jsonb) RETURNS void
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.academy_audit_log (actor_id, action, entity_type, entity_id, detail)
  VALUES (auth.uid(), p_action, p_entity_type, p_entity_id, coalesce(p_detail, '{}'::jsonb));
$$;

-- ---------------------------------------------------------------- client-facing helpers (caller = auth.uid())

CREATE OR REPLACE FUNCTION public.academy_is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.academy_user_is_admin(auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.academy_is_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.academy_user_is_staff(auth.uid()); $$;

CREATE OR REPLACE FUNCTION public.academy_staff_for_course(p_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$ SELECT public.academy_user_staff_for_course(auth.uid(), p_course); $$;

-- Public catalogue visibility: everyone once the stage is 'public'; staff only in 'preview' or 'disabled'.
CREATE OR REPLACE FUNCTION public.academy_catalogue_open() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT (SELECT rollout_stage FROM public.academy_config WHERE id) = 'public' OR public.academy_user_is_staff(auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.academy_can_access_course(p_course uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.academy_user_course_access(auth.uid(), p_course) OR public.academy_user_staff_for_course(auth.uid(), p_course);
$$;

-- Outline visibility for a version: published (and catalogue open), staff of the course, or a learner pinned to it.
CREATE OR REPLACE FUNCTION public.academy_version_readable(p_version uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_course_versions cv JOIN public.academy_courses c ON c.id = cv.course_id
    WHERE cv.id = p_version AND (
      public.academy_user_staff_for_course(auth.uid(), c.id)
      OR (cv.status = 'published' AND c.status = 'published' AND public.academy_catalogue_open())
      OR (public.academy_user_course_access(auth.uid(), c.id)
          AND EXISTS (SELECT 1 FROM public.academy_enrolments e WHERE e.user_id = auth.uid() AND e.course_id = c.id AND e.version_id = cv.id))));
$$;

CREATE OR REPLACE FUNCTION public.academy_can_read_lesson(p_lesson uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.academy_lessons l
    JOIN public.academy_course_versions cv ON cv.id = l.version_id
    JOIN public.academy_courses c ON c.id = cv.course_id
    WHERE l.id = p_lesson AND (
      public.academy_user_staff_for_course(auth.uid(), c.id)
      OR (l.is_free_preview AND cv.status = 'published' AND c.status = 'published' AND public.academy_catalogue_open())
      OR (public.academy_user_course_access(auth.uid(), c.id)
          AND EXISTS (SELECT 1 FROM public.academy_enrolments e WHERE e.user_id = auth.uid() AND e.course_id = c.id AND e.version_id = cv.id))));
$$;

CREATE OR REPLACE FUNCTION public.academy_my_roles() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'is_admin', public.academy_user_is_admin(auth.uid()),
    'roles', COALESCE((SELECT jsonb_agg(jsonb_build_object('role', a.role, 'course_id', a.course_id))
                       FROM public.academy_role_assignments a WHERE a.user_id = auth.uid() AND a.revoked_at IS NULL), '[]'::jsonb));
$$;

CREATE OR REPLACE FUNCTION public.get_academy_public_config() RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT jsonb_build_object(
    'stage', c.rollout_stage,
    'catalogue_open', public.academy_catalogue_open(),
    'paid_enrolment_enabled', c.paid_enrolment_enabled,
    'certificates_enabled', c.certificates_enabled,
    'reviews_enabled', c.reviews_enabled)
  FROM public.academy_config c WHERE c.id;
$$;

-- Only verified, in-date accreditation is ever returned. Nothing else may be shown as an accreditation claim.
CREATE OR REPLACE FUNCTION public.academy_public_accreditation(p_course uuid DEFAULT NULL)
RETURNS TABLE (course_id uuid, scope text, scheme text, body_name text, reference_number text, nqf_level int, credits int, valid_from date, valid_to date)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT a.course_id, a.scope, a.scheme, a.body_name, a.reference_number, a.nqf_level, a.credits, a.valid_from, a.valid_to
  FROM public.academy_accreditations a
  WHERE a.status = 'verified' AND a.valid_from <= current_date AND (a.valid_to IS NULL OR a.valid_to >= current_date)
    AND (a.scope = 'academy' OR p_course IS NULL OR a.course_id = p_course);
$$;

-- Instructor credentials are public only once an admin has verified them (verified_at present).
CREATE OR REPLACE FUNCTION public.academy_public_instructor_credentials(p_instructor uuid) RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(jsonb_agg(c - 'evidence_note' - 'verified_by'), '[]'::jsonb)
  FROM public.academy_instructors i, jsonb_array_elements(i.credentials) c
  WHERE i.id = p_instructor AND i.is_published AND public.academy_catalogue_open()
    AND NULLIF(c ->> 'verified_at', '') IS NOT NULL;
$$;

-- Storage path convention: {course_id}/{asset_id}/{file}; {"shared"}/… is admin-only.
CREATE OR REPLACE FUNCTION public.academy_can_manage_path(p_name text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE seg text := split_part(p_name, '/', 1);
BEGIN
  IF seg = 'shared' THEN RETURN public.academy_user_is_admin(auth.uid()); END IF;
  IF seg !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RETURN false; END IF;
  RETURN public.academy_user_has_role(auth.uid(), 'instructor', seg::uuid);
END $$;

CREATE OR REPLACE FUNCTION public.academy_can_view_path(p_name text) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE seg text := split_part(p_name, '/', 1);
BEGIN
  IF seg = 'shared' THEN RETURN public.academy_user_is_admin(auth.uid()); END IF;
  IF seg !~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' THEN RETURN false; END IF;
  RETURN public.academy_user_staff_for_course(auth.uid(), seg::uuid);
END $$;

-- ---------------------------------------------------------------- triggers

CREATE OR REPLACE FUNCTION public.academy_touch_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

CREATE OR REPLACE TRIGGER academy_courses_touch BEFORE UPDATE ON public.academy_courses FOR EACH ROW EXECUTE FUNCTION public.academy_touch_updated_at();
CREATE OR REPLACE TRIGGER academy_versions_touch BEFORE UPDATE ON public.academy_course_versions FOR EACH ROW EXECUTE FUNCTION public.academy_touch_updated_at();
CREATE OR REPLACE TRIGGER academy_instructors_touch BEFORE UPDATE ON public.academy_instructors FOR EACH ROW EXECUTE FUNCTION public.academy_touch_updated_at();
CREATE OR REPLACE TRIGGER academy_content_touch BEFORE UPDATE ON public.academy_lesson_content FOR EACH ROW EXECUTE FUNCTION public.academy_touch_updated_at();
CREATE OR REPLACE TRIGGER academy_accreditations_touch BEFORE UPDATE ON public.academy_accreditations FOR EACH ROW EXECUTE FUNCTION public.academy_touch_updated_at();

-- Version state machine + frozen content once a version leaves draft/changes_requested.
CREATE OR REPLACE FUNCTION public.academy_version_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.status NOT IN ('draft', 'changes_requested') THEN RAISE EXCEPTION 'academy: a % version cannot be deleted', OLD.status USING ERRCODE = 'check_violation'; END IF;
    RETURN OLD;
  END IF;
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT (
       (OLD.status = 'draft' AND NEW.status = 'in_review')
    OR (OLD.status = 'changes_requested' AND NEW.status = 'in_review')
    OR (OLD.status = 'in_review' AND NEW.status IN ('changes_requested', 'approved'))
    OR (OLD.status = 'approved' AND NEW.status IN ('published', 'changes_requested'))
    OR (OLD.status = 'published' AND NEW.status IN ('superseded', 'archived'))
    OR (OLD.status = 'superseded' AND NEW.status = 'archived')) THEN
    RAISE EXCEPTION 'academy: illegal version transition % -> %', OLD.status, NEW.status USING ERRCODE = 'check_violation';
  END IF;
  IF OLD.status NOT IN ('draft', 'changes_requested') AND (
       NEW.title IS DISTINCT FROM OLD.title OR NEW.subtitle IS DISTINCT FROM OLD.subtitle OR NEW.summary IS DISTINCT FROM OLD.summary
    OR NEW.description_markdown IS DISTINCT FROM OLD.description_markdown OR NEW.learning_objectives IS DISTINCT FROM OLD.learning_objectives
    OR NEW.audience IS DISTINCT FROM OLD.audience OR NEW.prerequisites_note IS DISTINCT FROM OLD.prerequisites_note
    OR NEW.estimated_minutes IS DISTINCT FROM OLD.estimated_minutes OR NEW.completion_rules IS DISTINCT FROM OLD.completion_rules
    OR NEW.cover_image_path IS DISTINCT FROM OLD.cover_image_path OR NEW.seo_title IS DISTINCT FROM OLD.seo_title
    OR NEW.seo_description IS DISTINCT FROM OLD.seo_description OR NEW.course_id IS DISTINCT FROM OLD.course_id
    OR NEW.version_number IS DISTINCT FROM OLD.version_number) THEN
    RAISE EXCEPTION 'academy: version content is frozen once it has left draft' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER academy_version_guard_trg BEFORE UPDATE OR DELETE ON public.academy_course_versions FOR EACH ROW EXECUTE FUNCTION public.academy_version_guard();

-- Child content may only change while its version is editable; lessons stay consistent with their module's version.
CREATE OR REPLACE FUNCTION public.academy_content_freeze() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_version uuid; v_status text; v_row record;
BEGIN
  IF TG_OP = 'DELETE' THEN v_row := OLD; ELSE v_row := NEW; END IF;
  IF TG_TABLE_NAME = 'academy_modules' THEN v_version := v_row.version_id;
  ELSIF TG_TABLE_NAME = 'academy_lessons' THEN
    v_version := v_row.version_id;
    IF TG_OP <> 'DELETE' AND (SELECT m.version_id FROM public.academy_modules m WHERE m.id = NEW.module_id) IS DISTINCT FROM NEW.version_id THEN
      RAISE EXCEPTION 'academy: lesson version must match its module version' USING ERRCODE = 'check_violation';
    END IF;
  ELSE
    v_version := (SELECT l.version_id FROM public.academy_lessons l WHERE l.id = v_row.lesson_id);
  END IF;
  SELECT status INTO v_status FROM public.academy_course_versions WHERE id = v_version;
  -- cascade deletes from a deleted draft version arrive after the version row is gone
  IF v_status IS NOT NULL AND v_status NOT IN ('draft', 'changes_requested') THEN
    RAISE EXCEPTION 'academy: content of a % version is frozen', v_status USING ERRCODE = 'check_violation';
  END IF;
  RETURN v_row;
END $$;
CREATE OR REPLACE TRIGGER academy_modules_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.academy_modules FOR EACH ROW EXECUTE FUNCTION public.academy_content_freeze();
CREATE OR REPLACE TRIGGER academy_lessons_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.academy_content_freeze();
CREATE OR REPLACE TRIGGER academy_lesson_content_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.academy_lesson_content FOR EACH ROW EXECUTE FUNCTION public.academy_content_freeze();
CREATE OR REPLACE TRIGGER academy_lesson_assets_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.academy_lesson_assets FOR EACH ROW EXECUTE FUNCTION public.academy_content_freeze();
CREATE OR REPLACE TRIGGER academy_sources_freeze BEFORE INSERT OR UPDATE OR DELETE ON public.academy_sources FOR EACH ROW EXECUTE FUNCTION public.academy_content_freeze();

CREATE OR REPLACE FUNCTION public.academy_review_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.reviewer_id = (SELECT created_by FROM public.academy_course_versions WHERE id = NEW.version_id) THEN
    RAISE EXCEPTION 'academy: the author of a version cannot review it' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER academy_review_guard_trg BEFORE INSERT ON public.academy_publication_reviews FOR EACH ROW EXECUTE FUNCTION public.academy_review_guard();

CREATE OR REPLACE FUNCTION public.academy_prereq_cycle_guard() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (
    WITH RECURSIVE chain(cid) AS (
      SELECT NEW.requires_course_id
      UNION
      SELECT p.requires_course_id FROM public.academy_course_prerequisites p JOIN chain ON p.course_id = chain.cid)
    SELECT 1 FROM chain WHERE cid = NEW.course_id) THEN
    RAISE EXCEPTION 'academy: prerequisite cycle' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER academy_prereq_cycle_trg BEFORE INSERT OR UPDATE ON public.academy_course_prerequisites FOR EACH ROW EXECUTE FUNCTION public.academy_prereq_cycle_guard();

-- "verified" can only be set through academy_admin_verify_accreditation() (which sets app.academy_verify for the statement).
CREATE OR REPLACE FUNCTION public.academy_accreditation_guard() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE v_was_verified boolean := false;
BEGIN
  IF TG_OP = 'UPDATE' THEN v_was_verified := (OLD.status = 'verified'); END IF;
  IF NEW.status = 'verified' AND NOT v_was_verified AND coalesce(current_setting('app.academy_verify', true), '') <> 'on' THEN
    RAISE EXCEPTION 'academy: accreditation can only be verified through academy_admin_verify_accreditation()' USING ERRCODE = 'insufficient_privilege';
  END IF;
  IF v_was_verified AND NEW.status = 'verified'
     AND (NEW.reference_number IS DISTINCT FROM OLD.reference_number OR NEW.body_name IS DISTINCT FROM OLD.body_name
          OR NEW.evidence_asset_id IS DISTINCT FROM OLD.evidence_asset_id OR NEW.scheme IS DISTINCT FROM OLD.scheme
          OR NEW.valid_from IS DISTINCT FROM OLD.valid_from OR NEW.valid_to IS DISTINCT FROM OLD.valid_to) THEN
    RAISE EXCEPTION 'academy: a verified accreditation cannot be edited; withdraw it and record a new one' USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END $$;
CREATE OR REPLACE TRIGGER academy_accreditation_guard_trg BEFORE INSERT OR UPDATE ON public.academy_accreditations FOR EACH ROW EXECUTE FUNCTION public.academy_accreditation_guard();

-- The audit log is append-only even for privileged sessions.
CREATE OR REPLACE FUNCTION public.academy_audit_append_only() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN RAISE EXCEPTION 'academy_audit_log is append-only' USING ERRCODE = 'insufficient_privilege'; END $$;
CREATE OR REPLACE TRIGGER academy_audit_no_update BEFORE UPDATE OR DELETE ON public.academy_audit_log FOR EACH ROW EXECUTE FUNCTION public.academy_audit_append_only();

-- ---------------------------------------------------------------- publish gate

CREATE OR REPLACE FUNCTION public.academy_validate_version(p_version uuid) RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  cv public.academy_course_versions; co public.academy_courses;
  issues text[] := '{}'; r record; hay text := ''; verified_acc boolean;
BEGIN
  SELECT * INTO cv FROM public.academy_course_versions WHERE id = p_version;
  IF NOT FOUND THEN RETURN '["version_not_found"]'::jsonb; END IF;
  SELECT * INTO co FROM public.academy_courses WHERE id = cv.course_id;

  IF coalesce(trim(cv.title), '') = '' THEN issues := array_append(issues, 'missing_title'); END IF;
  IF coalesce(trim(cv.summary), '') = '' THEN issues := array_append(issues, 'missing_summary'); END IF;
  IF jsonb_array_length(cv.learning_objectives) = 0 THEN issues := array_append(issues, 'missing_course_objectives'); END IF;
  IF co.access_model IN ('paid', 'members_or_paid') AND (co.price_zar IS NULL OR co.price_zar <= 0) THEN issues := array_append(issues, 'missing_price'); END IF;
  IF co.access_model IN ('members', 'members_or_paid') AND cardinality(co.member_tiers_included) = 0 THEN issues := array_append(issues, 'missing_member_tiers'); END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academy_course_instructors ci JOIN public.academy_instructors i ON i.id = ci.instructor_id
                 WHERE ci.course_id = cv.course_id AND ci.role = 'lead' AND i.is_published) THEN
    issues := array_append(issues, 'missing_published_lead_instructor');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.academy_modules WHERE version_id = p_version) THEN issues := array_append(issues, 'no_modules'); END IF;

  hay := concat_ws(' ', cv.title, cv.subtitle, cv.summary, cv.description_markdown, cv.audience, cv.prerequisites_note, cv.seo_title, cv.seo_description, cv.learning_objectives::text);

  FOR r IN SELECT m.id, m.position, m.title, m.summary, (SELECT count(*) FROM public.academy_lessons l WHERE l.module_id = m.id) AS lessons
           FROM public.academy_modules m WHERE m.version_id = p_version LOOP
    IF r.lessons = 0 THEN issues := issues || format('module_%s_has_no_lessons', r.position); END IF;
    hay := hay || ' ' || concat_ws(' ', r.title, r.summary);
  END LOOP;

  FOR r IN SELECT l.id, l.position, m.position AS mpos, l.title, l.summary, l.lesson_type, l.makes_claims, l.mentions_accreditation_topic,
                  jsonb_array_length(l.objectives) AS n_obj, lc.lesson_id IS NOT NULL AS has_content,
                  coalesce(jsonb_array_length(lc.body_blocks), 0) AS n_blocks, coalesce(trim(lc.transcript_markdown), '') AS transcript,
                  lc.body_blocks::text AS body_text,
                  EXISTS (SELECT 1 FROM public.academy_lesson_assets la WHERE la.lesson_id = l.id AND la.role = 'primary_audio') AS has_audio,
                  EXISTS (SELECT 1 FROM public.academy_lesson_assets la WHERE la.lesson_id = l.id AND la.role = 'download') AS has_download,
                  EXISTS (SELECT 1 FROM public.academy_sources s WHERE s.lesson_id = l.id AND s.verification_status IN ('checked', 'verified')) AS has_source
           FROM public.academy_lessons l JOIN public.academy_modules m ON m.id = l.module_id
           LEFT JOIN public.academy_lesson_content lc ON lc.lesson_id = l.id
           WHERE l.version_id = p_version ORDER BY m.position, l.position LOOP
    IF r.n_obj = 0 THEN issues := issues || format('lesson_%s.%s_missing_objectives', r.mpos, r.position); END IF;
    IF NOT r.has_content OR r.n_blocks = 0 THEN issues := issues || format('lesson_%s.%s_missing_content', r.mpos, r.position); END IF;
    IF r.lesson_type IN ('audio', 'mixed') AND r.has_audio AND r.transcript = '' THEN issues := issues || format('lesson_%s.%s_audio_needs_transcript', r.mpos, r.position); END IF;
    IF r.lesson_type = 'audio' AND NOT r.has_audio THEN issues := issues || format('lesson_%s.%s_missing_audio', r.mpos, r.position); END IF;
    IF r.lesson_type = 'pdf' AND NOT r.has_download THEN issues := issues || format('lesson_%s.%s_missing_pdf', r.mpos, r.position); END IF;
    IF r.makes_claims AND NOT r.has_source THEN issues := issues || format('lesson_%s.%s_needs_checked_source', r.mpos, r.position); END IF;
    hay := hay || ' ' || concat_ws(' ', r.title, r.summary);
    IF NOT r.mentions_accreditation_topic THEN hay := hay || ' ' || coalesce(r.body_text, '') || ' ' || r.transcript; END IF;
  END LOOP;

  FOR r IN SELECT DISTINCT a.id, a.title, a.kind, a.alt_text, a.is_decorative, a.rights_note, a.duration_seconds
           FROM public.academy_lesson_assets la JOIN public.academy_assets a ON a.id = la.asset_id
           JOIN public.academy_lessons l ON l.id = la.lesson_id WHERE l.version_id = p_version LOOP
    IF coalesce(trim(r.rights_note), '') = '' THEN issues := issues || format('asset_%s_missing_rights_note', r.id); END IF;
    IF r.kind = 'image' AND NOT r.is_decorative AND coalesce(trim(r.alt_text), '') = '' THEN issues := issues || format('asset_%s_missing_alt_text', r.id); END IF;
    IF r.kind = 'audio' AND r.duration_seconds IS NULL THEN issues := issues || format('asset_%s_missing_duration', r.id); END IF;
  END LOOP;

  -- Accreditation vocabulary: no claims unless a verified, in-date record exists for the course (or academy).
  SELECT EXISTS (SELECT 1 FROM public.academy_public_accreditation(cv.course_id)) INTO verified_acc;
  IF NOT verified_acc AND lower(regexp_replace(hay, 'accreditation-ready', '', 'gi')) ~ '\m(saqa|nqf|qcto|seta|cpd|accredit[a-z]*|diploma|qualification)\M' THEN
    issues := array_append(issues, 'unverified_accreditation_or_qualification_wording');
  END IF;
  RETURN to_jsonb(issues);
END $$;

-- ---------------------------------------------------------------- workflow RPCs

CREATE OR REPLACE FUNCTION public.academy_submit_version_for_review(p_version uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cv public.academy_course_versions; v_issues jsonb;
BEGIN
  SELECT * INTO cv FROM public.academy_course_versions WHERE id = p_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'academy: version not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT public.academy_user_has_role(auth.uid(), 'instructor', cv.course_id) THEN RAISE EXCEPTION 'academy: not allowed' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF cv.status NOT IN ('draft', 'changes_requested') THEN RAISE EXCEPTION 'academy: version is not editable' USING ERRCODE = 'check_violation'; END IF;
  v_issues := public.academy_validate_version(p_version);
  IF jsonb_array_length(v_issues) > 0 THEN RAISE EXCEPTION 'academy: version_not_valid %', v_issues::text USING ERRCODE = 'check_violation'; END IF;
  UPDATE public.academy_course_versions SET status = 'in_review', submitted_at = now() WHERE id = p_version;
  PERFORM public.academy_audit('version_submitted', 'academy_course_version', p_version, jsonb_build_object('course_id', cv.course_id));
END $$;

CREATE OR REPLACE FUNCTION public.academy_review_version(p_version uuid, p_role_in_review text, p_decision text, p_checklist jsonb DEFAULT '{}'::jsonb, p_comments text DEFAULT NULL) RETURNS text
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cv public.academy_course_versions; v_claims boolean; v_status text;
BEGIN
  SELECT * INTO cv FROM public.academy_course_versions WHERE id = p_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'academy: version not found' USING ERRCODE = 'no_data_found'; END IF;
  IF NOT public.academy_user_has_role(auth.uid(), 'reviewer', cv.course_id) THEN RAISE EXCEPTION 'academy: not allowed' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF cv.status <> 'in_review' THEN RAISE EXCEPTION 'academy: version is not in review' USING ERRCODE = 'check_violation'; END IF;
  INSERT INTO public.academy_publication_reviews (version_id, reviewer_id, role_in_review, decision, checklist, comments)
  VALUES (p_version, auth.uid(), p_role_in_review, p_decision, coalesce(p_checklist, '{}'::jsonb), p_comments);
  v_status := cv.status;
  IF p_decision = 'changes_requested' THEN
    UPDATE public.academy_course_versions SET status = 'changes_requested' WHERE id = p_version;
    v_status := 'changes_requested';
  ELSE
    SELECT EXISTS (SELECT 1 FROM public.academy_lessons WHERE version_id = p_version AND makes_claims) INTO v_claims;
    IF EXISTS (SELECT 1 FROM public.academy_publication_reviews r WHERE r.version_id = p_version AND r.role_in_review = 'editorial' AND r.decision = 'approved' AND r.created_at >= cv.submitted_at)
       AND (NOT v_claims OR EXISTS (SELECT 1 FROM public.academy_publication_reviews r WHERE r.version_id = p_version AND r.role_in_review = 'subject_matter' AND r.decision = 'approved' AND r.created_at >= cv.submitted_at)) THEN
      UPDATE public.academy_course_versions SET status = 'approved', approved_by = auth.uid(), approved_at = now() WHERE id = p_version;
      v_status := 'approved';
    END IF;
  END IF;
  PERFORM public.academy_audit('version_reviewed', 'academy_course_version', p_version, jsonb_build_object('role', p_role_in_review, 'decision', p_decision, 'resulting_status', v_status));
  RETURN v_status;
END $$;

CREATE OR REPLACE FUNCTION public.academy_admin_publish_version(p_version uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE cv public.academy_course_versions; v_issues jsonb; v_hash text;
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  SELECT * INTO cv FROM public.academy_course_versions WHERE id = p_version;
  IF NOT FOUND THEN RAISE EXCEPTION 'academy: version not found' USING ERRCODE = 'no_data_found'; END IF;
  IF cv.status <> 'approved' THEN RAISE EXCEPTION 'academy: only an approved version can be published' USING ERRCODE = 'check_violation'; END IF;
  v_issues := public.academy_validate_version(p_version);
  IF jsonb_array_length(v_issues) > 0 THEN RAISE EXCEPTION 'academy: version_not_valid %', v_issues::text USING ERRCODE = 'check_violation'; END IF;
  SELECT md5(concat_ws('|', cv.title, cv.summary, cv.description_markdown, cv.learning_objectives::text, cv.completion_rules::text,
           (SELECT string_agg(concat_ws('~', m.position, m.title, l.position, l.slug, l.title, l.lesson_type, coalesce(lc.body_blocks::text, ''), coalesce(lc.transcript_markdown, '')), '|' ORDER BY m.position, l.position)
              FROM public.academy_modules m JOIN public.academy_lessons l ON l.module_id = m.id
              LEFT JOIN public.academy_lesson_content lc ON lc.lesson_id = l.id WHERE m.version_id = p_version)))
    INTO v_hash;
  UPDATE public.academy_course_versions SET status = 'superseded' WHERE course_id = cv.course_id AND status = 'published';
  UPDATE public.academy_course_versions SET status = 'published', published_by = auth.uid(), published_at = now(), content_hash = v_hash WHERE id = p_version;
  UPDATE public.academy_courses SET status = 'published', current_version_id = p_version WHERE id = cv.course_id;
  PERFORM public.academy_audit('version_published', 'academy_course_version', p_version, jsonb_build_object('course_id', cv.course_id, 'content_hash', v_hash));
END $$;

CREATE OR REPLACE FUNCTION public.academy_admin_unpublish_course(p_course uuid, p_reason text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF coalesce(trim(p_reason), '') = '' THEN RAISE EXCEPTION 'academy: a reason is required' USING ERRCODE = 'check_violation'; END IF;
  UPDATE public.academy_courses SET status = 'unpublished' WHERE id = p_course AND status = 'published';
  IF NOT FOUND THEN RAISE EXCEPTION 'academy: course is not published' USING ERRCODE = 'no_data_found'; END IF;
  PERFORM public.academy_audit('course_unpublished', 'academy_course', p_course, jsonb_build_object('reason', p_reason));
END $$;

-- ---------------------------------------------------------------- admin RPCs

CREATE OR REPLACE FUNCTION public.academy_admin_set_config(p_stage text DEFAULT NULL, p_paid boolean DEFAULT NULL, p_certificates boolean DEFAULT NULL, p_reviews boolean DEFAULT NULL) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_stage IS NOT NULL AND p_stage NOT IN ('disabled', 'preview', 'public') THEN RAISE EXCEPTION 'academy: invalid stage' USING ERRCODE = 'check_violation'; END IF;
  UPDATE public.academy_config SET rollout_stage = coalesce(p_stage, rollout_stage), paid_enrolment_enabled = coalesce(p_paid, paid_enrolment_enabled),
    certificates_enabled = coalesce(p_certificates, certificates_enabled), reviews_enabled = coalesce(p_reviews, reviews_enabled),
    updated_at = now(), updated_by = auth.uid() WHERE id;
  PERFORM public.academy_audit('config_changed', 'academy_config', NULL, jsonb_build_object('stage', p_stage, 'paid', p_paid, 'certificates', p_certificates, 'reviews', p_reviews));
  RETURN public.get_academy_public_config();
END $$;

CREATE OR REPLACE FUNCTION public.academy_admin_assign_role(p_user uuid, p_role text, p_course uuid DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  INSERT INTO public.academy_role_assignments (user_id, role, course_id, granted_by) VALUES (p_user, p_role, p_course, auth.uid()) RETURNING id INTO v_id;
  PERFORM public.academy_audit('role_granted', 'academy_role_assignment', v_id, jsonb_build_object('user_id', p_user, 'role', p_role, 'course_id', p_course));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.academy_admin_revoke_role(p_assignment uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  UPDATE public.academy_role_assignments SET revoked_at = now() WHERE id = p_assignment AND revoked_at IS NULL;
  IF NOT FOUND THEN RAISE EXCEPTION 'academy: assignment not found' USING ERRCODE = 'no_data_found'; END IF;
  PERFORM public.academy_audit('role_revoked', 'academy_role_assignment', p_assignment, '{}'::jsonb);
END $$;

-- Records/changes accreditation WORKING state. 'verified' is refused here on purpose.
CREATE OR REPLACE FUNCTION public.academy_admin_save_accreditation(
  p_id uuid, p_course uuid, p_scope text, p_scheme text, p_body text, p_reference text, p_nqf int, p_credits int,
  p_status text, p_valid_from date, p_valid_to date, p_evidence uuid, p_notes text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_status = 'verified' THEN RAISE EXCEPTION 'academy: use academy_admin_verify_accreditation() to verify' USING ERRCODE = 'insufficient_privilege'; END IF;
  IF p_id IS NULL THEN
    INSERT INTO public.academy_accreditations (course_id, scope, scheme, body_name, reference_number, nqf_level, credits, status, valid_from, valid_to, evidence_asset_id, notes)
    VALUES (p_course, p_scope, p_scheme, p_body, p_reference, p_nqf, p_credits, p_status, p_valid_from, p_valid_to, p_evidence, p_notes) RETURNING id INTO v_id;
  ELSE
    UPDATE public.academy_accreditations SET scheme = p_scheme, body_name = p_body, reference_number = p_reference, nqf_level = p_nqf, credits = p_credits,
      status = p_status, valid_from = p_valid_from, valid_to = p_valid_to, evidence_asset_id = p_evidence, notes = p_notes WHERE id = p_id RETURNING id INTO v_id;
    IF v_id IS NULL THEN RAISE EXCEPTION 'academy: accreditation not found' USING ERRCODE = 'no_data_found'; END IF;
  END IF;
  PERFORM public.academy_audit('accreditation_saved', 'academy_accreditation', v_id, jsonb_build_object('status', p_status, 'scheme', p_scheme));
  RETURN v_id;
END $$;

CREATE OR REPLACE FUNCTION public.academy_admin_verify_accreditation(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.academy_user_is_admin(auth.uid()) THEN RAISE EXCEPTION 'academy: admin only' USING ERRCODE = 'insufficient_privilege'; END IF;
  PERFORM set_config('app.academy_verify', 'on', true);
  UPDATE public.academy_accreditations SET status = 'verified', verified_by = auth.uid(), verified_at = now() WHERE id = p_id;
  PERFORM set_config('app.academy_verify', 'off', true);
  IF NOT FOUND THEN RAISE EXCEPTION 'academy: accreditation not found' USING ERRCODE = 'no_data_found'; END IF;
  PERFORM public.academy_audit('accreditation_verified', 'academy_accreditation', p_id, '{}'::jsonb);
END $$;

-- ---------------------------------------------------------------- function privileges

DO $$
DECLARE f text;
BEGIN
  FOREACH f IN ARRAY ARRAY[
    'academy_user_is_admin(uuid)', 'academy_user_has_role(uuid,text,uuid)', 'academy_user_is_staff(uuid)', 'academy_user_staff_for_course(uuid,uuid)',
    'academy_user_tier(uuid)', 'academy_user_course_access(uuid,uuid)', 'academy_audit(text,text,uuid,jsonb)']
  LOOP EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon, authenticated', f); END LOOP;

  -- read helpers used by RLS policies (must be executable by the querying role) and public reads
  FOREACH f IN ARRAY ARRAY[
    'academy_is_admin()', 'academy_is_staff()', 'academy_staff_for_course(uuid)', 'academy_catalogue_open()', 'academy_can_access_course(uuid)',
    'academy_version_readable(uuid)', 'academy_can_read_lesson(uuid)', 'academy_my_roles()', 'get_academy_public_config()',
    'academy_public_accreditation(uuid)', 'academy_public_instructor_credentials(uuid)', 'academy_can_manage_path(text)', 'academy_can_view_path(text)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO anon, authenticated, service_role', f);
  END LOOP;

  -- validator + workflow + admin RPCs: signed-in only; each re-checks its own role
  FOREACH f IN ARRAY ARRAY[
    'academy_validate_version(uuid)', 'academy_submit_version_for_review(uuid)', 'academy_review_version(uuid,text,text,jsonb,text)',
    'academy_admin_publish_version(uuid)', 'academy_admin_unpublish_course(uuid,text)', 'academy_admin_set_config(text,boolean,boolean,boolean)',
    'academy_admin_assign_role(uuid,text,uuid)', 'academy_admin_revoke_role(uuid)',
    'academy_admin_save_accreditation(uuid,uuid,text,text,text,text,int,int,text,date,date,uuid,text)', 'academy_admin_verify_accreditation(uuid)']
  LOOP
    EXECUTE format('REVOKE ALL ON FUNCTION public.%s FROM PUBLIC, anon', f);
    EXECUTE format('GRANT EXECUTE ON FUNCTION public.%s TO authenticated, service_role', f);
  END LOOP;
END $$;

-- ---------------------------------------------------------------- table grants + RLS policies

GRANT SELECT (id, slug, name, description, sort_order, is_published) ON public.academy_categories TO anon, authenticated;
CREATE POLICY academy_categories_read ON public.academy_categories FOR SELECT TO anon, authenticated
  USING ((is_published AND public.academy_catalogue_open()) OR public.academy_is_staff());

GRANT SELECT (id, slug, display_name, headline, bio_markdown, photo_path, is_published) ON public.academy_instructors TO anon, authenticated;
CREATE POLICY academy_instructors_read ON public.academy_instructors FOR SELECT TO anon, authenticated
  USING ((is_published AND public.academy_catalogue_open()) OR public.academy_is_staff());

GRANT SELECT (id, slug, category_id, current_version_id, status, level, language, access_model, member_tiers_included, price_zar, refund_window_days, created_at, updated_at, archived_at)
  ON public.academy_courses TO anon, authenticated;
CREATE POLICY academy_courses_read ON public.academy_courses FOR SELECT TO anon, authenticated
  USING ((status = 'published' AND public.academy_catalogue_open()) OR public.academy_staff_for_course(id));

GRANT SELECT (id, course_id, version_number, status, title, subtitle, summary, description_markdown, learning_objectives, audience, prerequisites_note,
              estimated_minutes, completion_rules, cover_image_path, seo_title, seo_description, published_at, created_at)
  ON public.academy_course_versions TO anon, authenticated;
CREATE POLICY academy_versions_read ON public.academy_course_versions FOR SELECT TO anon, authenticated USING (public.academy_version_readable(id));

GRANT SELECT ON public.academy_modules TO anon, authenticated;
CREATE POLICY academy_modules_read ON public.academy_modules FOR SELECT TO anon, authenticated USING (public.academy_version_readable(version_id));

GRANT SELECT ON public.academy_lessons TO anon, authenticated;
CREATE POLICY academy_lessons_read ON public.academy_lessons FOR SELECT TO anon, authenticated USING (public.academy_version_readable(version_id));

GRANT SELECT ON public.academy_lesson_content TO anon, authenticated;
CREATE POLICY academy_lesson_content_read ON public.academy_lesson_content FOR SELECT TO anon, authenticated USING (public.academy_can_read_lesson(lesson_id));

GRANT SELECT (id, lesson_id, citation_text, url, doi, pmid, source_type, accessed_on, supports_claim, verification_status) ON public.academy_sources TO anon, authenticated;
CREATE POLICY academy_sources_read ON public.academy_sources FOR SELECT TO anon, authenticated
  USING (public.academy_can_read_lesson(lesson_id) AND (verification_status IN ('checked', 'verified') OR public.academy_is_staff()));

GRANT SELECT ON public.academy_course_instructors TO anon, authenticated;
CREATE POLICY academy_course_instructors_read ON public.academy_course_instructors FOR SELECT TO anon, authenticated
  USING (public.academy_staff_for_course(course_id) OR (public.academy_catalogue_open() AND EXISTS (SELECT 1 FROM public.academy_courses c WHERE c.id = course_id AND c.status = 'published')));

GRANT SELECT ON public.academy_course_prerequisites TO anon, authenticated;
CREATE POLICY academy_course_prereq_read ON public.academy_course_prerequisites FOR SELECT TO anon, authenticated
  USING (public.academy_staff_for_course(course_id) OR (public.academy_catalogue_open() AND EXISTS (SELECT 1 FROM public.academy_courses c WHERE c.id = course_id AND c.status = 'published')));

GRANT SELECT (id, user_id, course_id, version_id, source, status, access_expires_at, enrolled_at, last_activity_at, completed_at, progress_pct) ON public.academy_enrolments TO authenticated;
CREATE POLICY academy_enrolments_own ON public.academy_enrolments FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));

GRANT SELECT ON public.academy_audit_log TO authenticated;
CREATE POLICY academy_audit_admin_read ON public.academy_audit_log FOR SELECT TO authenticated USING (public.academy_is_admin());

-- config, role assignments, assets, lesson assets, publication reviews, accreditations: no client access at all
-- (RLS on, no policies, no grants). Studio/admin RPCs and service_role are the only paths.

-- ---------------------------------------------------------------- storage

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
  ('academy-audio', 'academy-audio', false, 104857600, ARRAY['audio/mpeg', 'audio/mp4', 'audio/x-m4a']),
  ('academy-resources', 'academy-resources', false, 26214400, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('academy-course-media', 'academy-course-media', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Academy staff upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id IN ('academy-audio', 'academy-resources', 'academy-course-media') AND public.academy_can_manage_path(name));
CREATE POLICY "Academy staff update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id IN ('academy-audio', 'academy-resources', 'academy-course-media') AND public.academy_can_manage_path(name));
CREATE POLICY "Academy staff delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id IN ('academy-audio', 'academy-resources', 'academy-course-media') AND public.academy_can_manage_path(name));
CREATE POLICY "Academy staff read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id IN ('academy-audio', 'academy-resources', 'academy-course-media') AND public.academy_can_view_path(name));
