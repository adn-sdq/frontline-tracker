-- Project-level details that pre-fill Delivery Notes and Item forms.
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS client_name   text,
  ADD COLUMN IF NOT EXISTS client_po     text,
  ADD COLUMN IF NOT EXISTS our_po        text,
  ADD COLUMN IF NOT EXISTS site_location text,
  ADD COLUMN IF NOT EXISTS site_contact  text;
