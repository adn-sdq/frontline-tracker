-- Frontline Tracker — MiSK Ilmi procurement coordination
-- Schema, RLS, audit triggers, and an optimistic-concurrency update RPC.
-- Safe to run multiple times (idempotent guards where practical).

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, used to attribute changes by name
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  username    text unique,
  full_name   text,
  role        text not null default 'editor',
  created_at  timestamptz not null default now()
);

-- Auto-create a profile row whenever a new auth user is created.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'username', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- items: the procurement line items (AV / PAVA / IPTV / SCREENS)
-- ---------------------------------------------------------------------------
create table if not exists public.items (
  id                   uuid primary key default gen_random_uuid(),
  system               text not null check (system in ('AV','PAVA','IPTV','SCREENS')),
  location             text,
  sno                  int,
  brand                text,
  model_no             text,
  description          text,
  qty_required         numeric not null default 0,
  qty_ordered          numeric not null default 0,
  qty_delivered        numeric not null default 0,
  qty_installed        numeric not null default 0,
  procurement_status   text not null default 'not_started'
                         check (procurement_status in ('not_started','quoted','po_issued','ordered')),
  delivery_status      text not null default 'pending'
                         check (delivery_status in ('pending','partial','delivered')),
  installation_status  text not null default 'not_started'
                         check (installation_status in ('not_started','in_progress','installed','commissioned')),
  supplier             text,
  eta                  date,
  notes                text,
  created_by           uuid references auth.users (id),
  created_at           timestamptz not null default now(),
  updated_by           uuid references auth.users (id),
  updated_at           timestamptz not null default now(),
  version              int not null default 1
);

create index if not exists items_system_idx on public.items (system);
create index if not exists items_updated_at_idx on public.items (updated_at desc);

-- ---------------------------------------------------------------------------
-- item_history: full audit log — who changed what, when (data-loss safety)
-- ---------------------------------------------------------------------------
create table if not exists public.item_history (
  id          bigserial primary key,
  item_id     uuid,
  action      text not null check (action in ('create','update','delete')),
  changed_by  uuid references auth.users (id),
  changed_at  timestamptz not null default now(),
  diff        jsonb,
  snapshot    jsonb
);

create index if not exists item_history_item_idx on public.item_history (item_id, changed_at desc);

-- Stamp created_by/updated_by/version on write, and record an audit row.
create or replace function public.items_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := auth.uid();
  diff jsonb := '{}'::jsonb;
  key text;
begin
  if (tg_op = 'INSERT') then
    new.created_by := coalesce(new.created_by, uid);
    new.updated_by := uid;
    new.created_at := now();
    new.updated_at := now();
    new.version := 1;
    insert into public.item_history (item_id, action, changed_by, snapshot)
    values (new.id, 'create', uid, to_jsonb(new));
    return new;

  elsif (tg_op = 'UPDATE') then
    new.updated_by := uid;
    new.updated_at := now();
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    if (new.version = old.version) then
      new.version := old.version + 1;
    end if;
    -- compute a shallow field-level diff (old -> new)
    for key in select jsonb_object_keys(to_jsonb(new)) loop
      if (to_jsonb(new) -> key) is distinct from (to_jsonb(old) -> key)
         and key not in ('updated_at','updated_by','version') then
        diff := diff || jsonb_build_object(
          key, jsonb_build_object('old', to_jsonb(old) -> key, 'new', to_jsonb(new) -> key)
        );
      end if;
    end loop;
    if diff <> '{}'::jsonb then
      insert into public.item_history (item_id, action, changed_by, diff, snapshot)
      values (new.id, 'update', uid, diff, to_jsonb(new));
    end if;
    return new;

  elsif (tg_op = 'DELETE') then
    insert into public.item_history (item_id, action, changed_by, snapshot)
    values (old.id, 'delete', uid, to_jsonb(old));
    return old;
  end if;
  return null;
end;
$$;

drop trigger if exists items_audit_ins on public.items;
drop trigger if exists items_audit_upd on public.items;
drop trigger if exists items_audit_del on public.items;

create trigger items_audit_ins before insert on public.items
  for each row execute function public.items_audit();
