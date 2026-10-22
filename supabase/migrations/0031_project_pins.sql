-- 0031: admins can pin up to 5 projects to the top of everyone's home page.
-- pinned_at = when it was pinned (pinned projects are shown oldest-pin first).

alter table public.projects add column if not exists pinned_at timestamptz;

create or replace function public.projects_pin_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.pinned_at is not null and (old.pinned_at is null or tg_op = 'INSERT') then
    if (select count(*) from public.projects where pinned_at is not null and id <> new.id) >= 5 then
      raise exception 'You can pin at most 5 projects. Unpin one first.';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists projects_pin_limit_trg on public.projects;
create trigger projects_pin_limit_trg before insert or update of pinned_at on public.projects
  for each row execute function public.projects_pin_limit();
