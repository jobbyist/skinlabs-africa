-- Persistent like + share tracking for podcast episodes, mirroring the
-- podcast_plays pattern. src/hooks/use-podcast-engagement.ts has referenced a
-- "podcast_likes" table since it was written, but no migration ever created
-- it, so every like toggle has been silently failing to sync cross-device.

create table if not exists public.podcast_likes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  episode_slug text not null,
  created_at timestamptz not null default now(),
  unique (user_id, episode_slug)
);

create index if not exists idx_podcast_likes_episode_slug on public.podcast_likes(episode_slug);

alter table public.podcast_likes enable row level security;

create policy "Users can view their own podcast likes"
  on public.podcast_likes for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can like an episode"
  on public.podcast_likes for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can unlike an episode"
  on public.podcast_likes for delete
  to authenticated
  using ((select auth.uid()) = user_id);

grant select, insert, delete on public.podcast_likes to authenticated;

-- Share events. Sharing doesn't require sign-in, so anon may log a share too;
-- user_id is nullable and only ever set for a signed-in sharer.
create table if not exists public.podcast_shares (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  episode_slug text not null,
  episode_title text not null,
  shared_at timestamptz not null default now()
);

create index if not exists idx_podcast_shares_episode_slug on public.podcast_shares(episode_slug);

alter table public.podcast_shares enable row level security;

create policy "Anyone can log a podcast share"
  on public.podcast_shares for insert
  to anon, authenticated
  with check ((select auth.uid()) is null and user_id is null or user_id = (select auth.uid()));

grant insert on public.podcast_shares to anon, authenticated;
