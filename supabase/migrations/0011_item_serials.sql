-- Per-unit serial number tracking for items.
-- One row per physical unit (unit_index is 1-based, driven by qty_required).
-- Rows are created lazily on first save (upsert on blur), so empty slots cost nothing.

CREATE TABLE IF NOT EXISTS public.item_serials (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id       uuid        NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  unit_index    int         NOT NULL CHECK (unit_index >= 1),
  serial_number text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (item_id, unit_index)
);

ALTER TABLE public.item_serials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated_item_serials"
  ON public.item_serials FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
