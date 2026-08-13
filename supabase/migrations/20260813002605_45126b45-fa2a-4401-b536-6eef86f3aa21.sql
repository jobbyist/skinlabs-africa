CREATE TABLE IF NOT EXISTS public.review_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  liked BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, review_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_ratings TO authenticated;
GRANT SELECT ON public.review_ratings TO anon;
GRANT ALL ON public.review_ratings TO service_role;
ALTER TABLE public.review_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read review ratings" ON public.review_ratings FOR SELECT USING (true);
CREATE POLICY "Users manage their own review ratings" ON public.review_ratings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS public.review_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  review_id TEXT NOT NULL,
  display_name TEXT,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.review_comments TO authenticated;
GRANT SELECT ON public.review_comments TO anon;
GRANT ALL ON public.review_comments TO service_role;
ALTER TABLE public.review_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read review comments" ON public.review_comments FOR SELECT USING (true);
CREATE POLICY "Users insert their own comments" ON public.review_comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update their own comments" ON public.review_comments FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete their own comments" ON public.review_comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own preorders" ON public.preorders;
CREATE POLICY "Users can insert their own pending preorders"
ON public.preorders FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
  AND payment_id IS NULL
);

REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (email, full_name, phone, date_of_birth, gender, race_ethnicity, skin_color, allergies, skin_conditions, preferred_routine_time, notes, updated_at) ON public.profiles TO authenticated;