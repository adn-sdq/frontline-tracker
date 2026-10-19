-- 0030: tokens issued to OAuth clients (Claude connectors, via Supabase's OAuth
-- server) can read but never write.
--
-- OAuth access tokens carry a `client_id` claim; a person's normal app session
-- does not. These RESTRICTIVE policies AND with every existing policy, so even a
-- bug or a hostile client can't change data with a connector token — whatever
-- the MCP code does. New tables need the same three policies (see the loop).

do $$
declare
  t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('drop policy if exists oauth_read_only_ins on public.%I', t);
    execute format('drop policy if exists oauth_read_only_upd on public.%I', t);
    execute format('drop policy if exists oauth_read_only_del on public.%I', t);
    execute format(
      'create policy oauth_read_only_ins on public.%I as restrictive for insert to authenticated with check ((auth.jwt() ->> %L) is null)',
      t, 'client_id');
    execute format(
      'create policy oauth_read_only_upd on public.%I as restrictive for update to authenticated using ((auth.jwt() ->> %L) is null) with check ((auth.jwt() ->> %L) is null)',
      t, 'client_id', 'client_id');
    execute format(
      'create policy oauth_read_only_del on public.%I as restrictive for delete to authenticated using ((auth.jwt() ->> %L) is null)',
      t, 'client_id');
  end loop;
end $$;
