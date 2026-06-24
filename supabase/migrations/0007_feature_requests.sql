-- Feature requests submitted from the login page (anonymous allowed).
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title        text NOT NULL,
  description  text,
  submitted_by uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  submitted_at timestamptz NOT NULL DEFAULT now(),
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'planned', 'in_progress', 'done', 'rejected'))
);

CREATE INDEX IF NOT EXISTS feature_requests_status_idx ON public.feature_requests (status);
CREATE INDEX IF NOT EXISTS feature_requests_submitted_idx ON public.feature_requests (submitted_at DESC);

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- Anyone (including unauthenticated anon users) can submit a request.
DROP POLICY IF EXISTS feature_requests_insert ON public.feature_requests;
CREATE POLICY feature_requests_insert ON public.feature_requests
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Authenticated users can read their own submissions.
DROP POLICY IF EXISTS feature_requests_select_own ON public.feature_requests;
CREATE POLICY feature_requests_select_own ON public.feature_requests
  FOR SELECT TO authenticated
  USING (submitted_by = auth.uid());

-- Admins can read and update all requests.
DROP POLICY IF EXISTS feature_requests_admin ON public.feature_requests;
CREATE POLICY feature_requests_admin ON public.feature_requests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
