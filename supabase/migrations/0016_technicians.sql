-- Technicians coordination — roster, next-day requests and project assignments.
--
--  * technicians            — the people (with Iqama / contact details)
--  * technician_requests    — a member asks for N technicians on their project
--                             for a date/time range, with gear tags + notes
--  * technician_assignments — the tech-manager's actual placement of a person
--                             on a project for a date/time range (may answer a
--                             request or stand alone)
--
-- A new profiles.is_tech_manager flag designates the "managing head" who runs
-- the roster, answers requests and builds the schedule. Admins are always
-- treated as tech managers.

-- ── Tech-manager flag + helper ───────────────────────────────────────────────
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_tech_manager boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.is_tech_manager()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin OR is_tech_manager FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- ── Shared stamp helpers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.stamp_created_by()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.created_by := COALESCE(NEW.created_by, auth.uid());
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.stamp_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- ── Technicians roster ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.technicians (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name     text        NOT NULL,
  iqama_number  text,
  iqama_expiry  date,
  phone         text,
  nationality   text,
  trade         text,                                   -- e.g. 'AV Technician'
  notes         text,
  active        boolean     NOT NULL DEFAULT true,
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS technicians_active_idx ON public.technicians (active);

-- ── Requests ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.technician_requests (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id    uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name  text        NOT NULL,
  quantity      int         NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  start_date    date        NOT NULL,
  end_date      date        NOT NULL,
  start_time    time,                                   -- null = all day
  end_time      time,
  tags          text[]      NOT NULL DEFAULT '{}',
  notes         text,
  status        text        NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','approved','changed','declined','cancelled')),
  response_note text,
  responded_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  responded_at  timestamptz,
  requested_by  uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tech_requests_status_idx ON public.technician_requests (status);
CREATE INDEX IF NOT EXISTS tech_requests_dates_idx  ON public.technician_requests (start_date, end_date);

CREATE OR REPLACE FUNCTION public.tech_requests_ins()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.requested_by := COALESCE(NEW.requested_by, auth.uid());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tech_requests_ins ON public.technician_requests;
CREATE TRIGGER tech_requests_ins BEFORE INSERT ON public.technician_requests
  FOR EACH ROW EXECUTE FUNCTION public.tech_requests_ins();

DROP TRIGGER IF EXISTS tech_requests_upd ON public.technician_requests;
CREATE TRIGGER tech_requests_upd BEFORE UPDATE ON public.technician_requests
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_at();

-- ── Assignments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.technician_assignments (
  id            uuid        NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  technician_id uuid        NOT NULL REFERENCES public.technicians(id) ON DELETE CASCADE,
  project_id    uuid        REFERENCES public.projects(id) ON DELETE SET NULL,
  project_name  text        NOT NULL,
  request_id    uuid        REFERENCES public.technician_requests(id) ON DELETE SET NULL,
  start_date    date        NOT NULL,
  end_date      date        NOT NULL,
  start_time    time,
  end_time      time,
  notes         text,
  created_by    uuid        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tech_assign_tech_idx  ON public.technician_assignments (technician_id, start_date);
CREATE INDEX IF NOT EXISTS tech_assign_dates_idx ON public.technician_assignments (start_date, end_date);

DROP TRIGGER IF EXISTS tech_assign_ins ON public.technician_assignments;
CREATE TRIGGER tech_assign_ins BEFORE INSERT ON public.technician_assignments
  FOR EACH ROW EXECUTE FUNCTION public.stamp_created_by();

DROP TRIGGER IF EXISTS technicians_ins ON public.technicians;
CREATE TRIGGER technicians_ins BEFORE INSERT ON public.technicians
  FOR EACH ROW EXECUTE FUNCTION public.stamp_created_by();

DROP TRIGGER IF EXISTS technicians_upd ON public.technicians;
CREATE TRIGGER technicians_upd BEFORE UPDATE ON public.technicians
  FOR EACH ROW EXECUTE FUNCTION public.stamp_updated_at();

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE public.technicians            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_requests    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technician_assignments ENABLE ROW LEVEL SECURITY;

-- Technicians: any non-firstfix user can read the roster; only tech managers write.
DROP POLICY IF EXISTS technicians_select ON public.technicians;
CREATE POLICY technicians_select ON public.technicians
  FOR SELECT TO authenticated
  USING (NOT public.is_firstfix());

DROP POLICY IF EXISTS technicians_write ON public.technicians;
CREATE POLICY technicians_write ON public.technicians
  FOR ALL TO authenticated
  USING (public.is_tech_manager())
  WITH CHECK (public.is_tech_manager());

-- Assignments: non-firstfix can view the schedule; only tech managers write.
DROP POLICY IF EXISTS tech_assign_select ON public.technician_assignments;
CREATE POLICY tech_assign_select ON public.technician_assignments
  FOR SELECT TO authenticated
  USING (NOT public.is_firstfix());

DROP POLICY IF EXISTS tech_assign_write ON public.technician_assignments;
CREATE POLICY tech_assign_write ON public.technician_assignments
  FOR ALL TO authenticated
  USING (public.is_tech_manager())
  WITH CHECK (public.is_tech_manager());

-- Requests: non-firstfix can view; anyone non-firstfix can raise one; a tech
-- manager OR the original requester can update/cancel/delete.
DROP POLICY IF EXISTS tech_requests_select ON public.technician_requests;
CREATE POLICY tech_requests_select ON public.technician_requests
  FOR SELECT TO authenticated
  USING (NOT public.is_firstfix());

DROP POLICY IF EXISTS tech_requests_insert ON public.technician_requests;
CREATE POLICY tech_requests_insert ON public.technician_requests
  FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_firstfix());

DROP POLICY IF EXISTS tech_requests_update ON public.technician_requests;
CREATE POLICY tech_requests_update ON public.technician_requests
  FOR UPDATE TO authenticated
  USING (public.is_tech_manager() OR requested_by = auth.uid())
  WITH CHECK (public.is_tech_manager() OR requested_by = auth.uid());

DROP POLICY IF EXISTS tech_requests_delete ON public.technician_requests;
CREATE POLICY tech_requests_delete ON public.technician_requests
  FOR DELETE TO authenticated
  USING (public.is_tech_manager() OR requested_by = auth.uid());

-- ── Realtime ─────────────────────────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'technicians')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.technicians; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'technician_requests')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_requests; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'technician_assignments')
  THEN ALTER PUBLICATION supabase_realtime ADD TABLE public.technician_assignments; END IF;
END $$;
