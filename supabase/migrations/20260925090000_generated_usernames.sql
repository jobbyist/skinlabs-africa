-- Onboarding overhaul 04: lighter sign-up.
--
-- Sign-up no longer asks for a username. The profile-creation trigger gives
-- every new account a placeholder handle, `glow_` + 6 random characters
-- (retried until unique), and flags it with `username_generated` so the
-- comment form can ask for a real handle exactly once, the first time the
-- member comments.
--
-- Existing usernames are untouched: the flag defaults to false, and a
-- username passed in sign-up metadata (older clients) still wins.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username_generated boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.username_generated IS
  'True while username is the placeholder assigned at sign-up (glow_xxxxxx). Cleared automatically when the member sets their own username.';

-- Placeholder handle: glow_ + 6 chars from an unambiguous alphabet
-- (no 0/o/1/l), always matching is_username_available()'s ^[a-zA-Z0-9_]{3,20}$.
CREATE OR REPLACE FUNCTION public.generate_placeholder_username()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  v_alphabet constant text := 'abcdefghijkmnpqrstuvwxyz23456789';
  v_candidate text;
  v_attempt int := 0;
BEGIN
  LOOP
    v_attempt := v_attempt + 1;
    SELECT 'glow_' || string_agg(substr(v_alphabet, 1 + floor(random() * length(v_alphabet))::int, 1), '')
      INTO v_candidate
      FROM generate_series(1, 6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_candidate));
    IF v_attempt >= 50 THEN
      RAISE EXCEPTION 'could not generate a unique placeholder username';
    END IF;
  END LOOP;
  RETURN v_candidate;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_placeholder_username() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_username TEXT := nullif(trim(NEW.raw_user_meta_data ->> 'username'), '');
  v_generated boolean := v_username IS NULL;
  v_marketing_consent boolean := coalesce((NEW.raw_user_meta_data ->> 'marketing_consent')::boolean, false);
  v_attempt int := 0;
BEGIN
  IF NOT v_generated AND EXISTS (
    SELECT 1 FROM public.profiles WHERE lower(username) = lower(v_username)
  ) THEN
    v_username := v_username || floor(random() * 9000 + 1000)::text;
  END IF;

  LOOP
    IF v_generated THEN
      v_username := public.generate_placeholder_username();
    END IF;
    BEGIN
      INSERT INTO public.profiles (
        user_id, email, username, username_generated, full_name, marketing_consent, marketing_consent_at
      )
      VALUES (
        NEW.id, NEW.email, v_username, v_generated, nullif(trim(NEW.raw_user_meta_data ->> 'full_name'), ''),
        v_marketing_consent, CASE WHEN v_marketing_consent THEN now() ELSE NULL END
      );
      EXIT;
    EXCEPTION WHEN unique_violation THEN
      -- Only a concurrent sign-up grabbing the same placeholder lands here;
      -- draw a new one. Anything else is a real error.
      v_attempt := v_attempt + 1;
      IF NOT v_generated OR v_attempt >= 5 THEN
        RAISE;
      END IF;
    END;
  END LOOP;
  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Choosing a username (comment handle prompt, dashboard Profile tab) clears
-- the placeholder flag. Clients can't write username_generated directly: it
-- has no column-level UPDATE grant.
CREATE OR REPLACE FUNCTION public.clear_username_generated()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    NEW.username_generated := false;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.clear_username_generated() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS profiles_clear_username_generated ON public.profiles;
CREATE TRIGGER profiles_clear_username_generated
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.clear_username_generated();
