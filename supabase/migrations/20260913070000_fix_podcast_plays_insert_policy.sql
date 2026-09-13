-- 20260820000000_create_podcast_plays_table.sql was left incomplete: it created
-- podcast_plays with RLS enabled and only a SELECT policy, ending mid-comment
-- ("-- Allow service role to insert plays") with no INSERT policy or GRANT ever
-- added. Every insert from use-podcast-engagement.ts has therefore been silently
-- failing (42501, swallowed by the hook's try/catch) since that table existed.

create policy "Users can insert their own podcast plays"
  on public.podcast_plays for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant insert on public.podcast_plays to authenticated;

-- The original SELECT policy re-evaluates auth.uid() per row; switch it to the
-- (select auth.uid()) form per the project's RLS performance convention.
drop policy if exists "Users can view their own podcast plays" on public.podcast_plays;

create policy "Users can view their own podcast plays"
  on public.podcast_plays for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.podcast_plays to authenticated;
