-- 0020: SLA tracking — maintenance contracts with periodic site visits.
--
--   sla_contracts      one per SLA client/site (monthly by default)
--   sla_visits         one per contract per period; signed visit report upload
--   sla_issues         problems found on site; open/deferred ones carry over
--                      to the next visit until resolved
--   sla_issue_events   per-issue timeline (opened, deferred at visit X, resolved…)
--
-- Access: any non-Firstfix user can read and log visits/issues; contracts are
-- managed by SLA managers (profiles.is_sla_manager) and admins.

create table if not exists public.sla_contracts (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  client           text,
  site             text,
  contract_ref     text,
  project_id       uuid references public.projects (id) on delete set null,
  start_date       date not null,
  end_date         date,
  frequency_months int  not null default 1 check (frequency_months in (1, 2, 3, 6, 12)),
  preferred_day    int  check (preferred_day between 1 and 28),
  systems          text[] not null default '{}',
  scope            text,
  contact_name     text,
  contact_phone    text,
  contact_email    text,
  account_manager  uuid references auth.users (id) on delete set null,
  status           text not null default 'active'
                   check (status in ('active','on_hold','ended')),
  notes            text,
  created_by       uuid references auth.users (id) on delete set null default auth.uid(),
  created_at       timestamptz not null default now(),
  updated_by       uuid references auth.users (id) on delete set null,
  updated_at       timestamptz not null default now()
);

create table if not exists public.sla_visits (
  id                  uuid primary key default gen_random_uuid(),
  contract_id         uuid not null references public.sla_contracts (id) on delete cascade,
  period              date not null,          -- first day of the month this visit covers
  scheduled_date      date,
  visited_on          date,
  status              text not null default 'scheduled'
                      check (status in ('scheduled','completed','missed','cancelled')),
  technician_ids      uuid[] not null default '{}',
  lead_by             uuid references auth.users (id) on delete set null,
  work_done           text,
  customer_signatory  text,
  notes               text,
  signed_storage_path text,
  signed_file_name    text,
  signed_file_size    bigint,
  signed_uploaded_by  uuid references auth.users (id) on delete set null,
  signed_uploaded_at  timestamptz,
  created_by          uuid references auth.users (id) on delete set null default auth.uid(),
  created_at          timestamptz not null default now(),
  updated_by          uuid references auth.users (id) on delete set null,
  updated_at          timestamptz not null default now(),
  unique (contract_id, period)
);
create index if not exists sla_visits_contract_idx on public.sla_visits (contract_id, period desc);

create table if not exists public.sla_issues (
  id                uuid primary key default gen_random_uuid(),
  contract_id       uuid not null references public.sla_contracts (id) on delete cascade,
  found_visit_id    uuid references public.sla_visits (id) on delete set null,
  title             text not null,
  description       text,
  location          text,
  system            text,
  severity          text not null default 'medium'
                    check (severity in ('low','medium','high','critical')),
  status            text not null default 'open'
                    check (status in ('open','in_progress','deferred','resolved')),
  resolution        text,
  status_note       text,                   -- note attached to the latest status change
  last_visit_id     uuid references public.sla_visits (id) on delete set null,
  resolved_visit_id uuid references public.sla_visits (id) on delete set null,
  resolved_by       uuid references auth.users (id) on delete set null,
  resolved_at       timestamptz,
  created_by        uuid references auth.users (id) on delete set null default auth.uid(),
  created_at        timestamptz not null default now(),
  updated_by        uuid references auth.users (id) on delete set null,
  updated_at        timestamptz not null default now()
);
create index if not exists sla_issues_contract_idx on public.sla_issues (contract_id, status);

