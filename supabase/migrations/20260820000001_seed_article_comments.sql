-- Seed realistic comments for newsroom articles
-- This migration adds 5-7 diverse, realistic comments to each published article

-- Create a temporary function to insert seeded comments
CREATE OR REPLACE FUNCTION seed_article_comments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  article_record RECORD;
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001'; -- System seeded user
BEGIN
  -- Loop through all published articles
  FOR article_record IN 
    SELECT id, slug, title FROM news_articles WHERE status = 'published'
  LOOP
    -- Insert diverse, realistic comments for each article
    -- Comment set 1: Thoughtful engagement
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES 
      (article_record.id, seed_user_id, 'Dr. Sarah M.', 
       'This is exactly the kind of evidence-based breakdown we need more of in South Africa. The local context really matters when you''re dealing with our climate and water quality.', 
       now() - interval '3 days'),
      
      (article_record.id, seed_user_id, 'Thandi K.', 
       'Finally someone talking about how these ingredients actually work on deeper skin tones. Tired of generic advice that doesn''t consider melanin-rich skin.', 
       now() - interval '2 days'),
      
      (article_record.id, seed_user_id, 'Michael P.', 
       'Great article! I''ve been dealing with this exact issue. Going to try the approach mentioned here and see how it goes.', 
       now() - interval '2 days'),
      
      (article_record.id, seed_user_id, 'Naledi R.', 
       'The SA context is so important. What works in Europe or the US doesn''t always translate here. Appreciate the local perspective.', 
       now() - interval '1 day'),
      
      (article_record.id, seed_user_id, 'James C.', 
       'This aligns with what my dermatologist in Cape Town told me. Good to see the science backing it up.', 
       now() - interval '1 day'),
      
      (article_record.id, seed_user_id, 'Lerato M.', 
       'Been following SkinLabs for a few months now and the quality of these briefings is consistently excellent. Worth every cent of the membership.', 
       now() - interval '18 hours'),
      
      (article_record.id, seed_user_id, 'David S.', 
       'Could you do a follow-up on this? Would love to see more detail on implementation for Gauteng climate specifically.', 
       now() - interval '12 hours')
    ON CONFLICT DO NOTHING;
    
  END LOOP;
END;
$$;

-- Execute the seeding function
SELECT seed_article_comments();

-- Drop the temporary function
DROP FUNCTION seed_article_comments();

-- Add additional diverse comments to create variation across articles
-- These will be added to random articles to create more natural distribution

DO $$
DECLARE
  article_ids UUID[];
  seed_user_id UUID := '00000000-0000-0000-0000-000000000001';
  random_article_id UUID;
BEGIN
  -- Get all published article IDs
  SELECT array_agg(id) INTO article_ids FROM news_articles WHERE status = 'published';
  
  -- Add some variety comments to random articles
  IF array_length(article_ids, 1) > 0 THEN
    -- Professional commentary
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Dr. Priya N.', 
            'As a practicing dermatologist in Johannesburg, I can confirm this matches what we''re seeing clinically. The research is solid.',
            now() - interval '4 days')
    ON CONFLICT DO NOTHING;
    
    -- Practical application
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Zanele W.', 
            'I tried this approach last month and saw real improvements within 2 weeks. Key is consistency and not mixing too many actives at once.',
            now() - interval '3 days')
    ON CONFLICT DO NOTHING;
    
    -- Product availability
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Chris V.', 
            'Anyone know where I can find this in SA? Checked Clicks and Dis-Chem in my area but no luck yet.',
            now() - interval '1 day')
    ON CONFLICT DO NOTHING;
    
    -- Cost consideration
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Ayanda T.', 
            'Love the breakdown but wish there were more affordable options mentioned. Not everyone can spend R500+ on a single product.',
            now() - interval '2 days')
    ON CONFLICT DO NOTHING;
    
    -- Climate-specific
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Kevin L.', 
            'Living in Durban humidity vs Joburg dryness makes such a difference. Wish more brands acknowledged our diverse climates.',
            now() - interval '3 days')
    ON CONFLICT DO NOTHING;
    
    -- Skin type specific
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Nomsa D.', 
            'My combination skin loves this routine. Finally something that doesn''t make my T-zone oily or my cheeks flaky.',
            now() - interval '1 day')
    ON CONFLICT DO NOTHING;
    
    -- Research appreciation
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Ryan B.', 
            'The fact that you cite actual research papers and not just marketing claims is why I subscribe. Keep it up.',
            now() - interval '5 hours')
    ON CONFLICT DO NOTHING;
    
    -- Follow-up question
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Fatima A.', 
            'This is great info. Can you cover how this interacts with prescription tretinoin? My derm prescribed it but I''m not sure what to pair it with.',
            now() - interval '8 hours')
    ON CONFLICT DO NOTHING;
    
    -- Positive feedback
    random_article_id := article_ids[1 + floor(random() * array_length(article_ids, 1))];
    INSERT INTO news_comments (article_id, user_id, author_name, body, created_at)
    VALUES (random_article_id, seed_user_id, 'Sipho M.', 
            'These daily briefings have genuinely improved my skincare routine. Understanding the ''why'' behind each ingredient makes such a difference.',
            now() - interval '10 hours')
    ON CONFLICT DO NOTHING;
    
  END IF;
END;
$$;

-- Add a comment explaining the seed data
COMMENT ON TABLE news_comments IS 'User comments on newsroom articles. Initial seed data provided for demonstration purposes.';

