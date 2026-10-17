-- 0028: allow the PO and VO document types.
-- The app has offered them since v2.3.3, but the check constraint from 0009 never
-- listed them, so saving a PO/VO document failed with HTTP 400 (check violation).

alter table public.documents drop constraint if exists documents_doc_type_check;
alter table public.documents add constraint documents_doc_type_check check (doc_type in (
  'shop_drawing', 'schematic', 'om_manual', 'training_manual', 'method_statement',
  'commissioning_report', 'submittal', 'as_built', 'inspection_request', 'rfi',
  'po', 'vo', 'other'
));
