-- Skin PhotoJournal
-- Persistent, private member photo timeline for visual routine progress tracking.

create table if not exists public.skin_photo_journal_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  frequency text not null default 'monthly' check (frequency in ('weekly', 'monthly')),
  reminder_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.skin_photo_journal_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null,
  entry_type text not null default 'progress' check (entry_type in ('baseline', 'progress')),
  source_analysis_id text null,
  captured_at timestamptz not null default now(),
  note text null,
  created_at timestamptz not null default now(),
  constraint skin_photo_journal_entries_user_path_key unique (user_id, storage_path),
  constraint skin_photo_journal_entries_baseline_key unique (user_id, source_analysis_id)
);

create index if not exists skin_photo_journal_entries_user_captured_idx
  on public.skin_photo_journal_entries (user_id, captured_at desc);

alter table public.skin_photo_journal_settings enable row level security;
alter table public.skin_photo_journal_entries enable row level security;

create policy "Users can view their photo journal settings"
  on public.skin_photo_journal_settings for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their photo journal settings"
  on public.skin_photo_journal_settings for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Users can update their photo journal settings"
  on public.skin_photo_journal_settings for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can view their photo journal entries"
  on public.skin_photo_journal_entries for select
  to authenticated
  using (user_id = auth.uid());

create policy "Users can insert their photo journal entries"
  on public.skin_photo_journal_entries for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and storage_path like auth.uid()::text || '/journal/%'
  );

create policy "Users can update their photo journal entries"
  on public.skin_photo_journal_entries for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Users can delete their photo journal entries"
  on public.skin_photo_journal_entries for delete
  to authenticated
  using (user_id = auth.uid());

-- Keep the existing private analysis-photo bucket and its 5 MB enforcement.
-- Journal photos use the same bucket so the existing storage policies continue
-- to enforce per-user ownership and the server-side file-size limit.
update storage.buckets
set file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
where id = 'skin-analysis-photos';

create policy "Users can upload their own journal photos"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'journal'
  );

create policy "Users can view their own journal photos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'journal'
  );

create policy "Users can update their own journal photos"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'journal'
  )
  with check (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'journal'
  );

create policy "Users can delete their own journal photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'skin-analysis-photos'
    and (storage.foldername(name))[1] = auth.uid()::text
    and (storage.foldername(name))[2] = 'journal'
  );

comment on table public.skin_photo_journal_entries is
  'Private member-owned skin progress photos. Images are stored in the private skin-analysis-photos bucket and are never public.';
comment on column public.skin_photo_journal_entries.storage_path is
  'Private storage path. Must be scoped to the authenticated member journal folder.';
comment on column public.skin_photo_journal_entries.source_analysis_id is
  'Basic AI Skin Analysis client_analysis_id when this entry is the member baseline photo.';
