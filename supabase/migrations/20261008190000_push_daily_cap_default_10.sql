-- Default daily push cap is now 10 (the maximum the CHECK allows) for every member.
-- Existing members move to 10 too; a member who switched pushes off (0) keeps that choice.
ALTER TABLE public.notification_preferences ALTER COLUMN daily_cap SET DEFAULT 10;
ALTER TABLE public.notification_settings ALTER COLUMN default_daily_cap SET DEFAULT 10;
UPDATE public.notification_settings SET default_daily_cap = 10 WHERE default_daily_cap IS DISTINCT FROM 10;
UPDATE public.notification_preferences SET daily_cap = 10 WHERE daily_cap > 0 AND daily_cap <> 10;
