-- SLA demo data — NOT a migration. Run manually in the Supabase SQL editor
-- (needs migration 0020). Safe to re-run: it clears previous demo rows first.
-- Dates are relative to today, so the data always looks current.
--
-- Remove it all later:
--   delete from public.sla_contracts where contract_ref like 'DEMO-%';

delete from public.sla_contracts where contract_ref like 'DEMO-%';

do $$
declare
  m0 date := date_trunc('month', current_date)::date;   -- this month
  c_a uuid; c_b uuid; c_c uuid; c_d uuid; c_e uuid;
  v uuid; v2 uuid; i uuid;
  n int;
begin
  -- ── A: healthy monthly contract, an issue carried over, one critical open ──
  insert into public.sla_contracts
    (name, client, site, contract_ref, start_date, frequency_months, preferred_day, systems, scope,
     contact_name, contact_phone, contact_email, status, notes)
  values ('DEMO — Riyadh Campus AV', 'Demo Education Co.', 'Riyadh — Main Campus', 'DEMO-001',
          (m0 - interval '6 months')::date, 1, 10, '{AV,SCREENS}',
          E'Monthly preventive maintenance of lecture-hall AV: projector/display checks, microphone and DSP tests, cleaning, firmware review.',
          'Faisal Al-Qahtani', '+966 50 000 0001', 'faisal@example.com', 'active', 'Demo data')
  returning id into c_a;

  for n in reverse 6..1 loop
    insert into public.sla_visits
      (contract_id, period, scheduled_date, visited_on, status, work_done, customer_signatory)
    values (c_a, (m0 - make_interval(months => n))::date,
            (m0 - make_interval(months => n))::date + 9,
            (m0 - make_interval(months => n))::date + 9, 'completed',
            'Full AV walk-through; all rooms tested; filters cleaned.', 'Faisal Al-Qahtani');
  end loop;
  insert into public.sla_visits (contract_id, period, scheduled_date, status, customer_signatory)
  values (c_a, m0, m0 + 9, 'scheduled', 'Faisal Al-Qahtani');

  -- Issue found 5 months ago, fixed 4 months ago
  select id into v  from public.sla_visits where contract_id = c_a and period = (m0 - interval '5 months')::date;
  select id into v2 from public.sla_visits where contract_id = c_a and period = (m0 - interval '4 months')::date;
  insert into public.sla_issues (contract_id, found_visit_id, title, description, location, system, severity)
  values (c_a, v, 'Hall B microphone crackling', 'Wireless mic receiver gives intermittent noise.', 'Hall B', 'AV', 'medium')
  returning id into i;
  update public.sla_issues set status = 'resolved', status_note = 'Replaced antenna cable and re-paired mic.',
         resolution = 'Replaced antenna cable and re-paired mic.', last_visit_id = v2, resolved_visit_id = v2,
         resolved_at = now() - interval '4 months' where id = i;

  -- Issue found 3 months ago, kept for later visits (carries over)
  select id into v  from public.sla_visits where contract_id = c_a and period = (m0 - interval '3 months')::date;
  select id into v2 from public.sla_visits where contract_id = c_a and period = (m0 - interval '2 months')::date;
  insert into public.sla_issues (contract_id, found_visit_id, title, description, location, system, severity)
  values (c_a, v, 'Projector lamp near end of life', 'Lamp hours at 92%. Replacement lamp needs client PO.', 'Room 204', 'AV', 'low')
  returning id into i;
  update public.sla_issues set status = 'deferred', status_note = 'Waiting for client PO for spare lamp.',
         last_visit_id = v2 where id = i;

  -- Critical issue found last month, still open
  select id into v from public.sla_visits where contract_id = c_a and period = (m0 - interval '1 month')::date;
  insert into public.sla_issues (contract_id, found_visit_id, title, description, location, system, severity)
  values (c_a, v, 'Lecture hall 1 DSP offline', 'Audio DSP not responding on network; room has no sound reinforcement.', 'Lecture Hall 1', 'AV', 'critical');

  -- ── B: falling behind — overdue visits ──
  insert into public.sla_contracts
    (name, client, site, contract_ref, start_date, frequency_months, preferred_day, systems, scope,
     contact_name, contact_phone, status)
  values ('DEMO — Jeddah Tower PAVA', 'Demo Properties', 'Jeddah — Tower 2', 'DEMO-002',
          (m0 - interval '4 months')::date, 1, 5, '{PAVA}',
          'Monthly PAVA zone tests, battery checks and speaker line impedance readings.',
          'Omar Basahel', '+966 50 000 0002', 'active')
  returning id into c_b;
  for n in reverse 4..3 loop
    insert into public.sla_visits (contract_id, period, scheduled_date, visited_on, status, work_done)
    values (c_b, (m0 - make_interval(months => n))::date, (m0 - make_interval(months => n))::date + 4,
            (m0 - make_interval(months => n))::date + 4, 'completed', 'Zone tests passed; batteries within spec.');
  end loop;
  -- 2 months ago: booked but never happened (overdue); last month and now: nothing logged
  insert into public.sla_visits (contract_id, period, scheduled_date, status)
  values (c_b, (m0 - interval '2 months')::date, (m0 - interval '2 months')::date + 4, 'scheduled');
  select id into v from public.sla_visits where contract_id = c_b and period = (m0 - interval '3 months')::date;
  insert into public.sla_issues (contract_id, found_visit_id, title, description, location, system, severity)
  values (c_b, v, 'Zone 7 speaker line fault', 'High impedance reading on level 7 east loop.', 'Level 7', 'PAVA', 'high');

  -- ── C: quarterly contract, due now ──
  insert into public.sla_contracts
    (name, client, site, contract_ref, start_date, frequency_months, preferred_day, systems, scope,
     contact_name, status)
  values ('DEMO — Dammam School IPTV', 'Demo Schools Group', 'Dammam — Girls Campus', 'DEMO-003',
          (m0 - interval '9 months')::date, 3, 15, '{IPTV,SCREENS}',
          'Quarterly head-end health check, channel line-up verification and signage content review.',
          'Noura Al-Harbi', 'active')
  returning id into c_c;
  for n in 0..2 loop
    insert into public.sla_visits (contract_id, period, scheduled_date, visited_on, status, work_done)
    values (c_c, (m0 - make_interval(months => 9 - n * 3))::date,
            (m0 - make_interval(months => 9 - n * 3))::date + 14,
            (m0 - make_interval(months => 9 - n * 3))::date + 14, 'completed', 'Head-end checked; channels verified.');
  end loop;

  -- ── D: ended contract ──
  insert into public.sla_contracts
    (name, client, site, contract_ref, start_date, end_date, frequency_months, systems, contact_name, status)
  values ('DEMO — Old Mall Screens', 'Demo Retail', 'Khobar — Mall', 'DEMO-004',
          (m0 - interval '8 months')::date, (m0 - interval '2 months')::date, 1, '{SCREENS}', 'Mall office', 'ended')
  returning id into c_d;
  for n in reverse 8..2 loop
    insert into public.sla_visits (contract_id, period, scheduled_date, visited_on, status)
    values (c_d, (m0 - make_interval(months => n))::date, (m0 - make_interval(months => n))::date + 2,
            (m0 - make_interval(months => n))::date + 2, 'completed');
  end loop;

  -- ── E: on hold ──
  insert into public.sla_contracts
    (name, client, site, contract_ref, start_date, frequency_months, systems, contact_name, status, notes)
  values ('DEMO — Yanbu Clinic AV', 'Demo Health', 'Yanbu — Clinic', 'DEMO-005',
          (m0 - interval '3 months')::date, 1, '{AV}', 'Clinic manager', 'on_hold', 'Paused pending client budget approval.')
  returning id into c_e;
  insert into public.sla_visits (contract_id, period, scheduled_date, visited_on, status)
  values (c_e, (m0 - interval '3 months')::date, (m0 - interval '3 months')::date + 7,
          (m0 - interval '3 months')::date + 7, 'completed');
end $$;
