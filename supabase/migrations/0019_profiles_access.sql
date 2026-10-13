-- 0019: richer profiles, account status, SLA manager capability, profile
-- audit log, last-seen tracking — and a tighter profiles guard.

-- ---------------------------------------------------------------------------
-- 1. Profile details + account status
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists job_title       text,
  add column if not exists department      text,
  add column if not exists phone           text,
  add column if not exists contact_email   text,
  add column if not exists employee_id     text,
  add column if not exists location        text,
  add column if not exists bio             text,
  add column if not exists status          text not null default 'active'
                                           check (status in ('active','suspended')),
  add column if not exists status_reason   text,
  add column if not exists is_sla_manager  boolean not null default false,
  add column if not exists last_seen_at    timestamptz,
  add column if not exists updated_at      timestamptz;

-- ---------------------------------------------------------------------------
-- 2. Guard: non-admins may edit only their own contact details.
--    Previously allowed_pages / is_tech_manager were self-editable via the API.
-- ---------------------------------------------------------------------------
create or replace function public.profiles_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- auth.uid() is null for the service role (admin-users edge function) and
  -- SQL-editor sessions; those are trusted. Only end users are restricted.
  if auth.uid() is not null and not public.is_admin() then
    new.is_admin        := old.is_admin;
    new.org             := old.org;
    new.username        := old.username;
    new.role            := old.role;
    new.allowed_pages   := old.allowed_pages;
    new.is_tech_manager := old.is_tech_manager;
    new.is_sla_manager  := old.is_sla_manager;
    new.status          := old.status;
    new.status_reason   := old.status_reason;
    new.employee_id     := old.employee_id;
  end if;
  if (to_jsonb(new) - 'last_seen_at' - 'updated_at')
     = (to_jsonb(old) - 'last_seen_at' - 'updated_at') then
    return new; -- heartbeat only; don't touch updated_at
  end if;
  new.updated_at := now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- 3. Capability helper
-- ---------------------------------------------------------------------------
create or replace function public.is_sla_manager()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin()
      or coalesce((select is_sla_manager from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------------------
-- 4. Last-seen heartbeat (called by the client, throttled)
-- ---------------------------------------------------------------------------
create or replace function public.touch_last_seen()
returns void
language sql
security definer
set search_path = public
as $$
  update public.profiles set last_seen_at = now() where id = auth.uid();
$$;
grant execute on function public.touch_last_seen() to authenticated;

-- ---------------------------------------------------------------------------
-- 5. profile_history — who changed which profile field, when.
-- ---------------------------------------------------------------------------
create table if not exists public.profile_history (
  id          bigserial primary key,
  profile_id  uuid not null,
  action      text not null check (action in ('create','update','delete')),
  changed_by  uuid references auth.users (id) on delete set null,
  changed_at  timestamptz not null default now(),
  diff        jsonb
);
create index if not exists profile_history_profile_idx
  on public.profile_history (profile_id, changed_at desc);

alter table public.profile_history enable row level security;
drop policy if exists profile_history_select on public.profile_history;
create policy profile_history_select on public.profile_history
  for select to authenticated
  using (public.is_admin() or profile_id = auth.uid());

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
    insert into public.profile_history (profile_id, action, changed_by)
    values (new.id, 'create', auth.uid());
    return new;
  elsif tg_op = 'DELETE' then
    insert into public.profile_history (profile_id, action, changed_by)
    values (old.id, 'delete', auth.uid());
    return old;
  end if;
  for k in select jsonb_object_keys(to_jsonb(new)) loop
    if (to_jsonb(new) -> k) is distinct from (to_jsonb(old) -> k)
       and k not in ('updated_at','last_seen_at') then
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

drop trigger if exists profiles_audit_trg on public.profiles;
create trigger profiles_audit_trg
  after insert or update or delete on public.profiles
  for each row execute function public.profiles_audit();
