-- Rename items.sno (int) to items.unique_id (text) to allow any string identifier
-- (device serial numbers, custom codes, etc.).

ALTER TABLE public.items RENAME COLUMN sno TO unique_id;
ALTER TABLE public.items ALTER COLUMN unique_id TYPE text USING unique_id::text;

-- Update update_item RPC: replace sno handling with unique_id (text, no cast needed).
CREATE OR REPLACE FUNCTION public.update_item(
  p_id              uuid,
  p_expected_version int,
  p_patch           jsonb
)
RETURNS public.items
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  allowed text[] := ARRAY[
    'system','location','unique_id','brand','model_no','description',
    'qty_required','qty_ordered','qty_delivered','qty_installed',
    'procurement_status','delivery_status','installation_status',
    'supplier','eta','notes'
  ];
  cur    public.items;
  patched jsonb;
  k      text;
  result public.items;
BEGIN
  SELECT * INTO cur FROM public.items WHERE id = p_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'not_found' USING errcode = 'P0002';
  END IF;
  IF cur.version <> p_expected_version THEN
    RAISE EXCEPTION 'conflict' USING errcode = 'P0001',
      detail = FORMAT('expected version %s but current is %s', p_expected_version, cur.version);
  END IF;

  patched := '{}'::jsonb;
  FOR k IN SELECT jsonb_object_keys(p_patch) LOOP
    IF k = ANY(allowed) THEN
      patched := patched || jsonb_build_object(k, p_patch -> k);
    END IF;
  END LOOP;

  UPDATE public.items AS i
     SET system              = COALESCE((patched ->> 'system'), i.system),
         location            = CASE WHEN patched ? 'location'    THEN patched ->> 'location'    ELSE i.location    END,
         unique_id           = CASE WHEN patched ? 'unique_id'   THEN patched ->> 'unique_id'   ELSE i.unique_id   END,
         brand               = CASE WHEN patched ? 'brand'       THEN patched ->> 'brand'       ELSE i.brand       END,
         model_no            = CASE WHEN patched ? 'model_no'    THEN patched ->> 'model_no'    ELSE i.model_no    END,
         description         = CASE WHEN patched ? 'description' THEN patched ->> 'description' ELSE i.description END,
         qty_required        = COALESCE(NULLIF(patched ->> 'qty_required',   '')::numeric, i.qty_required),
         qty_ordered         = COALESCE(NULLIF(patched ->> 'qty_ordered',    '')::numeric, i.qty_ordered),
         qty_delivered       = COALESCE(NULLIF(patched ->> 'qty_delivered',  '')::numeric, i.qty_delivered),
         qty_installed       = COALESCE(NULLIF(patched ->> 'qty_installed',  '')::numeric, i.qty_installed),
         procurement_status  = COALESCE((patched ->> 'procurement_status'),  i.procurement_status),
         delivery_status     = COALESCE((patched ->> 'delivery_status'),     i.delivery_status),
         installation_status = COALESCE((patched ->> 'installation_status'), i.installation_status),
         supplier            = CASE WHEN patched ? 'supplier' THEN patched ->> 'supplier' ELSE i.supplier END,
         eta                 = CASE WHEN patched ? 'eta'      THEN NULLIF(patched ->> 'eta', '')::date ELSE i.eta END,
         notes               = CASE WHEN patched ? 'notes'    THEN patched ->> 'notes'    ELSE i.notes    END
   WHERE i.id = p_id
   RETURNING * INTO result;

  RETURN result;
END;
$$;
