-- Onboarding overhaul 08: Getting Started checklist data.
--
-- 1. profiles.checklist_dismissed_at — set by the member when they hide the
--    completed checklist. Owner-only via the existing profiles RLS policy; the
--    column-level grant keeps every other column as locked down as before.
-- 2. member_content_reads — the first time a signed-in member reads a full
--    product review or plays a podcast episode. Powers "Read one full review
--    or episode" and is a reusable engagement fact (one row per member/item).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS checklist_dismissed_at timestamptz;
COMMENT ON COLUMN public.profiles.checklist_dismissed_at IS
  'When the member dismissed the completed Getting Started checklist (dashboard). NULL = still shown.';
GRANT UPDATE (checklist_dismissed_at) ON public.profiles TO authenticated;

CREATE TABLE IF NOT EXISTS public.member_content_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_type text NOT NULL CHECK (content_type IN ('review', 'episode')),
  slug text NOT NULL CHECK (char_length(slug) BETWEEN 1 AND 200),
  first_read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_type, slug)
);
COMMENT ON TABLE public.member_content_reads IS
  'First full read of a review / play of an episode per signed-in member. Insert-once (ON CONFLICT DO NOTHING); owner read.';

ALTER TABLE public.member_content_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members read their own content reads" ON public.member_content_reads
  FOR SELECT TO authenticated USING (user_id = (select auth.uid()));
CREATE POLICY "Members record their own content reads" ON public.member_content_reads
  FOR INSERT TO authenticated WITH CHECK (user_id = (select auth.uid()));

REVOKE ALL ON public.member_content_reads FROM anon, authenticated;
GRANT SELECT, INSERT ON public.member_content_reads TO authenticated;
