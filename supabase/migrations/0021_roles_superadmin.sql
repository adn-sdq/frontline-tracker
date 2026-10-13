-- 0021: role/admin consistency, hidden super admin, custom access roles with
-- per-page None / View / Edit levels — enforced in the database.

-- ---------------------------------------------------------------------------
-- 1. `role` is the single source of truth for admin rights.
--    Accounts created as admins from the console got is_admin = true but kept
--    role = 'member', so the UI showed "Member" while they had full admin
--    rights. Align is_admin to the visible role.
-- ---------------------------------------------------------------------------
-- The owner account carried a legacy 'editor' role with is_admin = true.
update public.profiles set role = 'admin' where username = 'adnan';

update public.profiles set is_admin = (role = 'admin')
where is_admin is distinct from (role = 'admin');

create or replace function public.profiles_sync_admin()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    -- New accounts may arrive with only is_admin set (signup metadata).
    if new.is_admin and new.role <> 'admin' then new.role := 'admin'; end if;
  elsif new.role is distinct from old.role then
    null; -- role changed: is_admin follows below
  elsif new.is_admin is distinct from old.is_admin then
    new.role := case when new.is_admin then 'admin'
                     when old.role = 'admin' then 'member'
                     else old.role end;
  end if;
  new.is_admin := (new.role = 'admin');
  return new;
end;
$$;

-- Named to sort after profiles_guard_upd so the guard runs first.
drop trigger if exists profiles_sync_admin_trg on public.profiles;
create trigger profiles_sync_admin_trg
  before insert or update on public.profiles
  for each row execute function public.profiles_sync_admin();

-- ---------------------------------------------------------------------------
-- 2. Super admin (not shown anywhere in the UI). Can switch between full
--    admin ("elevated") and their normal assigned access at will.
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false,
  add column if not exists super_elevated boolean not null default true;

update public.profiles set is_super_admin = true where username = 'adnan';

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select case when is_super_admin then super_elevated else is_admin end
       from public.profiles where id = auth.uid()),
    false);
$$;

create or replace function public.set_super_mode(p_elevated boolean)
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set super_elevated = p_elevated
  where id = auth.uid() and is_super_admin;