create trigger items_audit_upd before update on public.items
  for each row execute function public.items_audit();
create trigger items_audit_del after delete on public.items
  for each row execute function public.items_audit();

-- ---------------------------------------------------------------------------
-- update_item: optimistic-concurrency RPC. Applies a JSON patch only if the
-- caller's expected version matches; otherwise raises a 'conflict' so the UI
-- can warn instead of silently overwriting another user's change.
-- ---------------------------------------------------------------------------
create or replace function public.update_item(
  p_id uuid,
  p_expected_version int,
  p_patch jsonb
)
returns public.items
language plpgsql
security invoker
set search_path = public
as $$
declare
  allowed text[] := array[
    'system','location','sno','brand','model_no','description',
    'qty_required','qty_ordered','qty_delivered','qty_installed',
    'procurement_status','delivery_status','installation_status',
    'supplier','eta','notes'
  ];
  cur public.items;
  patched jsonb;
  k text;
  result public.items;
begin
  select * into cur from public.items where id = p_id for update;
  if not found then
    raise exception 'not_found' using errcode = 'P0002';
  end if;
  if cur.version <> p_expected_version then
    raise exception 'conflict' using errcode = 'P0001',
      detail = format('expected version %s but current is %s', p_expected_version, cur.version);
  end if;

  -- keep only whitelisted keys from the patch
  patched := '{}'::jsonb;
  for k in select jsonb_object_keys(p_patch) loop
    if k = any (allowed) then
      patched := patched || jsonb_build_object(k, p_patch -> k);
    end if;
  end loop;

  update public.items as i
     set system              = coalesce((patched ->> 'system'), i.system),
         location            = case when patched ? 'location' then patched ->> 'location' else i.location end,
         sno                 = case when patched ? 'sno' then nullif(patched ->> 'sno','')::int else i.sno end,
         brand               = case when patched ? 'brand' then patched ->> 'brand' else i.brand end,
         model_no            = case when patched ? 'model_no' then patched ->> 'model_no' else i.model_no end,
         description         = case when patched ? 'description' then patched ->> 'description' else i.description end,
         qty_required        = coalesce(nullif(patched ->> 'qty_required','')::numeric, i.qty_required),
         qty_ordered         = coalesce(nullif(patched ->> 'qty_ordered','')::numeric, i.qty_ordered),
         qty_delivered       = coalesce(nullif(patched ->> 'qty_delivered','')::numeric, i.qty_delivered),
         qty_installed       = coalesce(nullif(patched ->> 'qty_installed','')::numeric, i.qty_installed),
         procurement_status  = coalesce((patched ->> 'procurement_status'), i.procurement_status),
         delivery_status     = coalesce((patched ->> 'delivery_status'), i.delivery_status),
         installation_status = coalesce((patched ->> 'installation_status'), i.installation_status),
         supplier            = case when patched ? 'supplier' then patched ->> 'supplier' else i.supplier end,
         eta                 = case when patched ? 'eta' then nullif(patched ->> 'eta','')::date else i.eta end,
         notes               = case when patched ? 'notes' then patched ->> 'notes' else i.notes end
   where i.id = p_id
   returning * into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.items enable row level security;
alter table public.item_history enable row level security;

-- profiles: any authenticated user can read; users can update their own row.
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select to authenticated using (true);
drop policy if exists profiles_update_self on public.profiles;
create policy profiles_update_self on public.profiles
  for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- items: flat access — any authenticated user can do everything.
drop policy if exists items_select on public.items;
create policy items_select on public.items
  for select to authenticated using (true);
drop policy if exists items_insert on public.items;
create policy items_insert on public.items
  for insert to authenticated with check (true);
drop policy if exists items_update on public.items;
create policy items_update on public.items
  for update to authenticated using (true) with check (true);
drop policy if exists items_delete on public.items;
create policy items_delete on public.items
  for delete to authenticated using (true);

-- item_history: read-only for authenticated; writes happen via trigger only.
drop policy if exists item_history_select on public.item_history;
create policy item_history_select on public.item_history
  for select to authenticated using (true);

-- Realtime: broadcast item changes to subscribed clients.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'items'
  ) then
    alter publication supabase_realtime add table public.items;
  end if;
end $$;
