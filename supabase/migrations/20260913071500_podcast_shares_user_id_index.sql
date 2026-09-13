-- Performance advisor: podcast_shares_user_id_fkey has no covering index.
create index if not exists idx_podcast_shares_user_id on public.podcast_shares(user_id);
