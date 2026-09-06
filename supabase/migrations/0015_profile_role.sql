-- Three-tier role system + avatar storage

-- 1. role column
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'member'
  CHECK (role IN ('admin', 'member', 'guest'));

-- Backfill: existing admins get role='admin'
UPDATE public.profiles SET role = 'admin' WHERE is_admin = true;

-- 2. Ensure avatar_url exists
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 3. Avatar storage bucket (public, 5 MB limit)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
SELECT
  'avatars', 'avatars', true, 5242880,
  ARRAY['image/jpeg','image/png','image/gif','image/webp']
WHERE NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars');

-- 4. Storage RLS policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars public read') THEN
    CREATE POLICY "Avatars public read"
      ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars authenticated upload') THEN
    CREATE POLICY "Avatars authenticated upload"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars owner update') THEN
    CREATE POLICY "Avatars owner update"
      ON storage.objects FOR UPDATE TO authenticated
      USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Avatars owner delete') THEN
    CREATE POLICY "Avatars owner delete"
      ON storage.objects FOR DELETE TO authenticated
      USING (bucket_id = 'avatars');
  END IF;
END $$;
