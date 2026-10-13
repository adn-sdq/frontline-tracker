-- 0025: a logo per project, stored in a public `project-logos` bucket.
-- Anyone signed in can see logos; only admins can upload or remove them.

alter table public.projects add column if not exists logo_url text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
select 'project-logos', 'project-logos', true, 2097152,
       array['image/png','image/jpeg','image/webp','image/gif']  -- no SVG: it can carry script
where not exists (select 1 from storage.buckets where id = 'project-logos');

drop policy if exists "project logos read" on storage.objects;
create policy "project logos read" on storage.objects
  for select using (bucket_id = 'project-logos');

drop policy if exists "project logos insert" on storage.objects;
create policy "project logos insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'project-logos' and public.is_admin());

drop policy if exists "project logos update" on storage.objects;
create policy "project logos update" on storage.objects
  for update to authenticated using (bucket_id = 'project-logos' and public.is_admin());

drop policy if exists "project logos delete" on storage.objects;
create policy "project logos delete" on storage.objects
  for delete to authenticated using (bucket_id = 'project-logos' and public.is_admin());
