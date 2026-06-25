-- =============================================================================
-- Frontline Tracker — Development Seed Data
-- Realistic MiSK Ilmi AV/IT procurement data across all four systems.
-- DESTRUCTIVE: clears all items, documents, delivery notes and serials for the
-- first project before re-seeding. Safe to run multiple times.
-- =============================================================================

DO $$
DECLARE
  v_proj  uuid;
  -- item IDs (fixed so ON CONFLICT and serials link up)
  av1  uuid := 'a0000001-0000-0000-0000-000000000001';
  av2  uuid := 'a0000001-0000-0000-0000-000000000002';
  av3  uuid := 'a0000001-0000-0000-0000-000000000003';
  av4  uuid := 'a0000001-0000-0000-0000-000000000004';
  av5  uuid := 'a0000001-0000-0000-0000-000000000005';
  av6  uuid := 'a0000001-0000-0000-0000-000000000006';
  av7  uuid := 'a0000001-0000-0000-0000-000000000007';
  av8  uuid := 'a0000001-0000-0000-0000-000000000008';
  pa1  uuid := 'a0000002-0000-0000-0000-000000000001';
  pa2  uuid := 'a0000002-0000-0000-0000-000000000002';
  pa3  uuid := 'a0000002-0000-0000-0000-000000000003';
  pa4  uuid := 'a0000002-0000-0000-0000-000000000004';
  pa5  uuid := 'a0000002-0000-0000-0000-000000000005';
  ip1  uuid := 'a0000003-0000-0000-0000-000000000001';
  ip2  uuid := 'a0000003-0000-0000-0000-000000000002';
  ip3  uuid := 'a0000003-0000-0000-0000-000000000003';
  ip4  uuid := 'a0000003-0000-0000-0000-000000000004';
  ip5  uuid := 'a0000003-0000-0000-0000-000000000005';
  sc1  uuid := 'a0000004-0000-0000-0000-000000000001';
  sc2  uuid := 'a0000004-0000-0000-0000-000000000002';
  sc3  uuid := 'a0000004-0000-0000-0000-000000000003';
  sc4  uuid := 'a0000004-0000-0000-0000-000000000004';
