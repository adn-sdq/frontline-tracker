-- Delivery Notes — generated from selected procurement items.
-- Each note snapshots the items it shipped (description/qty/serial) so the
-- record is stable even if the underlying items are later edited or deleted.

CREATE TABLE IF NOT EXISTS public.delivery_notes (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects (id) ON DELETE CASCADE,
  seq          int  NOT NULL,                 -- per-project running number
  dn_number    text NOT NULL,                 -- display number (usually = seq)
  dn_date      date NOT NULL DEFAULT current_date,
  po           text,
  customer_po  text,
  deliver_to   text,
  location     text,
  contact      text,
  items        jsonb NOT NULL DEFAULT '[]',   -- [{description, qty, serial}]
  notes        text,
  generated_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS delivery_notes_project_idx
  ON public.delivery_notes (project_id, seq DESC);

-- Atomically reserve the next per-project sequence number. SECURITY DEFINER so
-- the running count isn't subject to row visibility quirks; advisory lock keeps
-- two concurrent generators from grabbing the same number.
CREATE OR REPLACE FUNCTION public.next_dn_seq(p_project uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_next int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('dn_seq:' || p_project::text));
  SELECT COALESCE(MAX(seq), 0) + 1 INTO v_next
    FROM public.delivery_notes
   WHERE project_id = p_project;
  RETURN v_next;
END;
$$;

ALTER TABLE public.delivery_notes ENABLE ROW LEVEL SECURITY;

-- Project members (and admins, who are members of everything via is_admin in
-- the membership check used elsewhere) can read & write their project's notes.
-- Firstfix users never see procurement, so they're excluded.
DROP POLICY IF EXISTS delivery_notes_all ON public.delivery_notes;
CREATE POLICY delivery_notes_all ON public.delivery_notes
  FOR ALL TO authenticated
  USING (NOT public.is_firstfix() AND public.is_project_member(project_id))
  WITH CHECK (NOT public.is_firstfix() AND public.is_project_member(project_id));
