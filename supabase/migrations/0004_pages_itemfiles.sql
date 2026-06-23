-- Migration 0004: per-user allowed_pages + item_files table

-- 1. Per-user page access control
--    NULL means "all pages allowed" (default).
--    Admins always see everything regardless of this field.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS allowed_pages text[] DEFAULT NULL;

-- 2. Item-level file attachments
CREATE TABLE IF NOT EXISTS public.item_files (
  id            uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id       uuid        NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  storage_path  text        NOT NULL,
  file_name     text        NOT NULL,
  file_size     bigint,
  note          text,
  dated         date        NOT NULL DEFAULT current_date,
  uploaded_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.item_files ENABLE ROW LEVEL SECURITY;

-- Only frontline (non-firstfix) authenticated users can work with item files
CREATE POLICY "item_files_select" ON public.item_files
  FOR SELECT TO authenticated
  USING (NOT public.is_firstfix());

CREATE POLICY "item_files_insert" ON public.item_files
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_firstfix());

CREATE POLICY "item_files_update" ON public.item_files
  FOR UPDATE TO authenticated
  USING (NOT public.is_firstfix());

CREATE POLICY "item_files_delete" ON public.item_files
  FOR DELETE TO authenticated
  USING (NOT public.is_firstfix());

-- Realtime for item_files
ALTER PUBLICATION supabase_realtime ADD TABLE public.item_files;
