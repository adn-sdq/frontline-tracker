-- 0023: Roles are the ONLY source of access.
--
--   * Every account has exactly one access role (profiles.access_role_id).
--   * Built-in roles: Admin (everything + Admin Console), Guest (view
--     Documents & Tickets), No access (nothing).
--   * Each page is None / View / Edit. Edit on Technicians replaces the old
--     "Technicians manager" capability; Edit on SLA replaces "SLA manager".
--   * The legacy columns (profiles.role / allowed_pages / is_tech_manager /
--     is_sla_manager, access_roles capability flags) stop granting anything;
--     profiles.role and is_admin are derived from the access role.
-- Requires 0021.

-- ---------------------------------------------------------------------------
-- 1. Built-in roles
-- ---------------------------------------------------------------------------
alter table public.access_roles
  add column if not exists key       text unique,
  add column if not exists is_system boolean not null default false,
  add column if not exists sort      int not null default 100;

-- Free up the built-in names if a custom role already uses one.
update public.access_roles set name = name || ' (custom)'
where key is null and name in ('Admin', 'Guest', 'No access');

insert into public.access_roles (key, name, description, permissions, is_system, sort) values
  ('admin', 'Admin', 'Full access to every page, every project and the Admin Console.',
   '{"tracker":"edit","documents":"edit","dashboard":"edit","tickets":"edit","technicians":"edit","sla":"edit"}', true, 0),
  ('guest', 'Guest', 'View-only access to Documents and Tickets.',
   '{"documents":"view","tickets":"view"}', true, 1),
  ('none', 'No access', 'Can sign in but sees nothing until given another role.',
   '{}', true, 2)
on conflict (key) do update set is_system = true;

-- A few starter roles (editable, deletable).
insert into public.access_roles (name, description, permissions, sort)
select * from (values
  ('Project Engineer', 'Runs procurement and documents on assigned projects.',
   '{"tracker":"edit","documents":"edit","dashboard":"view","tickets":"edit","technicians":"edit","sla":"view"}'::jsonb, 10),
  ('Document Controller', 'Manages submittals and review codes.',
   '{"documents":"edit","tickets":"view","dashboard":"view"}'::jsonb, 11),
  ('Site Supervisor', 'Coordinates technicians and SLA visits on site.',
   '{"tracker":"view","documents":"view","tickets":"edit","technicians":"edit","sla":"edit"}'::jsonb, 12),
  ('Procurement Officer', 'Orders and tracks equipment and delivery notes.',
   '{"tracker":"edit","documents":"view","dashboard":"view","tickets":"view"}'::jsonb, 13),
  ('Viewer', 'Read-only access to everything.',
   '{"tracker":"view","documents":"view","dashboard":"view","tickets":"view","technicians":"view","sla":"view"}'::jsonb, 14)
) as t(name, description, permissions, sort)
where not exists (select 1 from public.access_roles r where r.name = t.name);

-- ---------------------------------------------------------------------------
-- 2. Move every account onto a role, preserving what they could do before.
-- ---------------------------------------------------------------------------
do $$
declare
  rid_admin uuid := (select id from public.access_roles where key = 'admin');
  rid_guest uuid := (select id from public.access_roles where key = 'guest');
  rec record;
  rid uuid;
  role_name text;
  perms jsonb;
  pg text;
  all_pages text[] := array['tracker','documents','dashboard','tickets','technicians','sla'];
begin
  -- Admins (including the super admin's stored role)
  update public.profiles set access_role_id = rid_admin where role = 'admin' or is_admin;

  -- Firstfix: documents only
  if exists (select 1 from public.profiles where org = 'firstfix' and access_role_id is distinct from rid_admin) then
    insert into public.access_roles (name, description, permissions, sort)
    values ('Firstfix — Documents', 'Firstfix staff: documents only.', '{"documents":"edit"}', 20)
    on conflict (name) do nothing;
    update public.profiles set access_role_id = (select id from public.access_roles where name = 'Firstfix — Documents')
    where org = 'firstfix' and access_role_id is distinct from rid_admin;
  end if;

  -- Guests
  update public.profiles set access_role_id = rid_guest
  where role = 'guest' and access_role_id is null;

  -- Members without a role: one role per distinct page set, all Edit.
  for rec in
    select distinct coalesce(allowed_pages, all_pages) as pages
    from public.profiles
    where access_role_id is null
  loop
    perms := '{}'::jsonb;
    foreach pg in array rec.pages loop
      perms := perms || jsonb_build_object(pg, 'edit');
    end loop;
    role_name := case
      when rec.pages @> all_pages then 'Member — full edit'
      else 'Member — ' || array_to_string(rec.pages, ', ')
    end;
    insert into public.access_roles (name, description, permissions, sort)
    values (role_name, 'Created automatically from previous individual page access.', perms, 30)
    on conflict (name) do nothing;
    rid := (select id from public.access_roles where name = role_name);
    update public.profiles set access_role_id = rid
    where access_role_id is null and coalesce(allowed_pages, all_pages) = rec.pages;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Keep profiles consistent: role / is_admin derive from the access role;
--    a missing role means "No access".
-- ---------------------------------------------------------------------------
create or replace function public.profiles_sync_admin()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  rid_admin uuid := (select id from public.access_roles where key = 'admin');
begin
  if tg_op = 'INSERT' and new.access_role_id is null and new.is_admin then
    new.access_role_id := rid_admin;            -- admin created via signup metadata
  end if;
  if new.access_role_id is null then
    new.access_role_id := (select id from public.access_roles where key = 'none');
  end if;
  new.is_admin := (new.access_role_id = rid_admin);
  new.role := case when new.is_admin then 'admin' else 'member' end;
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. Access = the role. Nothing else grants it.
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
    else coalesce(r.permissions ->> p_page, 'none')
  end
  from public.profiles pr
  left join public.access_roles r on r.id = pr.access_role_id
  where pr.id = auth.uid();
$$;

-- Capabilities now come from Edit access on the page.
create or replace function public.is_tech_manager()
returns boolean language sql stable security definer set search_path = public
as $$ select public.can_edit('technicians'); $$;

create or replace function public.is_sla_manager()
returns boolean language sql stable security definer set search_path = public
as $$ select public.can_edit('sla'); $$;

-- ---------------------------------------------------------------------------
-- 5. Built-in roles can't be deleted or renamed; Admin and No access are fixed.
-- ---------------------------------------------------------------------------
create or replace function public.access_roles_protect()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if old.is_system then
    new.key := old.key;
    new.is_system := true;
    new.name := old.name;
    if old.key in ('admin', 'none') then
      new.permissions := old.permissions;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists access_roles_protect_trg on public.access_roles;
create trigger access_roles_protect_trg
  before update on public.access_roles
  for each row execute function public.access_roles_protect();

drop policy if exists access_roles_no_delete_system on public.access_roles;
create policy access_roles_no_delete_system on public.access_roles
  as restrictive for delete to authenticated using (not is_system);
