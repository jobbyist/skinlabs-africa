-- Web Stories: a dedicated, DB-backed story content type powering the mobile
-- story rail (WebStoriesBar), the in-app story viewer, and the AMP Web Story
-- pages at /web-stories/:slug (Google Discover). Briefings still top up the
-- rail when there are few stories — those are built client/server side from
-- news_articles_public and are never written into these tables.

create type public.web_story_kind as enum ('editorial', 'briefing', 'review', 'comparison', 'video', 'promotional');

create table public.web_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and slug !~ '^briefing-'),
  title text not null check (char_length(title) between 1 and 120),
  kind public.web_story_kind not null default 'editorial',
  -- Portrait poster (3:4, >= 640x853) — AMP's poster-portrait-src and the rail circle.
  cover_image_url text not null,
  cover_image_alt text not null default '',
  cta_label text check (cta_label is null or char_length(cta_label) <= 40),
  cta_url text check (cta_url is null or cta_url ~ '^(https://|/)'),
  is_sponsored boolean not null default false,
  sponsor_name text,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  publish_at timestamptz not null default now(),
  expires_at timestamptz,
  -- Explicit 1-based slot in the rail (e.g. promotional stories spaced at 3/7/11);
  -- null = ordered by recency among the remaining slots.
  rail_position smallint check (rail_position is null or rail_position between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Never let a paid placement render without its disclosure.
  constraint web_stories_sponsor_named check (not is_sponsored or sponsor_name is not null),
  constraint web_stories_promotional_is_sponsored check (kind <> 'promotional' or is_sponsored),
  constraint web_stories_expiry_after_publish check (expires_at is null or expires_at > publish_at)
);

create table public.web_story_pages (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.web_stories(id) on delete cascade,
  position smallint not null check (position >= 1),
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  media_url text not null,
  media_alt text not null default '',
  poster_url text,
  headline text check (headline is null or char_length(headline) <= 120),
  body text check (body is null or char_length(body) <= 400),
  duration_ms integer not null default 6000 check (duration_ms between 2000 and 60000),
  created_at timestamptz not null default now(),
  unique (story_id, position),
  constraint web_story_pages_video_poster check (media_type <> 'video' or poster_url is not null)
);

-- Anonymous engagement counts only: no user id, no IP, no device fingerprint.
create table public.web_story_events (
  id uuid primary key default gen_random_uuid(),
  story_key text not null check (char_length(story_key) between 1 and 200),
  event text not null check (event in ('open', 'page_view', 'complete', 'cta_click')),
  page_index smallint check (page_index is null or page_index between 0 and 50),
  surface text not null default 'rail' check (surface in ('rail', 'amp')),
  created_at timestamptz not null default now()
);

create index web_stories_published_idx on public.web_stories (status, publish_at desc);
create index web_story_events_story_idx on public.web_story_events (story_key, created_at desc);

create trigger web_stories_updated_at
  before update on public.web_stories
  for each row execute function public.update_updated_at_column();

alter table public.web_stories enable row level security;
alter table public.web_story_pages enable row level security;
alter table public.web_story_events enable row level security;

create policy "Published web stories are public"
  on public.web_stories for select to anon, authenticated
  using (status = 'published' and publish_at <= now() and (expires_at is null or expires_at > now()));

create policy "Admins manage web stories"
  on public.web_stories for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')))
  with check ((select public.has_role((select auth.uid()), 'admin')));

create policy "Pages of published web stories are public"
  on public.web_story_pages for select to anon, authenticated
  using (exists (
    select 1 from public.web_stories s
    where s.id = story_id and s.status = 'published' and s.publish_at <= now()
      and (s.expires_at is null or s.expires_at > now())
  ));

create policy "Admins manage web story pages"
  on public.web_story_pages for all to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')))
  with check ((select public.has_role((select auth.uid()), 'admin')));

create policy "Anyone can log a web story event"
  on public.web_story_events for insert to anon, authenticated
  with check (true);

create policy "Admins read web story events"
  on public.web_story_events for select to authenticated
  using ((select public.has_role((select auth.uid()), 'admin')));

grant select on public.web_stories, public.web_story_pages to anon, authenticated;
grant insert, update, delete on public.web_stories, public.web_story_pages to authenticated;
grant insert on public.web_story_events to anon, authenticated;
grant select on public.web_story_events to authenticated;

-- Story media: public read (AMP pages and the rail load these directly), admin-only writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('web-stories', 'web-stories', true, 52428800,
        array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm'])
on conflict (id) do nothing;

create policy "Admins upload web story media"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'web-stories' and (select public.has_role((select auth.uid()), 'admin')));

create policy "Admins update web story media"
  on storage.objects for update to authenticated
  using (bucket_id = 'web-stories' and (select public.has_role((select auth.uid()), 'admin')));

create policy "Admins delete web story media"
  on storage.objects for delete to authenticated
  using (bucket_id = 'web-stories' and (select public.has_role((select auth.uid()), 'admin')));