BEGIN

  -- ── 1. Identify (or bail out on) the target project ─────────────────────
  SELECT id INTO v_proj FROM public.projects ORDER BY sort, created_at LIMIT 1;
  IF v_proj IS NULL THEN
    RAISE EXCEPTION 'No project found. Run migrations first.';
  END IF;

  -- ── 2. Update project details ────────────────────────────────────────────
  UPDATE public.projects SET
    name         = 'MiSK Ilmi Campus',
    description  = 'AV, PAVA, IPTV & LED Screens — Main Campus Build',
    client_name  = 'First Fix Contracting Co.',
    client_po    = 'CPO-2025-8821',
    our_po       = 'PO-2025-FL-001',
    site_location = 'MiSK Ilmi Campus, Northern Ring Road, Riyadh 13241',
    site_contact = 'Eng. Khalid Al-Otaibi'
  WHERE id = v_proj;

  -- ── 3. Wipe existing seed data ───────────────────────────────────────────
  DELETE FROM public.item_serials
    WHERE item_id IN (SELECT id FROM public.items WHERE project_id = v_proj);
  DELETE FROM public.delivery_notes WHERE project_id = v_proj;
  DELETE FROM public.documents      WHERE project_id = v_proj;
  DELETE FROM public.items          WHERE project_id = v_proj;

  -- ── 4. Items ─────────────────────────────────────────────────────────────
  -- AV -----------------------------------------------------------------------
  INSERT INTO public.items
    (id, project_id, system, unique_id, location, brand, model_no, description,
     qty_required, qty_ordered, qty_delivered, qty_installed,
     procurement_status, delivery_status, installation_status,
     supplier, eta, notes, version)
  VALUES
  -- Displays
  (av1, v_proj, 'AV', 'AV-001', 'Lecture Hall A / B / C', 'Samsung', 'QM65B',
   '65" 4K Commercial Display — wall-mount, content playback & input switching',
   8, 8, 5, 3,
   'ordered', 'partial', 'in_progress',
   'Al-Jammaz Distribution', '2026-03-10',
   'Remaining 3 units held at customs — agent following up', 1),

  -- Video conferencing
  (av2, v_proj, 'AV', 'AV-002', 'Executive Boardroom / Meeting Rooms 1–4', 'Crestron', 'UC-MX70-T',
   'Flex UC Video Conferencing System — tabletop touch controller + codec',
   4, 4, 4, 2,
   'ordered', 'delivered', 'in_progress',
   'ITC Saudi Arabia', '2026-02-01',
   'Units on-site. Rooms 1 & 2 commissioned; Rooms 3 & 4 pending ceiling works', 1),

  -- DSP
  (av3, v_proj, 'AV', 'AV-003', 'AV Rack Room 1', 'Biamp', 'TesiraFORTÉ AI',
   'DSP Audio Conferencing Server — 12×12 analog I/O, AEC, Dante',
   2, 2, 2, 2,
   'ordered', 'delivered', 'commissioned',
   'SHURE Saudi', '2026-01-20',
   NULL, 1),

  -- Ceiling microphones
  (av4, v_proj, 'AV', 'AV-004', 'Meeting Rooms 1–8', 'Shure', 'MXA910',
   'Ceiling Array Microphone — beamforming, 8 lobes, Dante output',
   8, 8, 4, 4,
   'ordered', 'partial', 'installed',
   'SHURE Saudi', '2026-03-25', NULL, 1),

  -- Projectors
  (av5, v_proj, 'AV', 'AV-005', 'Training Centre Room T1 / T2 / T3', 'Epson', 'EB-L735U',
   'WUXGA Laser Projector 7000 lm — ultra-short throw, 1:0.35 lens',
   3, 3, 2, 1,
   'ordered', 'partial', 'in_progress',
   'Techno Blue', '2026-03-15', NULL, 1),

  -- AV Matrix
  (av6, v_proj, 'AV', 'AV-006', 'AV Rack Room 1', 'Crestron', 'DM-MD6X6',
   '6×6 DigitalMedia Switching System — 4K60, auto-switching, PoE ports',
   1, 1, 1, 1,
   'ordered', 'delivered', 'commissioned',
   'ITC Saudi Arabia', '2026-01-28', NULL, 1),

  -- AV-over-IP encoders
  (av7, v_proj, 'AV', 'AV-007', 'All AV rooms', 'Crestron', 'DM-NVX-350',
   'AV-over-IP Encoder — 4K60 4:4:4, HDMI 2.0, PoE powered',
   12, 6, 0, 0,
   'po_issued', 'pending', 'not_started',
   'ITC Saudi Arabia', '2026-04-20',
   'Balance 6 units on second PO — awaiting finance approval', 1),

  -- Control processors
  (av8, v_proj, 'AV', 'AV-008', 'AV Rack Room 1', 'Crestron', 'CP4',
   '4-Series Control Processor — Ethernet, 3× COM, 8× I/O, Cresnet',
   2, 2, 2, 1,
   'ordered', 'delivered', 'in_progress',
   'ITC Saudi Arabia', '2026-01-28', NULL, 1),

  -- PAVA ---------------------------------------------------------------------
  (pa1, v_proj, 'PAVA', 'PA-001', 'PAVA Rack Room', 'Bosch', 'PRAESIDEO 4.0',
   'Network Controller — Open Interface card, 4× network slots',
   1, 1, 1, 1,
   'ordered', 'delivered', 'commissioned',
   'Zahid Electronics', '2026-01-15', NULL, 1),

  (pa2, v_proj, 'PAVA', 'PA-002', 'PAVA Rack Room', 'Bosch', 'PLE-1ME120-US',
   '120W Mixer Amplifier — 4 inputs, 2 priority channels, backup output',
   6, 6, 6, 5,
   'ordered', 'delivered', 'in_progress',
   'Zahid Electronics', '2026-01-15', NULL, 1),

  (pa3, v_proj, 'PAVA', 'PA-003', 'Corridors / Lobbies / Classrooms', 'Bosch', 'LC1-PC15G6-8',
   '15W 6" Lay-in Ceiling Speaker — 100V line, recessed, paintable grille',
   64, 64, 48, 40,
   'ordered', 'partial', 'in_progress',
   'Zahid Electronics', '2026-02-10',
   'Batch 1 (24 units) installed. Batch 2 (24 units) on-site. Batch 3 delivery Feb 28', 1),

  (pa4, v_proj, 'PAVA', 'PA-004', 'External Courtyards', 'Bosch', 'LBC3950/03',
   '6W Outdoor Horn Speaker — IP54, 100V, wide dispersion',
   8, 8, 8, 8,
   'ordered', 'delivered', 'commissioned',
   'Zahid Electronics', '2026-01-20', NULL, 1),

  (pa5, v_proj, 'PAVA', 'PA-005', 'PAVA Rack Room', 'Bosch', 'PRS-NST5',
   'Network System Terminal — 5 network interfaces, desktop/rack mount',
   2, 2, 0, 0,
   'ordered', 'pending', 'not_started',
   'Zahid Electronics', '2026-04-01',
   'Back-ordered — Bosch regional ETA April', 1),

  -- IPTV ---------------------------------------------------------------------
  (ip1, v_proj, 'IPTV', 'IT-001', 'Classrooms / Common Areas', 'Samsung', 'QBN55A',
   '55" QLED Commercial IPTV Display — MagicINFO, integrated tuner, 2× HDMI',
   20, 20, 16, 12,
   'ordered', 'partial', 'in_progress',
   'Al-Jammaz Distribution', '2026-02-20', NULL, 1),

  (ip2, v_proj, 'IPTV', 'IT-002', 'Classrooms / Common Areas', 'Dune HD', 'Pro 4K Solo',
   'IPTV Set-top Box — 4K H.265, IPTV/OTT, LAN + Wi-Fi, HDMI 2.0',
   22, 22, 16, 12,
   'ordered', 'partial', 'in_progress',
   'Dune HD Arabia', '2026-02-20', NULL, 1),

  (ip3, v_proj, 'IPTV', 'IT-003', 'Server Room', 'Triax', 'TDX 400',
   'IPTV Headend — up to 400 channels, DVB-S2/T2/C input, IP output',
   1, 1, 1, 1,
   'ordered', 'delivered', 'commissioned',
   'Signal Systems Co.', '2026-01-10', NULL, 1),

  (ip4, v_proj, 'IPTV', 'IT-004', 'Server Room / IDF Cabinets', 'Triax', 'CTA 144',
   'IPTV Distribution Amplifier — 144 outputs, 1GbE, managed',
   4, 4, 2, 2,
   'ordered', 'partial', 'in_progress',
   'Signal Systems Co.', '2026-03-01', NULL, 1),

  (ip5, v_proj, 'IPTV', 'IT-005', 'IDF Cabinets', 'Alcad', 'DA-204',
   '4-Way Passive Splitter — 5–2400 MHz, F-type connectors',
   12, 0, 0, 0,
   'not_started', 'pending', 'not_started',
   NULL, NULL,
   'Awaiting engineer confirmation of required zones', 1),

  -- SCREENS ------------------------------------------------------------------
  (sc1, v_proj, 'SCREENS', 'SC-001', 'Main Entrance Atrium', 'Samsung', 'IE015R',
   'Fine Pitch 1.5mm LED Panel — 600×337.5mm tile, indoor, 500 nit',
   180, 180, 0, 0,
   'ordered', 'pending', 'not_started',
   'Informa Markets', '2026-05-01',
   'Wall framing not complete — delivery deferred until structure ready', 1),

  (sc2, v_proj, 'SCREENS', 'SC-002', 'Main Entrance Atrium', 'NovaStar', 'MCTRL660 Pro',
   'LED Display Controller — 1× Ethernet in, dual HDMI/DVI input, 2.3M pixels',
   2, 2, 2, 1,
   'ordered', 'delivered', 'in_progress',
   'Informa Markets', '2026-02-15', NULL, 1),

  (sc3, v_proj, 'SCREENS', 'SC-003', 'Lobby Digital Signage', 'LG', 'LSCB015-GK',
   '55" Stretch LCD — 58:9 aspect, 700 nit, landscape/portrait',
   6, 6, 6, 4,
   'ordered', 'delivered', 'in_progress',
   'LG Electronics Gulf', '2026-02-01', NULL, 1),

  (sc4, v_proj, 'SCREENS', 'SC-004', 'AV/LED Rack Room', 'Absen', 'A2715-PRO',
   '27" 4K LED Reference Monitor — preview/confidence monitor for LED wall',
   1, 0, 0, 0,
   'quoted', 'pending', 'not_started',
   NULL, NULL,
   'Quote received from 2 vendors — awaiting price comparison sign-off', 1);

  -- ── 5. Serial numbers (for delivered units) ───────────────────────────────
  -- Samsung QM65B (av1) — 5 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av1, 1, 'QM65B-SA-A4K720001'),
    (av1, 2, 'QM65B-SA-A4K720002'),
    (av1, 3, 'QM65B-SA-A4K720003'),
    (av1, 4, 'QM65B-SA-A4K720004'),
    (av1, 5, 'QM65B-SA-A4K720005');

  -- Crestron UC-MX70-T (av2) — 4 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av2, 1, 'UCMX70-2025-00881'),
    (av2, 2, 'UCMX70-2025-00882'),
    (av2, 3, 'UCMX70-2025-00883'),
    (av2, 4, 'UCMX70-2025-00884');

  -- Biamp TesiraFORTÉ (av3) — 2 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av3, 1, 'TF-AI-240801-001'),
    (av3, 2, 'TF-AI-240801-002');

  -- Shure MXA910 (av4) — 4 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av4, 1, '5TA921500001'),
    (av4, 2, '5TA921500002'),
    (av4, 3, '5TA921500003'),
    (av4, 4, '5TA921500004');

  -- Epson projectors (av5) — 2 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av5, 1, 'L735U-X7AY000382'),
    (av5, 2, 'L735U-X7AY000383');

  -- Crestron DM-MD6X6 (av6) — 1 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av6, 1, 'DMMD6-20250088821');

  -- Crestron CP4 (av8) — 2 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (av8, 1, 'CP4-2025-SA-0441'),
    (av8, 2, 'CP4-2025-SA-0442');

  -- Bosch PRAESIDEO (pa1) — 1 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (pa1, 1, 'PRSD4-B00224471');

  -- Bosch mixer amps (pa2) — 6 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (pa2, 1, 'PLE120-2025-00001'),
    (pa2, 2, 'PLE120-2025-00002'),
    (pa2, 3, 'PLE120-2025-00003'),
    (pa2, 4, 'PLE120-2025-00004'),
    (pa2, 5, 'PLE120-2025-00005'),
    (pa2, 6, 'PLE120-2025-00006');

  -- Triax TDX headend (ip3) — 1 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (ip3, 1, 'TDX400-SN-20250048');

  -- Triax distribution amps (ip4) — 2 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (ip4, 1, 'CTA144-2025-001'),
    (ip4, 2, 'CTA144-2025-002');

  -- NovaStar controller (sc2) — 2 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (sc2, 1, 'MCTRL660-PRO-0091'),
    (sc2, 2, 'MCTRL660-PRO-0092');

  -- LG stretch LCD (sc3) — 6 delivered
  INSERT INTO public.item_serials (item_id, unit_index, serial_number) VALUES
    (sc3, 1, 'LSCB015-KR-20250001'),
    (sc3, 2, 'LSCB015-KR-20250002'),
    (sc3, 3, 'LSCB015-KR-20250003'),
    (sc3, 4, 'LSCB015-KR-20250004'),
    (sc3, 5, 'LSCB015-KR-20250005'),
    (sc3, 6, 'LSCB015-KR-20250006');

  -- ── 6. Documents ─────────────────────────────────────────────────────────
  INSERT INTO public.documents
    (project_id, title, doc_number, system, doc_type, revision, status, description)
  VALUES
  (v_proj, 'AV System Shop Drawings — Lecture Halls',  'FL-AV-SD-001', 'AV',     'shop_drawing',          'Rev B', 'code_a',
   'Complete AV shop drawings for Lecture Halls A, B and C including equipment rack layouts and cable routing'),

  (v_proj, 'PAVA System Schematic',                    'FL-PA-SC-001', 'PAVA',   'schematic',             'Rev A', 'under_review',
   'Single-line PAVA schematic showing speaker zones, amplifier assignments and emergency routing'),

  (v_proj, 'Samsung QM65B Display — Product Submittal', 'FL-AV-SM-001', 'AV',   'submittal',             'Rev A', 'code_a',
   'Manufacturer data sheet, compliance certificates and installation spec for QM65B series'),

  (v_proj, 'Crestron UC-MX70-T — Product Submittal',   'FL-AV-SM-002', 'AV',    'submittal',             'Rev A', 'code_b',
   'Crestron Flex submittal including network requirements and Zoom/Teams certification'),

  (v_proj, 'IPTV Distribution Layout',                 'FL-IT-SD-001', 'IPTV',  'shop_drawing',          'Rev A', 'under_review',
   'Headend to display routing diagram, VLAN assignments and bandwidth calculation'),

  (v_proj, 'AV & PAVA Method Statement',               'FL-MS-001',    NULL,    'method_statement',      'Rev A', 'code_a',
   'Installation, testing and commissioning method statement for all AV and PAVA systems'),

  (v_proj, 'PAVA Cause & Effect Matrix',               'FL-PA-CEM-001','PAVA',  'commissioning_report',  'Rev B', 'code_b',
   'Zone-by-zone cause and effect for all emergency and non-emergency announcements'),

  (v_proj, 'LED Wall As-Built Drawings',               'FL-SC-AB-001', 'SCREENS','as_built',             'Rev 0', 'pending',
   'As-built structural and electrical drawings for atrium LED wall installation — pending civil completion');

  -- ── 7. Delivery Notes ────────────────────────────────────────────────────
  INSERT INTO public.delivery_notes
    (project_id, seq, dn_number, dn_date, po, customer_po,
     deliver_to, location, contact, items)
  VALUES
  (v_proj, 1, 'DN-ILMI-20260120-001', '2026-01-20',
   'PO-2025-FL-001', 'CPO-2025-8821',
   'First Fix Contracting Co.', 'MiSK Ilmi Campus — PAVA Rack Room',
   'Eng. Khalid Al-Otaibi',
   '[{"description":"Bosch PRAESIDEO 4.0 Network Controller","qty":1,"serial":"PRSD4-B00224471"},{"description":"Bosch PLE-1ME120-US 120W Mixer Amplifier","qty":6,"serial":"PLE120-2025-00001 / PLE120-2025-00002 / PLE120-2025-00003 / PLE120-2025-00004 / PLE120-2025-00005 / PLE120-2025-00006"},{"description":"Bosch LBC3950/03 Outdoor Horn Speaker","qty":8,"serial":""}]'::jsonb),

  (v_proj, 2, 'DN-ILMI-20260215-002', '2026-02-15',
   'PO-2025-FL-001', 'CPO-2025-8821',
   'First Fix Contracting Co.', 'MiSK Ilmi Campus — AV Rack Room 1 + Boardroom',
   'Eng. Khalid Al-Otaibi',
   '[{"description":"Samsung QM65B 65\" 4K Commercial Display","qty":5,"serial":"QM65B-SA-A4K720001 / QM65B-SA-A4K720002 / QM65B-SA-A4K720003 / QM65B-SA-A4K720004 / QM65B-SA-A4K720005"},{"description":"Crestron UC-MX70-T Flex Video Conferencing Kit","qty":4,"serial":"UCMX70-2025-00881 / UCMX70-2025-00882 / UCMX70-2025-00883 / UCMX70-2025-00884"},{"description":"Crestron DM-MD6X6 DigitalMedia Switcher","qty":1,"serial":"DMMD6-20250088821"},{"description":"Crestron CP4 Control Processor","qty":2,"serial":"CP4-2025-SA-0441 / CP4-2025-SA-0442"}]'::jsonb),

  (v_proj, 3, 'DN-ILMI-20260310-003', '2026-03-10',
   'PO-2025-FL-001', 'CPO-2025-8821',
   'First Fix Contracting Co.', 'MiSK Ilmi Campus — Server Room + IDF Cabinets',
   'Eng. Khalid Al-Otaibi',
   '[{"description":"Triax TDX 400 IPTV Headend Controller","qty":1,"serial":"TDX400-SN-20250048"},{"description":"Triax CTA 144 Distribution Amplifier","qty":2,"serial":"CTA144-2025-001 / CTA144-2025-002"},{"description":"NovaStar MCTRL660 Pro LED Controller","qty":2,"serial":"MCTRL660-PRO-0091 / MCTRL660-PRO-0092"},{"description":"LG LSCB015-GK 55\" Stretch LCD Display","qty":6,"serial":"LSCB015-KR-20250001 / LSCB015-KR-20250002 / LSCB015-KR-20250003 / LSCB015-KR-20250004 / LSCB015-KR-20250005 / LSCB015-KR-20250006"}]'::jsonb);

  RAISE NOTICE 'Seed complete for project %', v_proj;
END $$;