create table if not exists public.sla_issue_events (
  id         bigserial primary key,
  issue_id   uuid not null references public.sla_issues (id) on delete cascade,
  visit_id   uuid references public.sla_visits (id) on delete set null,
  action     text not null check (action in ('opened','updated','in_progress','deferred','resolved','reopened')),
  note       text,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists sla_issue_events_issue_idx on public.sla_issue_events (issue_id, created_at);

-- ---------------------------------------------------------------------------
-- Stamps
-- ---------------------------------------------------------------------------
create or replace function public.sla_stamp()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  if tg_op = 'UPDATE' then
    new.created_by := old.created_by;
    new.created_at := old.created_at;
  end if;
  return new;
end;
$$;

drop trigger if exists sla_contracts_stamp on public.sla_contracts;
create trigger sla_contracts_stamp before insert or update on public.sla_contracts
  for each row execute function public.sla_stamp();
drop trigger if exists sla_visits_stamp on public.sla_visits;
create trigger sla_visits_stamp before insert or update on public.sla_visits
  for each row execute function public.sla_stamp();
drop trigger if exists sla_issues_stamp on public.sla_issues;
create trigger sla_issues_stamp before insert or update on public.sla_issues
  for each row execute function public.sla_stamp();

-- Issue timeline: log creation and every status change automatically.
create or replace function public.sla_issues_events()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    insert into public.sla_issue_events (issue_id, visit_id, action, note, created_by)
    values (new.id, new.found_visit_id, 'opened', new.description, auth.uid());
  elsif new.status is distinct from old.status then
    insert into public.sla_issue_events (issue_id, visit_id, action, note, created_by)
    values (
      new.id,
      new.last_visit_id,
      case
        when new.status = 'resolved' then 'resolved'
        when new.status = 'deferred' then 'deferred'
        when new.status = 'in_progress' then 'in_progress'
        when old.status = 'resolved' then 'reopened'
        else 'updated'
      end,
      coalesce(new.status_note, case when new.status = 'resolved' then new.resolution end),
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists sla_issues_events_trg on public.sla_issues;
create trigger sla_issues_events_trg after insert or update on public.sla_issues
  for each row execute function public.sla_issues_events();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.sla_contracts    enable row level security;
alter table public.sla_visits       enable row level security;
alter table public.sla_issues       enable row level security;
alter table public.sla_issue_events enable row level security;

drop policy if exists sla_contracts_read on public.sla_contracts;
create policy sla_contracts_read on public.sla_contracts
  for select to authenticated using (not public.is_firstfix());
drop policy if exists sla_contracts_write on public.sla_contracts;
create policy sla_contracts_write on public.sla_contracts
  for all to authenticated
  using (public.is_sla_manager()) with check (public.is_sla_manager());

drop policy if exists sla_visits_read on public.sla_visits;
create policy sla_visits_read on public.sla_visits
  for select to authenticated using (not public.is_firstfix());
drop policy if exists sla_visits_insert on public.sla_visits;
create policy sla_visits_insert on public.sla_visits
  for insert to authenticated with check (not public.is_firstfix());
drop policy if exists sla_visits_update on public.sla_visits;
create policy sla_visits_update on public.sla_visits
  for update to authenticated using (not public.is_firstfix());
drop policy if exists sla_visits_delete on public.sla_visits;
create policy sla_visits_delete on public.sla_visits
  for delete to authenticated using (public.is_sla_manager());

drop policy if exists sla_issues_read on public.sla_issues;
create policy sla_issues_read on public.sla_issues
  for select to authenticated using (not public.is_firstfix());
drop policy if exists sla_issues_insert on public.sla_issues;
create policy sla_issues_insert on public.sla_issues
  for insert to authenticated with check (not public.is_firstfix());
drop policy if exists sla_issues_update on public.sla_issues;
create policy sla_issues_update on public.sla_issues
  for update to authenticated using (not public.is_firstfix());
drop policy if exists sla_issues_delete on public.sla_issues;
create policy sla_issues_delete on public.sla_issues
  for delete to authenticated using (public.is_sla_manager());

drop policy if exists sla_issue_events_read on public.sla_issue_events;
create policy sla_issue_events_read on public.sla_issue_events
  for select to authenticated using (not public.is_firstfix());
drop policy if exists sla_issue_events_insert on public.sla_issue_events;
create policy sla_issue_events_insert on public.sla_issue_events
  for insert to authenticated with check (not public.is_firstfix());

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['sla_contracts','sla_visits','sla_issues'] loop
    if not exists (select 1 from pg_publication_tables
                   where pubname='supabase_realtime' and schemaname='public' and tablename=t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
