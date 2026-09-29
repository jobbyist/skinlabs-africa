-- Advisor fix: update_modified_column() (added by the SEO/schema fields
-- migration above) had a mutable search_path, flagged by
-- mcp__Supabase__get_advisors right after that migration was applied.
CREATE OR REPLACE FUNCTION public.update_modified_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
    NEW.date_modified = now();
    RETURN NEW;
END;
$$;
