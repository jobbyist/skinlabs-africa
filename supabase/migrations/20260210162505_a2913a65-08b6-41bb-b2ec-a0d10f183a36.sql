-- Add contact info columns to skincare_recommendations
ALTER TABLE public.skincare_recommendations
ADD COLUMN IF NOT EXISTS contact_name text,
ADD COLUMN IF NOT EXISTS contact_whatsapp text,
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS book_consultation boolean DEFAULT false;

-- Create index for admin queue
CREATE INDEX IF NOT EXISTS idx_skincare_recommendations_status ON public.skincare_recommendations(status);

-- Allow admins to view all recommendations (we'll use a role-based approach later)
-- For now, add update policy so status can be changed
CREATE POLICY "Users can update their own recommendations"
ON public.skincare_recommendations
FOR UPDATE
USING (auth.uid() = user_id);
