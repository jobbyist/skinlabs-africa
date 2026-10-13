-- SkinLabs Community Forum — post images/GIFs and profile pictures.  (3 of 5: storage)
-- Two PUBLIC-read buckets with unguessable object names (<user-id>/<uuid>.<ext>); writes are limited to the caller's own folder.
-- No listing policy exists, so objects cannot be enumerated. The browser re-encodes images losslessly before upload
-- (src/lib/community/image.ts); the bucket limits below are the server-side backstop.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('community-media', 'community-media', true, 3145728, ARRAY['image/webp', 'image/png', 'image/jpeg', 'image/gif'])
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 1048576, ARRAY['image/webp', 'image/png', 'image/jpeg'])
ON CONFLICT (id) DO NOTHING;

DO $pol$ BEGIN
  CREATE POLICY "Members upload community media to their own folder" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'community-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
  CREATE POLICY "Members delete their own community media" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'community-media' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
  CREATE POLICY "Members upload their own avatar" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;
DO $pol$ BEGIN
  CREATE POLICY "Members delete their own avatar" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = (SELECT auth.uid())::text);
EXCEPTION WHEN duplicate_object THEN NULL; END $pol$;

-- Members may set/clear their own avatar_path (RLS "update own profile" already scopes the row; the CHECK scopes the folder).
GRANT UPDATE (avatar_path) ON public.profiles TO authenticated;
