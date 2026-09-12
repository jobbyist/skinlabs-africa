-- Cookie consent attribution for authenticated users.
-- Reuses public.profiles; adds nullable columns so existing rows remain valid.
-- RLS: users can only update their own profile (existing policies already enforce this).

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS cookie_consent TEXT,
  ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cookie_consent_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cookie_consent_version TEXT,
  ADD COLUMN IF NOT EXISTS cookie_preferences JSONB;

COMMENT ON COLUMN public.profiles.cookie_consent IS 'accepted | rejected — last cookie consent decision';
COMMENT ON COLUMN public.profiles.cookie_consent_at IS 'When the consent decision was recorded';
COMMENT ON COLUMN public.profiles.cookie_consent_expires_at IS 'Consent valid until this timestamp (typically +90 days)';
COMMENT ON COLUMN public.profiles.cookie_consent_version IS 'Policy version string (e.g. v1); mismatch forces re-consent';
COMMENT ON COLUMN public.profiles.cookie_preferences IS 'JSON { analytics, personalisation, targetedAdvertising }';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles'
      AND policyname = 'Users can update own cookie consent'
  ) THEN
    CREATE POLICY "Users can update own cookie consent"
      ON public.profiles
      FOR UPDATE
      TO authenticated
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
