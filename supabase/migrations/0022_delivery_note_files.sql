-- 0022: delivery note files — any number of uploaded versions per note, each
-- marked signed or unsigned (supports manually made notes). A note counts as
-- Signed when it has at least one signed file. Requires 0021 (can_edit).

create table if not exists public.delivery_note_files (
  id                uuid primary key default gen_random_uuid(),
  delivery_note_id  uuid not null references public.delivery_notes (id) on delete cascade,
  storage_path      text not null,
  file_name         text not null,
  file_size         bigint,
  kind              text not null default 'unsigned' check (kind in ('signed','unsigned')),
  uploaded_by       uuid references auth.users (id) on delete set null default auth.uid(),
  uploaded_at       timestamptz not null default now()
);
create index if not exists delivery_note_files_note_idx
  on public.delivery_note_files (delivery_note_id, uploaded_at desc);

alter table public.delivery_note_files enable row level security;

drop policy if exists delivery_note_files_all on public.delivery_note_files;
create policy delivery_note_files_all on public.delivery_note_files
  for all to authenticated
  using (not public.is_firstfix() and exists (
    select 1 from public.delivery_notes d
    where d.id = delivery_note_id and public.is_project_member(d.project_id)))
  with check (not public.is_firstfix() and exists (
    select 1 from public.delivery_notes d
    where d.id = delivery_note_id and public.is_project_member(d.project_id)));

-- View-only users can't write (same rule as the other procurement tables).
drop policy if exists delivery_note_files_edit_ins on public.delivery_note_files;
create policy delivery_note_files_edit_ins on public.delivery_note_files
  as restrictive for insert to authenticated with check (public.can_edit('tracker'));
drop policy if exists delivery_note_files_edit_upd on public.delivery_note_files;
create policy delivery_note_files_edit_upd on public.delivery_note_files
  as restrictive for update to authenticated
  using (public.can_edit('tracker')) with check (public.can_edit('tracker'));
drop policy if exists delivery_note_files_edit_del on public.delivery_note_files;
create policy delivery_note_files_edit_del on public.delivery_note_files
  as restrictive for delete to authenticated using (public.can_edit('tracker'));

-- Carry over scans uploaded through the earlier single "signed copy" columns.
insert into public.delivery_note_files
  (delivery_note_id, storage_path, file_name, file_size, kind, uploaded_by, uploaded_at)
select id, signed_storage_path, coalesce(signed_file_name, 'signed-copy'), signed_file_size,
       'signed', signed_uploaded_by, coalesce(signed_uploaded_at, now())
from public.delivery_notes d
where signed_storage_path is not null
  and not exists (select 1 from public.delivery_note_files f where f.storage_path = d.signed_storage_path);
