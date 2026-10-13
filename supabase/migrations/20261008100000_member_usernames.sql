-- Member usernames (8 Oct 2026): every member has one, members can customise it with live
-- availability checks + suggestions, and the sign-in form accepts a username as well as an email.
--
-- * New accounts already get a glow_xxxxxx placeholder (20260925090000). This backfills any older
--   profile that has none, flagged username_generated so the "pick your own" prompts still apply.
-- * UPDATE OF username is validated server-side (format, reserved words, glow_ prefix kept for
--   placeholders), so the rule holds even if a client skips the UI checks.
-- * check_usernames() answers "can I have this?" for up to 12 candidates in one round trip
--   (typed value + suggestions). Authenticated only; returns a status token, never other members' data.
-- * Sign-in by username is resolved server-side by the username-login edge function (service role);
--   no RPC here maps a username to an email.

DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT user_id FROM public.profiles WHERE username IS NULL OR btrim(username) = '' LOOP
    UPDATE public.profiles SET username = public.generate_placeholder_username() WHERE user_id = r.user_id;
    -- Changing username clears the flag (profiles_clear_username_generated); set it back for system names.
    UPDATE public.profiles SET username_generated = true WHERE user_id = r.user_id;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.username_reserved(p_username text)
RETURNS boolean
LANGUAGE sql
IMMUTABLE
SET search_path = public
AS $$
  SELECT lower(p_username) = ANY (ARRAY[
    'admin','administrator','root','support','help','info','contact','staff','moderator','mod',
    'skinlabs','skinlabsafrica','skynn','skynnai','openhaus','team','official','security','billing',
    'null','undefined','anonymous','system','noreply','reports','feedback','consult'
  ]);
$$;

CREATE OR REPLACE FUNCTION public.validate_profile_username()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.username IS DISTINCT FROM OLD.username THEN
    IF NEW.username IS NULL OR NEW.username !~ '^[a-zA-Z0-9_]{3,20}$' THEN
      RAISE EXCEPTION 'Username must be 3-20 letters, numbers or underscores' USING ERRCODE = '22023';
    END IF;
    IF NEW.username ~* '^glow_' THEN
      RAISE EXCEPTION 'glow_ usernames are reserved for new accounts' USING ERRCODE = '22023';
    END IF;
    IF public.username_reserved(NEW.username) THEN
      RAISE EXCEPTION 'That username is reserved' USING ERRCODE = '22023';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.validate_profile_username() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.username_reserved(text) FROM PUBLIC, anon, authenticated;

-- Runs before profiles_clear_username_generated (alphabetical: "profiles_a_..." < "profiles_clear...").
CREATE OR REPLACE TRIGGER profiles_a_validate_username
  BEFORE UPDATE OF username ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_username();

-- status: available | yours | taken | invalid | reserved. Case-insensitive, like the unique index.
CREATE OR REPLACE FUNCTION public.check_usernames(p_usernames text[])
RETURNS TABLE (username text, status text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Sign in required' USING ERRCODE = '42501';
  END IF;
  IF p_usernames IS NULL OR cardinality(p_usernames) > 12 THEN
    RAISE EXCEPTION 'Check at most 12 usernames at a time' USING ERRCODE = '22023';
  END IF;
  RETURN QUERY
  SELECT u,
    CASE
      WHEN u !~ '^[a-zA-Z0-9_]{3,20}$' OR u ~* '^glow_' THEN 'invalid'
      WHEN public.username_reserved(u) THEN 'reserved'
      WHEN EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(u) AND p.user_id = v_uid) THEN 'yours'
      WHEN EXISTS (SELECT 1 FROM public.profiles p WHERE lower(p.username) = lower(u)) THEN 'taken'
      ELSE 'available'
    END
  FROM unnest(p_usernames) AS u;
END;
$$;

REVOKE ALL ON FUNCTION public.check_usernames(text[]) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_usernames(text[]) TO authenticated;
