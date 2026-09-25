-- Onboarding overhaul 02: record when a member finishes onboarding.
--
-- NULL means onboarding hasn't been completed. src/components/IntentResolver.tsx
-- routes a brand-new account (created < 10 minutes ago) with this column NULL to
-- the welcome flow (prompt 07; /dashboard until then). The owner may set it
-- themselves: it only controls where the app sends them after sign-up and
-- grants nothing, so it isn't one of the privileged profile columns.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

COMMENT ON COLUMN public.profiles.onboarding_completed_at IS
  'When the member completed onboarding (NULL = not yet). Owner-writable; UX routing only, grants nothing.';

-- profiles uses column-level UPDATE grants; the existing owner-only RLS UPDATE
-- policy ("Users can update their own profile") still restricts the row.
GRANT UPDATE (onboarding_completed_at) ON public.profiles TO authenticated;
