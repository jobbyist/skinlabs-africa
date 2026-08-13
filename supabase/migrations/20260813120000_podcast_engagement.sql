CREATE TABLE IF NOT EXISTS public.podcast_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  episode_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, episode_slug)
);
GRANT SELECT, INSERT, DELETE ON public.podcast_likes TO authenticated;
GRANT SELECT ON public.podcast_likes TO anon;
GRANT ALL ON public.podcast_likes TO service_role;
ALTER TABLE public.podcast_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read podcast likes" ON public.podcast_likes FOR SELECT USING (true);
CREATE POLICY "Users manage their own podcast likes" ON public.podcast_likes FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.podcast_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  episode_slug TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.podcast_comments(id) ON DELETE CASCADE,
  display_name TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.podcast_comments TO authenticated;
GRANT SELECT ON public.podcast_comments TO anon;
GRANT ALL ON public.podcast_comments TO service_role;
ALTER TABLE public.podcast_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read podcast comments" ON public.podcast_comments FOR SELECT USING (true);
CREATE POLICY "Users insert their own podcast comments" ON public.podcast_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own podcast comments" ON public.podcast_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own podcast comments" ON public.podcast_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_podcast_likes_episode ON public.podcast_likes(episode_slug);
CREATE INDEX IF NOT EXISTS idx_podcast_comments_episode ON public.podcast_comments(episode_slug);
CREATE INDEX IF NOT EXISTS idx_podcast_comments_parent ON public.podcast_comments(parent_comment_id);
