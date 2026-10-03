-- Skin PhotoJournal hardening
-- Fixes baseline uniqueness, RLS evaluation cost, and journal storage policy cost.

alter table public.skin_photo_journal_entries
  add constraint skin_photo_journal_entries_baseline_source_check
  check (
    (entry_type = 'baseline' and source_analysis_id is not null)
    or entry_type = 'progress'
  );

-- The existing (user_id, source_analysis_id) unique constraint is now a valid
-- conflict target for the baseline upsert because baseline source_analysis_id
-- can no longer be NULL.

drop policy if exists "Users can view their photo journal settings" on public.skin_photo_journal_settings;
drop policy if exists "Users can insert their photo journal settings" on public.skin_photo_journal_settings;
drop policy if exists "Users can update their photo journal settings" on public.skin_photo_journal_settings;
drop policy if exists "Users can view their photo journal entries" on public.skin_photo_journal_entries;
drop policy if exists "Users can insert their photo journal entries" on public.skin_photo_journal_entries;
drop policy if exists "Users can update their photo journal entries" on public.skin_photo_journal_entries;
drop policy if exists "Users can delete their photo journal entries" on public.skin_photo_journal_entries;

create policy "Users can view their photo journal settings"
  on public.skin_photo_journal_settings for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert their photo journal settings"
  on public.skin_photo_journal_settings for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users can update their photo journal settings"
  on public.skin_photo_journal_settings for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can view their photo journal entries"
  on public.skin_photo_journal_entries for select to authenticated
  using (user_id = (select auth.uid()));

create policy "Users can insert their photo journal entries"
  on public.skin_photo_journal_entries for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and storage_path like (select auth.uid())::text || '/journal/%'
  );

create policy "Users can update their photo journal entries"
  on public.skin_photo_journal_entries for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users can delete their photo journal entries"
  on public.skin_photo_journal_entries for delete to authenticated
  using (user_id = (select auth.uid()));

-- Journal-specific storage policies also use the optimized statement-level
-- auth.uid() pattern. Existing broader analysis-photo policies remain intact.
drop policy if exists "Users can upload their own journal photos" on storage.objects;
drop policy if exists "Users can view their own journal photos" on storage.objects;
drop policy if exists "Users can update their own journal photos" on storage.objects;
drop policy if exists "Users can delete their own journal photos" on storage.objects;

create policy "Users can upload their own journal photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'journal'
  );

create policy "Users can view their own journal photos"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'journal'
  );

create policy "Users can update their own journal photos"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'journal'
  )
  with check (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'journal'
  );

create policy "Users can delete their own journal photos"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and (storage.foldername(name))[2] = 'journal'
  );
