-- Open feature_requests to all authenticated users so the new in-app Updates
-- page can show the public board. Admin-only write/delete is enforced below.
-- An upvote RPC prevents users from changing any field other than the counter.

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS feature_requests_select ON public.feature_requests;
CREATE POLICY feature_requests_select ON public.feature_requests
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS feature_requests_insert ON public.feature_requests;
CREATE POLICY feature_requests_insert ON public.feature_requests
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Admins manage status, delete.
DROP POLICY IF EXISTS feature_requests_admin ON public.feature_requests;
CREATE POLICY feature_requests_admin ON public.feature_requests
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Safe upvote: increments upvotes by 1 only — cannot touch status or other fields.
CREATE OR REPLACE FUNCTION public.upvote_feature_request(request_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.feature_requests
  SET upvotes = upvotes + 1
  WHERE id = request_id;
$$;
