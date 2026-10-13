-- 0026: choose which team member's contact details appear on a delivery note.
-- `company_contact` is a snapshot of their name / phone / email at the time,
-- so reprints stay identical even if the profile changes later.

alter table public.delivery_notes
  add column if not exists contact_person_id uuid references public.profiles (id) on delete set null,
  add column if not exists company_contact   text;
