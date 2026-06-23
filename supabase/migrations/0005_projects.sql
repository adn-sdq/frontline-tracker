-- Frontline Tracker — multi-project support.
--   * projects + project_members (admin assigns people to projects)
--   * items & documents become project-scoped
--   * RLS: members see only their assigned projects; admins see everything
-- Idempotent where practical.

-- ---------------------------------------------------------------------------
-- 1. projects
-- ---------------------------------------------------------------------------
create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  sort        int not null default 0,
  active      boolean not null default true,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- 2. project_members (assignment)
-- ---------------------------------------------------------------------------
create table if not exists public.project_members (
  project_id uuid not null references public.projects (id) on delete cascade,
  user_id    uuid not null references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists project_members_user_idx on public.project_members (user_id);

-- ---------------------------------------------------------------------------
-- 3. project_id on items & documents (nullable for backfill)
-- ---------------------------------------------------------------------------
alter table public.items
  add column if not exists project_id uuid references public.projects (id) on delete cascade;
alter table public.documents
  add column if not exists project_id uuid references public.projects (id) on delete cascade;

-- ---------------------------------------------------------------------------
-- 4. Seed a default project, backfill existing rows, assign all current users.
--    Safe to re-run: only seeds when there are no projects yet, and only
--    backfills rows that are still NULL.
-- ---------------------------------------------------------------------------
do $$
declare
  pid uuid;
begin
  select id into pid from public.projects order by sort, created_at limit 1;
  if pid is null then
    insert into public.projects (name, description, sort)
    values ('MiSK Ilmi', 'Initial project (migrated from single-project data)', 1)
    returning id into pid;

    insert into public.project_members (project_id, user_id)
    select pid, id from public.profiles
    on conflict do nothing;
  end if;

  update public.items set project_id = pid where project_id is null;
  update public.documents set project_id = pid where project_id is null;
end $$;

-- ---------------------------------------------------------------------------
-- 5. Enforce NOT NULL now that everything is backfilled.
-- ---------------------------------------------------------------------------
alter table public.items alter column project_id set not null;
alter table public.documents alter column project_id set not null;
create index if not exists items_project_idx on public.items (project_id);
create index if not exists documents_project_idx on public.documents (project_id);

-- ---------------------------------------------------------------------------
-- 6. Membership helper (admins implicitly belong to every project)
-- ---------------------------------------------------------------------------
create or replace function public.is_project_member(p_project uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.project_members
    where project_id = p_project and user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- 7. RLS: projects & project_members
-- ---------------------------------------------------------------------------
alter table public.projects enable row level security;
drop policy if exists projects_select on public.projects;
create policy projects_select on public.projects
  for select to authenticated
  using (public.is_admin() or public.is_project_member(id));
drop policy if exists projects_admin_write on public.projects;
create policy projects_admin_write on public.projects
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.project_members enable row level security;
drop policy if exists project_members_select on public.project_members;
create policy project_members_select on public.project_members
  for select to authenticated
  using (public.is_admin() or user_id = auth.uid());
drop policy if exists project_members_admin_write on public.project_members;
create policy project_members_admin_write on public.project_members
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------------------
-- 8. RLS: items — now also gated by project membership
-- ---------------------------------------------------------------------------
drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select to authenticated
  using (not public.is_firstfix() and public.is_project_member(project_id));
drop policy if exists items_insert on public.items;
create policy items_insert on public.items
  for insert to authenticated
  with check (not public.is_firstfix() and public.is_project_member(project_id));
drop policy if exists items_update on public.items;
create policy items_update on public.items
  for update to authenticated
  using (not public.is_firstfix() and public.is_project_member(project_id))
  with check (not public.is_firstfix() and public.is_project_member(project_id));
drop policy if exists items_delete on public.items;
create policy items_delete on public.items
  for delete to authenticated
  using (not public.is_firstfix() and public.is_project_member(project_id));

-- item_history: gate via the parent item's project, falling back to the
-- snapshot's project_id so deleted-item history stays visible to members.
drop policy if exists item_history_select on public.item_history;
create policy item_history_select on public.item_history
  for select to authenticated
  using (
    not public.is_firstfix() and public.is_project_member(
      coalesce(
        (select i.project_id from public.items i where i.id = item_history.item_id),
        nullif(item_history.snapshot ->> 'project_id', '')::uuid
      )
    )
  );

-- ---------------------------------------------------------------------------
-- 9. RLS: documents and related rows — gated by project membership
-- ---------------------------------------------------------------------------
drop policy if exists documents_all on public.documents;
create policy documents_all on public.documents
  for all to authenticated
  using (public.is_project_member(project_id))
  with check (public.is_project_member(project_id));

drop policy if exists document_files_all on public.document_files;
create policy document_files_all on public.document_files
  for all to authenticated
  using (exists (
    select 1 from public.documents d
    where d.id = document_files.document_id and public.is_project_member(d.project_id)
  ))
  with check (exists (
    select 1 from public.documents d
    where d.id = document_files.document_id and public.is_project_member(d.project_id)
  ));

drop policy if exists document_comments_all on public.document_comments;
create policy document_comments_all on public.document_comments
  for all to authenticated
  using (exists (
    select 1 from public.documents d
    where d.id = document_comments.document_id and public.is_project_member(d.project_id)
  ))
  with check (exists (
    select 1 from public.documents d
    where d.id = document_comments.document_id and public.is_project_member(d.project_id)
  ));

-- ---------------------------------------------------------------------------
-- 10. RLS: item_files — gate via the parent item's project
-- ---------------------------------------------------------------------------
drop policy if exists "item_files_select" on public.item_files;
create policy "item_files_select" on public.item_files
  for select to authenticated
  using (not public.is_firstfix() and exists (
    select 1 from public.items i
    where i.id = item_files.item_id and public.is_project_member(i.project_id)
  ));
drop policy if exists "item_files_insert" on public.item_files;
create policy "item_files_insert" on public.item_files
  for insert to authenticated
  with check (not public.is_firstfix() and exists (
    select 1 from public.items i
    where i.id = item_files.item_id and public.is_project_member(i.project_id)
  ));
drop policy if exists "item_files_update" on public.item_files;
create policy "item_files_update" on public.item_files
  for update to authenticated
  using (not public.is_firstfix() and exists (
    select 1 from public.items i
    where i.id = item_files.item_id and public.is_project_member(i.project_id)
  ));
drop policy if exists "item_files_delete" on public.item_files;
create policy "item_files_delete" on public.item_files
  for delete to authenticated
  using (not public.is_firstfix() and exists (
    select 1 from public.items i
    where i.id = item_files.item_id and public.is_project_member(i.project_id)
  ));

-- ---------------------------------------------------------------------------
-- 11. Realtime
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='projects') then
    alter publication supabase_realtime add table public.projects;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='project_members') then
    alter publication supabase_realtime add table public.project_members;
  end if;
end $$;
