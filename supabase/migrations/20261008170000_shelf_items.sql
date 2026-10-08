-- "My Skincare Shelf": a member's open bottles for PAO / oxidation / run-out tracking (My Skin > Routine).
-- Owner-only. Names and dates only: no photos, no health data. Linked routine step is optional (check-in based run-out estimate).
CREATE TABLE IF NOT EXISTS public.shelf_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
  brand text CHECK (brand IS NULL OR char_length(brand) <= 80),
  category text NOT NULL DEFAULT 'other' CHECK (category IN ('cleanser','toner','serum','moisturiser','sunscreen','treatment','mask','other')),
  actives text[] NOT NULL DEFAULT '{}' CHECK (actives <@ ARRAY['vitamin_c','retinoid','benzoyl_peroxide']::text[]),
  opened_on date NOT NULL,
  pao_months smallint NOT NULL CHECK (pao_months IN (3,6,9,12,18,24,36)),
  size_ml numeric(7,1) CHECK (size_ml IS NULL OR (size_ml > 0 AND size_ml <= 2000)),
  amount_per_use_ml numeric(5,2) CHECK (amount_per_use_ml IS NULL OR (amount_per_use_ml > 0 AND amount_per_use_ml <= 50)),
  uses_per_week numeric(4,1) CHECK (uses_per_week IS NULL OR (uses_per_week > 0 AND uses_per_week <= 21)),
  routine_step_id uuid REFERENCES public.routine_steps(id) ON DELETE SET NULL,
  looks_oxidised boolean NOT NULL DEFAULT false,
  finished_on date,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_shelf_items_user ON public.shelf_items(user_id, finished_on);
CREATE INDEX IF NOT EXISTS idx_shelf_items_step ON public.shelf_items(routine_step_id);

ALTER TABLE public.shelf_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members manage their own shelf"
  ON public.shelf_items FOR ALL TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shelf_items TO authenticated;
