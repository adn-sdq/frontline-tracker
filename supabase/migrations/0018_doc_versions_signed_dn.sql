-- 0018: document version history, approved copies, signed delivery notes,
-- and the missing storage DELETE policy for the `documents` bucket.

-- ---------------------------------------------------------------------------
-- 1. Storage: allow deleting objects in the documents bucket.
--    Without this, storage.remove() silently no-ops and files are orphaned.
-- ---------------------------------------------------------------------------
drop policy if exists "docs delete" on storage.objects;
create policy "docs delete" on storage.objects
  for delete to authenticated using (bucket_id = 'documents');

-- ---------------------------------------------------------------------------
-- 2. Approved / stamped copies. A file with a review_code is the reviewed copy
--    returned by the consultant; uploading one sets the document's status.
-- ---------------------------------------------------------------------------
alter table public.document_files
  add column if not exists review_code text
  check (review_code in ('code_a','code_b','code_c'));

-- ---------------------------------------------------------------------------
-- 3. Signed delivery notes. Unsigned by default; a signed scan can be attached.
-- ---------------------------------------------------------------------------
alter table public.delivery_notes
  add column if not exists signed_storage_path text,
  add column if not exists signed_file_name    text,
  add column if not exists signed_file_size    bigint,
  add column if not exists signed_uploaded_by  uuid references auth.users (id) on delete set null,
  add column if not exists signed_uploaded_at  timestamptz;

-- ---------------------------------------------------------------------------
-- 4. document_history — every saved change, who made it, and the version.
-- ---------------------------------------------------------------------------
create table if not exists public.document_history (
  id           bigserial primary key,
  document_id  uuid not null,
  project_id   uuid,
  version      int,
  action       text not null check (action in (
                 'create','update','delete',
                 'file_upload','file_rename','file_update','file_delete')),
  changed_by   uuid references auth.users (id) on delete set null,
  changed_at   timestamptz not null default now(),
  file_name    text,
  diff         jsonb,
  snapshot     jsonb
);

create index if not exists document_history_doc_idx
  on public.document_history (document_id, changed_at desc);

alter table public.document_history enable row level security;

-- Read-only for project members; writes happen via triggers only.
drop policy if exists document_history_select on public.document_history;
create policy document_history_select on public.document_history
  for select to authenticated
  using (project_id is not null and public.is_project_member(project_id));

-- Document field changes → history row (runs after documents_stamp bumped version).
create or replace function public.documents_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d    jsonb := '{}'::jsonb;
  k    text;
begin
  if tg_op = 'INSERT' then
    insert into public.document_history (document_id, project_id, version, action, changed_by, snapshot)
    values (new.id, new.project_id, new.version, 'create', auth.uid(), to_jsonb(new));
    return new;
  elsif tg_op = 'UPDATE' then
    for k in select jsonb_object_keys(to_jsonb(new)) loop
      if (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k)
         and k not in ('updated_at','updated_by','version','created_at','created_by') then
        d := d || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(old) -> k, 'new', to_jsonb(new) -> k));
      end if;
    end loop;
    if d <> '{}'::jsonb then
      insert into public.document_history (document_id, project_id, version, action, changed_by, diff, snapshot)
      values (new.id, new.project_id, new.version, 'update', auth.uid(), d, to_jsonb(new));
    end if;
    return new;
  else
    insert into public.document_history (document_id, project_id, version, action, changed_by, snapshot)
    values (old.id, old.project_id, old.version, 'delete', auth.uid(), to_jsonb(old));
    return old;
  end if;
end;
$$;

drop trigger if exists documents_audit_trg on public.documents;
create trigger documents_audit_trg
  after insert or update or delete on public.documents
  for each row execute function public.documents_audit();

-- File changes → bump the parent document's version (and apply an approved
-- copy's review code to its status), then record a history row.
create or replace function public.document_files_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  doc_id  uuid := coalesce(new.document_id, old.document_id);
  v_proj  uuid;
  v_ver   int;
  d       jsonb := '{}'::jsonb;
  k       text;
  act     text;
begin
  if tg_op = 'UPDATE' then
    for k in select unnest(array['file_name','dated','note','rev_label','review_code']) loop
      if (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k) then
        d := d || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(old) -> k, 'new', to_jsonb(new) -> k));
      end if;
    end loop;
    if d = '{}'::jsonb then
      return new;
    end if;
    act := case when d ? 'file_name' and (select count(*) from jsonb_object_keys(d)) = 1
                then 'file_rename' else 'file_update' end;
  elsif tg_op = 'INSERT' then
    act := 'file_upload';
  else
    act := 'file_delete';
  end if;

  -- Touch the parent: documents_stamp bumps version + updated_by. An approved
  -- copy also moves the status (logged separately as an 'update' row).
  if tg_op <> 'DELETE' and new.review_code is not null
     and (tg_op = 'INSERT' or new.review_code is distinct from old.review_code) then
    update public.documents set status = new.review_code where id = doc_id;
  else
    update public.documents set updated_at = now() where id = doc_id;
  end if;

  select project_id, version into v_proj, v_ver from public.documents where id = doc_id;
  -- Parent already gone (cascade delete) — nothing worth recording.
  if v_proj is null then
    return coalesce(new, old);
  end if;

  insert into public.document_history
    (document_id, project_id, version, action, changed_by, file_name, diff, snapshot)
  values (
    doc_id, v_proj, v_ver, act, auth.uid(),
    coalesce(new.file_name, old.file_name),
    nullif(d, '{}'::jsonb),
    to_jsonb(coalesce(new, old))
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists document_files_audit_trg on public.document_files;
create trigger document_files_audit_trg
  after insert or update or delete on public.document_files
  for each row execute function public.document_files_audit();

-- Backfill a 'create' row so existing documents have a starting point.
insert into public.document_history (document_id, project_id, version, action, changed_by, changed_at, snapshot)
select d.id, d.project_id, d.version, 'create', d.created_by, d.created_at, to_jsonb(d)
from public.documents d
where not exists (select 1 from public.document_history h where h.document_id = d.id);

do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='document_history') then
    alter publication supabase_realtime add table public.document_history;
  end if;
end $$;
