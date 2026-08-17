-- Create podcast_plays table to track episode plays per user
create table if not exists public.podcast_plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  episode_slug text not null,
  episode_title text not null,
  played_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Create index for faster queries
create index if not exists idx_podcast_plays_user_id on public.podcast_plays(user_id);
create index if not exists idx_podcast_plays_played_at on public.podcast_plays(played_at);
create index if not exists idx_podcast_plays_user_month on public.podcast_plays(user_id, played_at);

-- Enable RLS
alter table public.podcast_plays enable row level security;

-- RLS policies
create policy "Users can view their own podcast plays"
  on public.podcast_plays for select
  using (auth.uid() = user_id);

-- Allow service role to insert plays