$$;
grant execute on function public.set_super_mode(boolean) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Custom access roles
-- ---------------------------------------------------------------------------
create table if not exists public.access_roles (
  id              uuid primary key default gen_random_uuid(),
  name            text not null unique,
  description     text,
  -- { "<page>": "none" | "view" | "edit" }; missing page = none
  permissions     jsonb not null default '{}'::jsonb,
  is_tech_manager boolean not null default false,
  is_sla_manager  boolean not null default false,
  created_by      uuid references auth.users (id) on delete set null default auth.uid(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

alter table public.access_roles enable row level security;
drop policy if exists access_roles_read on public.access_roles;
create policy access_roles_read on public.access_roles
  for select to authenticated using (true);
drop policy if exists access_roles_admin on public.access_roles;
create policy access_roles_admin on public.access_roles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

alter table public.profiles
  add column if not exists access_role_id uuid references public.access_roles (id) on delete set null;

-- ---------------------------------------------------------------------------
-- 4. Guard: privileged columns are admin-only; super-admin columns are
--    untouchable through the API (super_elevated only via set_super_mode).
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is not null then
    new.is_super_admin := old.is_super_admin;
    if not (old.is_super_admin and auth.uid() = old.id) then
      new.super_elevated := old.super_elevated;
    end if;
  end if;
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin        := old.is_admin;
    new.org             := old.org;
    new.username        := old.username;
    new.role            := old.role;
    new.allowed_pages   := old.allowed_pages;
    new.access_role_id  := old.access_role_id;
    new.is_tech_manager := old.is_tech_manager;
    new.is_sla_manager  := old.is_sla_manager;
    new.status          := old.status;
    new.status_reason   := old.status_reason;
    new.employee_id     := old.employee_id;
  end if;
  if (to_jsonb(new) - 'last_seen_at' - 'updated_at')
     = (to_jsonb(old) - 'last_seen_at' - 'updated_at') then
    return new;
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- Keep the super-admin columns out of the visible profile audit trail.
create or replace function public.profiles_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  d jsonb := '{}'::jsonb;
  k text;
begin
  if tg_op = 'INSERT' then
    insert into public.profile_history (profile_id, action, changed_by) values (new.id, 'create', auth.uid());
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.profile_history (profile_id, action, changed_by) values (old.id, 'delete', auth.uid());
    return old;
  end if;
  for k in select jsonb_object_keys(to_jsonb(new)) loop
    if (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k)
       and k not in ('updated_at','last_seen_at','is_super_admin','super_elevated') then
      d := d || jsonb_build_object(k, jsonb_build_object('old', to_jsonb(old) -> k, 'new', to_jsonb(new) -> k));
    end if;
  end loop;
  if d <> '{}'::jsonb then
    insert into public.profile_history (profile_id, action, changed_by, diff)
    values (new.id, 'update', auth.uid(), d);
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 5. Effective access — mirrors src/lib/access.ts
-- ---------------------------------------------------------------------------
create or replace function public.page_access(p_page text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select case
    when public.is_admin() then 'edit'
    when pr.status = 'suspended' then 'none'
    when pr.org = 'firstfix' then case when p_page = 'documents' then 'edit' else 'none' end
    when r.id is not null then coalesce(r.permissions ->> p_page, 'none')
    when pr.allowed_pages is not null and not (p_page = any (pr.allowed_pages)) then 'none'
    when pr.role = 'guest' then 'view'
    else 'edit'
  end
  from public.profiles pr
  left join public.access_roles r on r.id = pr.access_role_id
  where pr.id = auth.uid();
$$;

create or replace function public.can_edit(p_page text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(public.page_access(p_page) = 'edit', false);
$$;

-- Capabilities can also come from the assigned role.
create or replace function public.is_tech_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or coalesce(
    (select pr.is_tech_manager or coalesce(r.is_tech_manager, false)
       from public.profiles pr left join public.access_roles r on r.id = pr.access_role_id
      where pr.id = auth.uid()), false);
$$;

create or replace function public.is_sla_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or coalesce(
    (select pr.is_sla_manager or coalesce(r.is_sla_manager, false)
       from public.profiles pr left join public.access_roles r on r.id = pr.access_role_id
      where pr.id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- 6. Enforce View-only: RESTRICTIVE write policies AND with existing ones.
--    Trigger-written audit tables run as definer and are unaffected.
-- ---------------------------------------------------------------------------
do $$
declare
  rec record;
begin
  for rec in
    select * from (values
      ('items', 'tracker'), ('item_files', 'tracker'), ('item_serials', 'tracker'),
      ('delivery_notes', 'tracker'),
      ('documents', 'documents'), ('document_files', 'documents'),
      ('tickets', 'tickets'),
      ('technician_requests', 'technicians'),
      ('sla_contracts', 'sla'), ('sla_visits', 'sla'), ('sla_issues', 'sla'), ('sla_issue_events', 'sla')
    ) as t(tbl, page)
  loop
    execute format('drop policy if exists %I on public.%I', rec.tbl || '_edit_ins', rec.tbl);
    execute format('drop policy if exists %I on public.%I', rec.tbl || '_edit_upd', rec.tbl);
    execute format('drop policy if exists %I on public.%I', rec.tbl || '_edit_del', rec.tbl);
    execute format(
      'create policy %I on public.%I as restrictive for insert to authenticated with check (public.can_edit(%L))',
      rec.tbl || '_edit_ins', rec.tbl, rec.page);
    execute format(
      'create policy %I on public.%I as restrictive for update to authenticated using (public.can_edit(%L)) with check (public.can_edit(%L))',
      rec.tbl || '_edit_upd', rec.tbl, rec.page, rec.page);
    execute format(
      'create policy %I on public.%I as restrictive for delete to authenticated using (public.can_edit(%L))',
      rec.tbl || '_edit_del', rec.tbl, rec.page);
  end loop;
end $$;
