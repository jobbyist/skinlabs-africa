
-- 1. Extend profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS race_ethnicity TEXT,
  ADD COLUMN IF NOT EXISTS skin_color TEXT,
  ADD COLUMN IF NOT EXISTS allergies TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS skin_conditions TEXT[] DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS preferred_routine_time TEXT,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Skin journey entries
CREATE TABLE IF NOT EXISTS public.skin_journey_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood TEXT,
  skin_condition_rating INT CHECK (skin_condition_rating BETWEEN 1 AND 10),
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.skin_journey_entries TO authenticated;
GRANT ALL ON public.skin_journey_entries TO service_role;
ALTER TABLE public.skin_journey_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own journey entries"
  ON public.skin_journey_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_skin_journey_updated_at
  BEFORE UPDATE ON public.skin_journey_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Custom formula requests
CREATE TABLE IF NOT EXISTS public.custom_formula_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_type TEXT NOT NULL,
  skin_goals TEXT[] DEFAULT '{}'::text[],
  key_ingredients TEXT,
  allergens TEXT,
  texture_preference TEXT,
  scent_preference TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  delivery_address TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.custom_formula_requests TO authenticated;
GRANT INSERT ON public.custom_formula_requests TO anon;
GRANT ALL ON public.custom_formula_requests TO service_role;
ALTER TABLE public.custom_formula_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit custom formula request"
  ON public.custom_formula_requests FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Users can view own formula requests"
  ON public.custom_formula_requests FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all formula requests"
  ON public.custom_formula_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_custom_formula_updated_at
  BEFORE UPDATE ON public.custom_formula_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Business enquiries
CREATE TABLE IF NOT EXISTS public.business_enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  country TEXT,
  services_interested TEXT[] DEFAULT '{}'::text[],
  project_brief TEXT,
  budget_range TEXT,
  timeline TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT INSERT ON public.business_enquiries TO anon, authenticated;
GRANT ALL ON public.business_enquiries TO service_role;
ALTER TABLE public.business_enquiries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit business enquiry"
  ON public.business_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "Admins can view enquiries"
  ON public.business_enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_business_enquiries_updated_at
  BEFORE UPDATE ON public.business_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
