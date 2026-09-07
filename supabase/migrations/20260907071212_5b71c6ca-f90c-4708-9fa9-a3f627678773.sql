CREATE TABLE public.review_images (
  review_id text PRIMARY KEY,
  image_url text NOT NULL,
  alt text NOT NULL DEFAULT '',
  credit_name text NOT NULL DEFAULT 'Unsplash',
  credit_url text NOT NULL DEFAULT 'https://unsplash.com',
  photo_id text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.review_images TO anon;
GRANT SELECT ON public.review_images TO authenticated;
GRANT ALL ON public.review_images TO service_role;

ALTER TABLE public.review_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Review images are publicly readable"
ON public.review_images FOR SELECT
USING (true);

CREATE TRIGGER update_review_images_updated_at
BEFORE UPDATE ON public.review_images
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();