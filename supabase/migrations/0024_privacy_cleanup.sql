-- 0024: no usage tracking. Drops the profile audit trail and last-seen
-- heartbeat added in 0019 (the UI for both was removed in v2.19.0).

drop trigger if exists profiles_audit_trg on public.profiles;
drop function if exists public.profiles_audit();
drop table if exists public.profile_history;
drop function if exists public.touch_last_seen();
update public.profiles set last_seen_at = null where last_seen_at is not null;
