-- Fix: GoTrue's Go scanner cannot read NULL into a string field.
-- auth.users rows created via Admin API / SQL seed before 2026-09-16 had
-- confirmation_token, recovery_token, email_change_token_new and email_change
-- stored as NULL. Every newer GoTrue version fails with:
--   "sql: Scan error on column index N, name 'confirmation_token':
--    converting NULL to string is unsupported"
-- which surfaces to users as "Database error finding user" on every
-- sign-in attempt (both OTP/magic-link and password flows).
--
-- Root cause confirmed from auth_logs:
--   error_code: unexpected_failure
--   error: error finding user: sql: Scan error on column index 3,
--          name "confirmation_token": converting NULL to string is unsupported
--
-- Fix: back-fill those four columns to '' for all existing rows.
-- GoTrue always writes '' (not NULL) for new users created via the API,
-- so this is a one-time cleanup for pre-existing rows only.
-- Note: ALTER TABLE DEFAULT cannot be applied to auth.users from postgres role
-- (supabase_auth_admin owns that schema); GoTrue's own handling ensures new
-- rows always have non-null values for these columns.

UPDATE auth.users
SET
  confirmation_token     = COALESCE(confirmation_token, ''),
  recovery_token         = COALESCE(recovery_token, ''),
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change           = COALESCE(email_change, '')
WHERE
  confirmation_token IS NULL
  OR recovery_token IS NULL
  OR email_change_token_new IS NULL
  OR email_change IS NULL;
