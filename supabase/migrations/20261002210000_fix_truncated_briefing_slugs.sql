-- Two published briefings had slugs cut mid-word at 70 characters by the
-- pipeline's old slugify(). Replace them with the full-title slug.
-- vercel.json 301s the old URLs to the new ones; apply this migration right
-- after that redirect deploys.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT * FROM (VALUES
      ('066116be-9246-4701-93bd-aab9148b073a'::uuid,
       'the-silent-struggle-understanding-and-managing-hair-loss-in-south-afri',
       'the-silent-struggle-understanding-and-managing-hair-loss-in-south-africa'),
      ('f0a11d41-b671-4e03-a697-1fe18c078350'::uuid,
       'the-digital-skin-audit-how-your-smartphone-is-changing-dermatological-',
       'the-digital-skin-audit-how-your-smartphone-is-changing-dermatological-care-in-south-africa')
    ) AS t(id, old_slug, new_slug)
  LOOP
    UPDATE public.news_articles
       SET slug = r.new_slug,
           json_ld = CASE WHEN json_ld IS NULL THEN NULL
                          ELSE replace(json_ld::text, r.old_slug, r.new_slug)::jsonb END
     WHERE id = r.id AND slug = r.old_slug;
  END LOOP;
END $$;
