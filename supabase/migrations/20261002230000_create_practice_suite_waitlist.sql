-- Practice Suite early-access sign-ups (private beta, January 2027).
-- Mirrors the openhaus_waitlist pattern: anyone can submit, only admins can read.
-- Collects practice-level details only; never patient information.

CREATE TABLE IF NOT EXISTS public.practice_suite_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL CHECK (char_length(full_name) BETWEEN 1 AND 120),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  role TEXT NOT NULL CHECK (char_length(role) <= 80),
  practice_type TEXT NOT NULL CHECK (char_length(practice_type) <= 80),
  practitioner_count TEXT NOT NULL CHECK (char_length(practitioner_count) <= 40),
  province TEXT NOT NULL CHECK (char_length(province) <= 40),
  admin_pain TEXT CHECK (admin_pain IS NULL OR char_length(admin_pain) <= 1000),
  -- POPIA: consent to be contacted about early access, recorded with the row.
  contact_consent BOOLEAN NOT NULL CHECK (contact_consent IS TRUE),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One entry per email address (case-insensitive).
CREATE UNIQUE INDEX IF NOT EXISTS practice_suite_waitlist_email_key
  ON public.practice_suite_waitlist (lower(email));

GRANT INSERT ON public.practice_suite_waitlist TO anon, authenticated;
GRANT SELECT ON public.practice_suite_waitlist TO authenticated;
GRANT ALL ON public.practice_suite_waitlist TO service_role;

ALTER TABLE public.practice_suite_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can join the Practice Suite waitlist"
  ON public.practice_suite_waitlist FOR INSERT
  TO anon, authenticated
  WITH CHECK (contact_consent IS TRUE);

CREATE POLICY "Admins can view the Practice Suite waitlist"
  ON public.practice_suite_waitlist FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
