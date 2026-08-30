-- Backs the pre-call enquiry form on /partners (SkinLabs Partner Program). Qualifies
-- prospective affiliate, editorial and strategic commerce partners before their
-- Partnership Call, mirroring the existing business_enquiries / spotlight_brand_requests
-- lead-capture pattern.
CREATE TABLE IF NOT EXISTS public.partner_enquiries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  website TEXT,
  country TEXT,
  business_type TEXT,
  partnership_model TEXT NOT NULL CHECK (
    partnership_model IN ('affiliate', 'editorial', 'strategic_commerce', 'not_sure')
  ),
  audience_size TEXT,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT INSERT ON public.partner_enquiries TO anon, authenticated;
GRANT ALL ON public.partner_enquiries TO service_role;
ALTER TABLE public.partner_enquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit a partner enquiry"
  ON public.partner_enquiries FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(full_name) BETWEEN 1 AND 200
    AND char_length(business_name) BETWEEN 1 AND 200
    AND char_length(work_email) BETWEEN 3 AND 255
    AND work_email ~* '^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$'
    AND (website IS NULL OR char_length(website) <= 500)
    AND (country IS NULL OR char_length(country) <= 100)
    AND (business_type IS NULL OR char_length(business_type) <= 200)
    AND (audience_size IS NULL OR char_length(audience_size) <= 100)
    AND (message IS NULL OR char_length(message) <= 4000)
  );

CREATE POLICY "Admins can view partner enquiries"
  ON public.partner_enquiries FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_partner_enquiries_updated_at
  BEFORE UPDATE ON public.partner_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Server-side throttle: blocks repeated submissions from the same work email within
-- a rolling window, independent of (and not replaceable by) the client-side cooldown
-- in PartnerEnquiryForm.tsx, since that can be bypassed by anyone calling the REST
-- endpoint directly. SECURITY DEFINER is required because anon/authenticated only
-- hold INSERT on this table, not SELECT, so the count below would otherwise be
-- blocked by RLS.
CREATE OR REPLACE FUNCTION public.enforce_partner_enquiry_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (
    SELECT count(*) FROM public.partner_enquiries
    WHERE work_email = NEW.work_email
      AND created_at > now() - interval '1 hour'
  ) >= 3 THEN
    RAISE EXCEPTION 'Too many partnership enquiries submitted recently. Please try again later or email support@skinlabs.co.za directly.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER partner_enquiries_rate_limit
  BEFORE INSERT ON public.partner_enquiries
  FOR EACH ROW EXECUTE FUNCTION public.enforce_partner_enquiry_rate_limit();
