-- Frontline Tracker — roles/admin, dynamic systems, and document tracking.
-- Adds: profile roles (org + is_admin), an editable systems list, a document
-- workflow (documents + stacked file uploads + comments), a private storage
-- bucket, and the matching RLS. Idempotent where practical.

-- ---------------------------------------------------------------------------
-- Profiles: organisation tag (frontline | firstfix) + admin flag
-- ---------------------------------------------------------------------------
alter table public.profiles add column if not exists org text;
alter table public.profiles add column if not exists is_admin boolean not null default false;

-- Seed the initial admin (the first account created during setup).
update public.profiles set is_admin = true, org = 'frontline' where username = 'adnan';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- New signups: also pull org / full_name / is_admin from metadata when present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, org, is_admin)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    new.raw_user_meta_data ->> 'org',
    coalesce((new.raw_user_meta_data ->> 'is_admin')::boolean, false)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Admins may update any profile (role/org); users still update their own.
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated
  using (auth.uid() = id or public.is_admin())
  with check (auth.uid() = id or public.is_admin());

-- ---------------------------------------------------------------------------
-- Systems: an editable category list (was a hard-coded CHECK constraint)
-- ---------------------------------------------------------------------------
create table if not exists public.systems (
  key        text primary key,
  label      text not null,
  sort       int not null default 0,
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.systems (key, label, sort) values
  ('AV', 'AV', 1),
  ('PAVA', 'PAVA', 2),
  ('IPTV', 'IPTV', 3),
  ('SCREENS', 'Screens', 4)
on conflict (key) do nothing;

alter table public.systems enable row level security;
drop policy if exists systems_select on public.systems;
create policy systems_select on public.systems
  for select to authenticated using (true);
drop policy if exists systems_admin_write on public.systems;
create policy systems_admin_write on public.systems
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Replace the items CHECK constraint with a FK to the editable systems list.
alter table public.items drop constraint if exists items_system_check;
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'items_system_fkey'
  ) then
    alter table public.items
      add constraint items_system_fkey foreign key (system)
      references public.systems (key) on update cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Documents: one row per tracked document
-- ---------------------------------------------------------------------------
create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  doc_number  text,
  system      text references public.systems (key) on update cascade,
  description text,
  status      text not null default 'pending'
                check (status in ('pending','under_review','code_a','code_b','code_c')),
  revision    text,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_by  uuid references auth.users (id),
  updated_at  timestamptz not null default now(),
  version     int not null default 1
);
create index if not exists documents_system_idx on public.documents (system);
create index if not exists documents_updated_idx on public.documents (updated_at desc);

create or replace function public.documents_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := auth.uid();
    new.created_at := now();
    new.updated_at := now();
    new.version := 1;
  elsif tg_op = 'UPDATE' then
    new.updated_by := auth.uid();
    new.updated_at := now();
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    if new.version = old.version then
      new.version := old.version + 1;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists documents_stamp_ins on public.documents;
drop trigger if exists documents_stamp_upd on public.documents;
create trigger documents_stamp_ins before insert on public.documents
  for each row execute function public.documents_stamp();
create trigger documents_stamp_upd before update on public.documents
  for each row execute function public.documents_stamp();

-- Stacked file uploads — every upload is kept (never overwritten).
create table if not exists public.document_files (
  id           uuid primary key default gen_random_uuid(),
  document_id  uuid not null references public.documents (id) on delete cascade,
  storage_path text not null,
  file_name    text not null,
  file_size    bigint,
  rev_label    text,
  note         text,
  uploaded_by  uuid references auth.users (id) default auth.uid(),
  uploaded_at  timestamptz not null default now()
);
create index if not exists document_files_doc_idx
  on public.document_files (document_id, uploaded_at desc);

-- Review comments thread.
create table if not exists public.document_comments (
  id          bigserial primary key,
  document_id uuid not null references public.documents (id) on delete cascade,
  body        text not null,
  code        text,
  author      uuid references auth.users (id) default auth.uid(),
  created_at  timestamptz not null default now()
);
create index if not exists document_comments_doc_idx
  on public.document_comments (document_id, created_at asc);

-- Flat RLS: any authenticated user can read/write documents & related rows.
alter table public.documents enable row level security;
alter table public.document_files enable row level security;
alter table public.document_comments enable row level security;

drop policy if exists documents_all on public.documents;
create policy documents_all on public.documents
  for all to authenticated using (true) with check (true);
drop policy if exists document_files_all on public.document_files;
create policy document_files_all on public.document_files
  for all to authenticated using (true) with check (true);
drop policy if exists document_comments_all on public.document_comments;
create policy document_comments_all on public.document_comments
  for all to authenticated using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Storage: private bucket for document files (served via signed URLs)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;

drop policy if exists "docs read" on storage.objects;
create policy "docs read" on storage.objects
  for select to authenticated using (bucket_id = 'documents');
drop policy if exists "docs insert" on storage.objects;
create policy "docs insert" on storage.objects
  for insert to authenticated with check (bucket_id = 'documents');
drop policy if exists "docs update" on storage.objects;
create policy "docs update" on storage.objects
  for update to authenticated using (bucket_id = 'documents');

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='documents') then
    alter publication supabase_realtime add table public.documents;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='document_files') then
    alter publication supabase_realtime add table public.document_files;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='document_comments') then
    alter publication supabase_realtime add table public.document_comments;
  end if;
end $$;
