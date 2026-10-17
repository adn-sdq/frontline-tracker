-- 0027: our own SKU per product line + QR-tracked units.
--
--   projects.code        short abbreviation (e.g. MP, KFSH), unique across projects
--   items.sku            "<CODE>-0042", unique across ALL projects, assigned once, never changes
--   items.tracking       'unit' = devices: each unit has its own tag (<SKU>-01, -02 …) and QR
--                        'lot'  = accessories / small parts: one tag and QR for the whole line
--   item_unit_events     deliberate field updates on a tag (received / moved / installed / issue / note).
--                        Scans themselves are NOT logged.
--
-- Unit tag = SKU + "-" + 2-digit unit number, derived (no rows needed). Serial numbers stay
-- optional in item_serials; the tag, not the serial, is what the QR encodes.
-- Additive only: nothing existing is renamed or dropped.

-- ---------------------------------------------------------------------------
-- 1. Project codes
-- ---------------------------------------------------------------------------
alter table public.projects add column if not exists code text;

create or replace function public.gen_project_code(p_name text)
returns text
language plpgsql
set search_path = public
as $$
declare
  words text[] := regexp_split_to_array(upper(regexp_replace(coalesce(p_name, ''), '[^A-Za-z0-9 ]', ' ', 'g')), '\s+');
  base  text := '';
  w     text;
  cand  text;
  n     int := 1;
begin
  foreach w in array words loop
    if w <> '' and length(base) < 4 then base := base || left(w, 1); end if;
  end loop;
  if length(base) < 2 then base := left(coalesce(nullif(array_to_string(words, ''), ''), 'PRJ'), 4); end if;
  if length(base) < 2 then base := 'PRJ'; end if;
  cand := base;
  while exists (select 1 from public.projects where upper(code) = cand) loop
    n := n + 1;
    cand := left(base, 5) || n::text;
  end loop;
  return cand;
end;
$$;

-- Fill existing projects (oldest first so the earliest keeps the plain code).
do $$
declare r record;
begin
  for r in select id, name from public.projects where code is null order by created_at, id loop
    update public.projects set code = public.gen_project_code(r.name) where id = r.id;
  end loop;
end $$;

alter table public.projects alter column code set not null;
alter table public.projects drop constraint if exists projects_code_format;
alter table public.projects add constraint projects_code_format check (code ~ '^[A-Z0-9]{2,6}$');
create unique index if not exists projects_code_key on public.projects (code);

create or replace function public.projects_code_guard()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.code := upper(btrim(coalesce(new.code, '')));
  if new.code = '' then new.code := public.gen_project_code(new.name); end if;
  return new;
end;
$$;

drop trigger if exists projects_code_trg on public.projects;
create trigger projects_code_trg before insert or update of code on public.projects
  for each row execute function public.projects_code_guard();

-- ---------------------------------------------------------------------------
-- 2. SKUs on items
-- ---------------------------------------------------------------------------
alter table public.items
  add column if not exists sku      text,
  add column if not exists tracking text not null default 'unit';
alter table public.items drop constraint if exists items_tracking_check;
alter table public.items add constraint items_tracking_check check (tracking in ('unit', 'lot'));

create table if not exists public.item_sku_counters (
  project_id uuid primary key references public.projects (id) on delete cascade,
  last       int not null default 0
);
alter table public.item_sku_counters enable row level security;  -- no policies: trigger-only

create or replace function public.items_assign_sku()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare n int;
begin
  if tg_op = 'UPDATE' then
    new.sku := old.sku;                      -- immutable once assigned (labels are printed)
    if new.sku is not null then return new; end if;
  end if;
  if new.sku is null then
    insert into public.item_sku_counters (project_id, last) values (new.project_id, 1)
      on conflict (project_id) do update set last = public.item_sku_counters.last + 1
      returning last into n;
    new.sku := (select code from public.projects where id = new.project_id) || '-' || lpad(n::text, 4, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists items_assign_sku_trg on public.items;
create trigger items_assign_sku_trg before insert or update on public.items
  for each row execute function public.items_assign_sku();

-- Backfill without bumping versions or writing item history.
alter table public.items disable trigger user;
do $$
declare r record; n int; prev uuid := null;
begin
  for r in select id, project_id from public.items where sku is null order by project_id, created_at, id loop
    if r.project_id is distinct from prev then
      select coalesce(last, 0) into n from public.item_sku_counters where project_id = r.project_id;
      n := coalesce(n, 0);
      prev := r.project_id;
    end if;
    n := n + 1;
    update public.items
       set sku = (select code from public.projects where id = r.project_id) || '-' || lpad(n::text, 4, '0')
     where id = r.id;
    insert into public.item_sku_counters (project_id, last) values (r.project_id, n)
      on conflict (project_id) do update set last = excluded.last;
  end loop;
end $$;
alter table public.items enable trigger user;

create unique index if not exists items_sku_key on public.items (sku);

-- ---------------------------------------------------------------------------
-- 3. Field updates on a tag
-- ---------------------------------------------------------------------------
create table if not exists public.item_unit_events (
  id         bigserial primary key,
  item_id    uuid not null references public.items (id) on delete cascade,
  unit_index int,                                   -- null = the whole lot
  kind       text not null check (kind in ('received', 'moved', 'installed', 'issue', 'note')),
  location   text,
  note       text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists item_unit_events_idx on public.item_unit_events (item_id, unit_index, created_at desc);

alter table public.item_unit_events enable row level security;

drop policy if exists item_unit_events_select on public.item_unit_events;
create policy item_unit_events_select on public.item_unit_events
  for select to authenticated
  using (not public.is_firstfix() and exists (
    select 1 from public.items i where i.id = item_id and public.is_project_member(i.project_id)));

drop policy if exists item_unit_events_insert on public.item_unit_events;
create policy item_unit_events_insert on public.item_unit_events
  for insert to authenticated
  with check (not public.is_firstfix() and public.can_edit('tracker') and exists (
    select 1 from public.items i where i.id = item_id and public.is_project_member(i.project_id)));

drop policy if exists item_unit_events_delete on public.item_unit_events;
create policy item_unit_events_delete on public.item_unit_events
  for delete to authenticated
  using (public.can_edit('tracker') and exists (
    select 1 from public.items i where i.id = item_id and public.is_project_member(i.project_id)));
