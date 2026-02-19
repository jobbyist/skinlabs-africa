
-- OPENHAUS Waitlist table
CREATE TABLE public.openhaus_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.openhaus_waitlist ENABLE ROW LEVEL SECURITY;

-- Anyone can submit (no auth required for waitlist)
CREATE POLICY "Anyone can insert waitlist entries"
ON public.openhaus_waitlist FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view
CREATE POLICY "Admins can view waitlist"
ON public.openhaus_waitlist FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Newsletter subscribers table
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Anyone can subscribe
CREATE POLICY "Anyone can subscribe to newsletter"
ON public.newsletter_subscribers FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admins can view subscribers
CREATE POLICY "Admins can view newsletter subscribers"
ON public.newsletter_subscribers FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Preorders table
CREATE TABLE public.preorders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_type TEXT NOT NULL DEFAULT 'edible_pouches',
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.preorders ENABLE ROW LEVEL SECURITY;

-- Users can insert their own preorders
CREATE POLICY "Users can insert their own preorders"
ON public.preorders FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can view their own preorders
CREATE POLICY "Users can view their own preorders"
ON public.preorders FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Admins can view all preorders
CREATE POLICY "Admins can view all preorders"
ON public.preorders FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update preorders
CREATE POLICY "Admins can update all preorders"
ON public.preorders FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow anon to count preorders (for backer count display)
CREATE POLICY "Anyone can count preorders"
ON public.preorders FOR SELECT
TO anon
USING (true);
