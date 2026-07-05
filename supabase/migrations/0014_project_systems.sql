-- Junction table: which systems are enabled per project.
-- Projects opt-in to specific systems; all globally-active systems are seeded
-- for existing projects when this migration runs.

create table if not exists public.project_systems (
  project_id uuid not null references public.projects(id) on delete cascade,
  system_key text not null,
  primary key (project_id, system_key)
);

alter table public.project_systems enable row level security;

-- Admins can read and write; all authenticated users can read (needed for
-- useSystems to filter tabs without admin privileges).
create policy "authenticated users can read project_systems"
  on public.project_systems for select
  to authenticated using (true);

create policy "admins can insert project_systems"
  on public.project_systems for insert
  to authenticated with check (public.is_admin());

create policy "admins can delete project_systems"
  on public.project_systems for delete
  to authenticated using (public.is_admin());

-- Seed: assign all currently-active systems to every existing project.
insert into public.project_systems (project_id, system_key)
select p.id, s.key
from public.projects p
cross join public.systems s
where s.active = true
on conflict do nothing;
