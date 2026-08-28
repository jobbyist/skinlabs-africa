-- Backs the "Claim your brand" and "Submit your brand" CTAs on /spotlight and
-- individual /spotlight/:brandSlug profiles. One unified table, discriminated by
-- request_type, mirroring the existing business_enquiries lead-capture pattern.
CREATE TABLE IF NOT EXISTS public.spotlight_brand_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('submit_brand', 'claim_brand')),
  brand_name TEXT NOT NULL,
  brand_slug TEXT,
  role_at_brand TEXT,
  official_website TEXT,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.spotlight_brand_requests TO anon, authenticated;
GRANT ALL ON public.spotlight_brand_requests TO service_role;
ALTER TABLE public.spotlight_brand_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a brand request"
  ON public.spotlight_brand_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    request_type IN ('submit_brand', 'claim_brand')
    AND char_length(brand_name) BETWEEN 1 AND 200
    AND char_length(contact_name) BETWEEN 1 AND 200
    AND char_length(contact_email) BETWEEN 3 AND 255
    AND contact_email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (brand_slug IS NULL OR char_length(brand_slug) <= 200)
    AND (role_at_brand IS NULL OR char_length(role_at_brand) <= 200)
    AND (official_website IS NULL OR char_length(official_website) <= 500)
    AND (contact_phone IS NULL OR char_length(contact_phone) BETWEEN 5 AND 30)
    AND (message IS NULL OR char_length(message) <= 4000)
  );

CREATE POLICY "Admins can view brand requests"
  ON public.spotlight_brand_requests FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_spotlight_brand_requests_updated_at
  BEFORE UPDATE ON public.spotlight_brand_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
