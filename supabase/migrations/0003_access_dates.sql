-- Frontline Tracker — access hardening + editable document dates.
--   1. Editable document date on uploads (auto-defaults to today).
--   2. Stop non-admins from changing their own role/org (privilege escalation).
--   3. Keep First Fix (contractor) users out of procurement at the DB level.

-- ---------------------------------------------------------------------------
-- 1. Editable date per uploaded file (defaults to upload day)
-- ---------------------------------------------------------------------------
alter table public.document_files
  add column if not exists dated date not null default current_date;

-- ---------------------------------------------------------------------------
-- 2. Profiles guard: non-admins may only edit their own full_name.
--    (RLS lets a user update their own row, but must not let them flip
--     is_admin / org / username / role.)
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    new.is_admin := old.is_admin;
    new.org := old.org;
    new.username := old.username;
    new.role := old.role;
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_guard_upd on public.profiles;
create trigger profiles_guard_upd before update on public.profiles
  for each row execute function public.profiles_guard();

-- ---------------------------------------------------------------------------
-- 3. First Fix users can only work with documents, not procurement items.
-- ---------------------------------------------------------------------------
create or replace function public.is_firstfix()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select org = 'firstfix' from public.profiles where id = auth.uid()), false);
$$;

drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select to authenticated using (not public.is_firstfix());
drop policy if exists items_insert on public.items;
create policy items_insert on public.items
  for insert to authenticated with check (not public.is_firstfix());
drop policy if exists items_update on public.items;
create policy items_update on public.items
  for update to authenticated
  using (not public.is_firstfix()) with check (not public.is_firstfix());
drop policy if exists items_delete on public.items;
create policy items_delete on public.items
  for delete to authenticated using (not public.is_firstfix());

drop policy if exists item_history_select on public.item_history;
create policy item_history_select on public.item_history
  for select to authenticated using (not public.is_firstfix());
