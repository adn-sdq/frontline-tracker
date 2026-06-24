-- Add doc_type column to documents
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS doc_type text
  CHECK (doc_type IN (
    'shop_drawing','schematic','om_manual','training_manual',
    'method_statement','commissioning_report','submittal',
    'as_built','inspection_request','rfi','other'
  ));
