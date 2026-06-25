-- Support & Troubleshooting Tickets — internal team issue tracking.
-- Tickets can link to a registered project OR carry a free-text project name
-- so old/unregistered projects are supported.
-- Ticket ID format: [PREFIX]-TKT-[YEAR]-[NNN]

CREATE TABLE IF NOT EXISTS public.tickets (
  id              uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- ID components for sequence generation
  ticket_prefix   text        NOT NULL,              -- e.g. 'MIC'
  ticket_year     int         NOT NULL,              -- e.g. 2026
  seq             int         NOT NULL,              -- per prefix+year
  ticket_number   text        NOT NULL,              -- e.g. 'MIC-TKT-2026-001'
  -- Content
  title           text        NOT NULL,
  description     text,
  -- Project (registered OR free text)
  project_id      uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name    text        NOT NULL,              -- always populated
  -- Classification
  category        text        NOT NULL DEFAULT 'general',
  priority        text        NOT NULL DEFAULT 'medium'
                              CHECK (priority IN ('low','medium','high','critical')),
  status          text        NOT NULL DEFAULT 'open'
                              CHECK (status IN ('open','in_progress','pending','resolved','closed')),
  -- Site details
  site_contact    text,
  site_phone      text,
  site_location   text,
  -- Assignment
  assigned_to     uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Attribution
  created_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_by      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (ticket_prefix, ticket_year, seq)
);

CREATE INDEX IF NOT EXISTS tickets_status_idx  ON public.tickets (status);
CREATE INDEX IF NOT EXISTS tickets_created_idx ON public.tickets (created_at DESC);

-- Comments / activity thread
CREATE TABLE IF NOT EXISTS public.ticket_comments (
  id          bigserial   PRIMARY KEY,
  ticket_id   uuid        NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  body        text        NOT NULL,
  author      uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ticket_comments_ticket_idx
  ON public.ticket_comments (ticket_id, created_at ASC);

-- Auto-stamp created_by / updated_by / timestamps
CREATE OR REPLACE FUNCTION public.tickets_stamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, auth.uid());
    NEW.updated_by := auth.uid();
    NEW.created_at := now();
    NEW.updated_at := now();
  ELSIF TG_OP = 'UPDATE' THEN
    NEW.updated_by := auth.uid();
    NEW.updated_at := now();
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_stamp_ins ON public.tickets;
DROP TRIGGER IF EXISTS tickets_stamp_upd ON public.tickets;
CREATE TRIGGER tickets_stamp_ins BEFORE INSERT ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.tickets_stamp();
CREATE TRIGGER tickets_stamp_upd BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.tickets_stamp();

-- Atomic sequence reservation — advisory lock prevents concurrent duplicates
CREATE OR REPLACE FUNCTION public.next_ticket_seq(p_prefix text, p_year int)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE v_next int;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtext('tkt_seq:' || p_prefix || ':' || p_year::text));
  SELECT COALESCE(MAX(seq), 0) + 1 INTO v_next
    FROM public.tickets
   WHERE ticket_prefix = p_prefix AND ticket_year = p_year;
  RETURN v_next;
END;
$$;

-- RLS
ALTER TABLE public.tickets         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_comments ENABLE ROW LEVEL SECURITY;

-- All authenticated non-firstfix users can manage tickets
DROP POLICY IF EXISTS tickets_all ON public.tickets;
CREATE POLICY tickets_all ON public.tickets
  FOR ALL TO authenticated
  USING (NOT public.is_firstfix())
  WITH CHECK (NOT public.is_firstfix());

DROP POLICY IF EXISTS ticket_comments_all ON public.ticket_comments;
CREATE POLICY ticket_comments_all ON public.ticket_comments
  FOR ALL TO authenticated
  USING (NOT public.is_firstfix())
  WITH CHECK (NOT public.is_firstfix());

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'tickets')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.tickets; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'ticket_comments')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_comments; END IF;
END $$;
