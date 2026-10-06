-- Migration 89: Restore Authentic Coach Match Events & Purge Referee Mock Events

-- 1. Fix recalculate_all_player_stats() safeupdate constraint (ensure UPDATE has WHERE clause)
CREATE OR REPLACE FUNCTION public.recalculate_all_player_stats()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rec RECORD;
  v_home_gk UUID;
  v_away_gk UUID;
  v_sub_gk UUID;
BEGIN
  CREATE TEMP TABLE IF NOT EXISTS temp_player_cs (
    player_id UUID,
    competition_id UUID,
    clean_sheets INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_cs;

  CREATE TEMP TABLE IF NOT EXISTS temp_player_goals (
    player_id UUID,
    competition_id UUID,
    goals INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_goals;

  CREATE TEMP TABLE IF NOT EXISTS temp_player_assists (
    player_id UUID,
    competition_id UUID,
    assists INT,
    PRIMARY KEY (player_id, competition_id)
  ) ON COMMIT DROP;
  TRUNCATE temp_player_assists;

  INSERT INTO temp_player_goals (player_id, competition_id, goals)
  SELECT me.player_id, f.competition_id, COUNT(*)::INT
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  JOIN public.players p ON p.id = me.player_id
  WHERE LOWER(me.type) IN ('goal', 'penalty')
    AND me.is_official IS TRUE
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
    AND UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
    AND f.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.canonical_permanent_results c
      WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
    )
  GROUP BY me.player_id, f.competition_id;

  INSERT INTO temp_player_assists (player_id, competition_id, assists)
  SELECT me.assist_player_id, f.competition_id, COUNT(*)::INT
  FROM public.match_events me
  JOIN public.fixtures f ON f.id = me.fixture_id
  JOIN public.players p ON p.id = me.assist_player_id
  WHERE me.assist_player_id IS NOT NULL
    AND LOWER(me.type) IN ('goal', 'penalty')
    AND me.is_official IS TRUE
    AND (me.is_cancelled IS NULL OR me.is_cancelled = false)
    AND UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
    AND f.deleted_at IS NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.canonical_permanent_results c
      WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
    )
  GROUP BY me.assist_player_id, f.competition_id;

  FOR v_rec IN (
    SELECT f.id, f.competition_id, f.home_team_id, f.away_team_id, f.score_home, f.score_away
    FROM public.fixtures f
    WHERE UPPER(COALESCE(f.status, '')) IN ('FT', 'FINISHED', 'AET', 'PEN', 'AWARDED')
      AND f.deleted_at IS NULL
      AND NOT EXISTS (
        SELECT 1 FROM public.canonical_permanent_results c
        WHERE c.match_uid = f.id AND UPPER(COALESCE(c.outcome, '')) = 'WALKOVER'
      )
  ) LOOP
    IF COALESCE(v_rec.score_away, 0) = 0 THEN
      v_home_gk := NULL;

      SELECT p.id INTO v_home_gk
      FROM public.match_lineups ml
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ml.starting_xi, '[]'::jsonb)) elem
      JOIN public.players p ON p.id::text = elem->>'id'
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.home_team_id
        AND UPPER(COALESCE(elem->>'position', p.position, '')) IN ('GK', 'GOALKEEPER')
      LIMIT 1;

      IF v_home_gk IS NULL THEN
        SELECT me.player_id INTO v_sub_gk
        FROM public.match_events me
        JOIN public.players p ON p.id = me.player_id
        WHERE me.fixture_id = v_rec.id AND me.team_id = v_rec.home_team_id
          AND me.is_official IS TRUE
          AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
        ORDER BY me.minute ASC LIMIT 1;
        IF v_sub_gk IS NOT NULL THEN
          v_home_gk := v_sub_gk;
        END IF;
      END IF;

      IF v_home_gk IS NOT NULL THEN
        INSERT INTO temp_player_cs (player_id, competition_id, clean_sheets)
        VALUES (v_home_gk, v_rec.competition_id, 1)
        ON CONFLICT (player_id, competition_id)
        DO UPDATE SET clean_sheets = temp_player_cs.clean_sheets + 1;
      END IF;
    END IF;

    IF COALESCE(v_rec.score_home, 0) = 0 THEN
      v_away_gk := NULL;

      SELECT p.id INTO v_away_gk
      FROM public.match_lineups ml
      CROSS JOIN LATERAL jsonb_array_elements(COALESCE(ml.starting_xi, '[]'::jsonb)) elem
      JOIN public.players p ON p.id::text = elem->>'id'
      WHERE ml.fixture_id = v_rec.id AND ml.team_id = v_rec.away_team_id
        AND UPPER(COALESCE(elem->>'position', p.position, '')) IN ('GK', 'GOALKEEPER')
      LIMIT 1;

      IF v_away_gk IS NULL THEN
        SELECT me.player_id INTO v_sub_gk
        FROM public.match_events me
        JOIN public.players p ON p.id = me.player_id
        WHERE me.fixture_id = v_rec.id AND me.team_id = v_rec.away_team_id
          AND me.is_official IS TRUE
          AND LOWER(me.type) = 'sub_in' AND p.position = 'GK' AND me.minute <= 60
        ORDER BY me.minute ASC LIMIT 1;
        IF v_sub_gk IS NOT NULL THEN
          v_away_gk := v_sub_gk;
        END IF;
      END IF;

      IF v_away_gk IS NOT NULL THEN
        INSERT INTO temp_player_cs (player_id, competition_id, clean_sheets)
        VALUES (v_away_gk, v_rec.competition_id, 1)
        ON CONFLICT (player_id, competition_id)
        DO UPDATE SET clean_sheets = temp_player_cs.clean_sheets + 1;
      END IF;
    END IF;
  END LOOP;

  UPDATE public.player_stats
  SET goals = 0, assists = 0, clean_sheets = 0, last_updated = NOW()
  WHERE player_id IS NOT NULL;

  INSERT INTO public.player_stats (player_id, competition_id, goals, assists, clean_sheets, last_updated)
  SELECT
    COALESCE(g.player_id, a.player_id, cs.player_id),
    COALESCE(g.competition_id, a.competition_id, cs.competition_id),
    COALESCE(g.goals, 0),
    COALESCE(a.assists, 0),
    COALESCE(cs.clean_sheets, 0),
    NOW()
  FROM temp_player_goals g
  FULL OUTER JOIN temp_player_assists a
    ON g.player_id = a.player_id AND g.competition_id = a.competition_id
  FULL OUTER JOIN temp_player_cs cs
    ON COALESCE(g.player_id, a.player_id) = cs.player_id
   AND COALESCE(g.competition_id, a.competition_id) = cs.competition_id
  ON CONFLICT (player_id, competition_id)
  DO UPDATE SET
    goals = EXCLUDED.goals,
    assists = EXCLUDED.assists,
    clean_sheets = EXCLUDED.clean_sheets,
    last_updated = NOW();
END;
$$;

-- 2. Purge the 7 synthetic referee test events from September 12 with player_id IS NULL
DELETE FROM public.match_events
WHERE id IN (
  '32006197-a6de-4791-b386-12651b5e6a49',
  '5ccbcac7-f149-435c-a431-b8cf2b4d788d',
  'bc317527-0e8d-4b1a-9a36-c6ed4ad1bbd1',
  '8a5c7510-3d07-4063-a180-392a75cd62f7',
  '4f72c8ee-9f58-41ad-a6ba-b451248d0640',
  'be037c7b-4a77-4beb-8b43-d8329814289f',
  '5c8f56c9-08fe-4458-b4ab-4f57fda3793c'
);

-- 3. Idempotently insert the authentic coach-submitted match events from September
INSERT INTO public.match_events (
  id, fixture_id, team_id, type, player_id, minute, assist_player_id, detail_text, is_official, created_at, created_by
) VALUES
  ('cb0b940e-1023-4375-a354-5f524877e8bb', 'c0000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000003', 'goal', '75f0ed48-f243-4396-9450-ca6eba489e13', 15, NULL, 'Solo Goal', TRUE, '2026-09-13T13:15:00+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('7e0140f5-106b-4ebb-af84-530b2d822989', 'c0000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000003', 'goal', '75f0ed48-f243-4396-9450-ca6eba489e13', 40, NULL, 'Solo Goal', TRUE, '2026-09-13T13:40:00+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('4620b6cd-e7f2-476f-9728-7b906ef20ed3', 'c0000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000003', 'goal', '75f0ed48-f243-4396-9450-ca6eba489e13', 65, NULL, 'Goal', TRUE, '2026-09-13T14:05:00+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('006cf7fb-0440-480d-9107-839c3a32254e', 'c0000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', 'goal', 'd4766bcb-52b4-4463-9131-9c4a71052ce6', 15, '0b2ddbed-5d7f-474f-9972-d32d064dc93f', NULL, TRUE, '2026-09-16T21:22:55.011264+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('a6fc91b1-35df-49c7-902f-589fe6e8c83d', 'c0000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', 'yellow', '945e5839-68f9-41b8-bce2-b277d138854c', 60, NULL, NULL, TRUE, '2026-09-16T21:22:55.011264+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('68021e49-f5e3-415e-ab56-4527d0360c2c', 'c0000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', 'goal', '0b2ddbed-5d7f-474f-9972-d32d064dc93f', 90, 'ecb2f3f1-3084-47cf-8b49-3fc1e490595b', NULL, TRUE, '2026-09-16T21:22:55.011264+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('401f5d5d-ac0d-429e-81d5-8d1a0b3563ce', 'c0000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', 'penalty', '0b2ddbed-5d7f-474f-9972-d32d064dc93f', 90, NULL, 'Penalty Kick', TRUE, '2026-09-16T21:22:55.011264+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('261a2219-1960-4297-bada-1616c75fd794', 'c0000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', 'goal', '0b2ddbed-5d7f-474f-9972-d32d064dc93f', 65, NULL, 'Free Kick', TRUE, '2026-09-16T21:22:55.011264+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('332a4f48-89fa-4288-8391-9df97a5f936d', 'c0000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000007', 'goal', '0b2ddbed-5d7f-474f-9972-d32d064dc93f', 40, '945e5839-68f9-41b8-bce2-b277d138854c', NULL, TRUE, '2026-09-16T21:22:55.011264+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('337e1115-7ff5-4db4-a1f6-ba3d27814beb', 'c0000000-0000-4000-8000-00000000000c', '20000000-0000-4000-8000-000000000007', 'goal', '945e5839-68f9-41b8-bce2-b277d138854c', 15, '0b2ddbed-5d7f-474f-9972-d32d064dc93f', NULL, TRUE, '2026-09-16T21:23:28.126002+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('a1444061-afdd-4bac-839e-4e28f15673a5', 'c0000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000007', 'goal', '8dc0e09e-fe42-4c90-aba0-d658d47e59dc', 15, '0b2ddbed-5d7f-474f-9972-d32d064dc93f', NULL, TRUE, '2026-09-16T21:23:55.374648+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('4db165f0-e97a-4b6b-805c-d8d81c5d8a42', 'f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'goal', 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', 40, NULL, NULL, TRUE, '2026-09-17T17:54:48.657684+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('f1cb7230-1eed-4154-9935-d04dc7aaf932', 'f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'goal', '3c957ae1-78d7-4ecd-acf5-f518b96b756d', 15, NULL, NULL, TRUE, '2026-09-17T17:54:48.657684+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('f40a466b-b0d8-45b7-af43-7e1e1d89cb40', 'f0000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'goal', 'fb772e3d-fb2f-4cee-9d17-66b021bfcd65', 65, NULL, NULL, TRUE, '2026-09-17T17:55:31.528077+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('c6c95cec-a787-4fd2-a2f2-107649ad6a0f', 'f0000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'goal', 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', 40, NULL, NULL, TRUE, '2026-09-17T17:55:31.528077+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('1e7798bd-855d-487b-828d-27fe48aa2ba0', 'f0000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000001', 'goal', 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', 15, NULL, NULL, TRUE, '2026-09-17T17:55:31.528077+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('a617b4f1-7764-4a9b-9e42-a8f21e902e8c', 'f0000000-0000-4000-8000-00000000000d', '10000000-0000-4000-8000-000000000001', 'goal', 'bab221e0-7bc4-4315-958e-eeee82365112', 15, NULL, NULL, TRUE, '2026-09-17T17:55:58.441881+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('a7387476-a4da-4681-bcd8-2ac5c7d6b231', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', 'c35950e5-2418-49f5-98ab-1c3904ad98ea', 90, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('2125ce20-b90c-4735-abd2-dbc58424daf6', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', 'fb772e3d-fb2f-4cee-9d17-66b021bfcd65', 90, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('28e0d445-a457-47f9-b791-d2eaf930fca4', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', '2c500128-9674-4c98-83df-c46734eedd4f', 90, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('0cba901c-b292-4fc7-9ed8-68b8958a1cd1', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', 'bab221e0-7bc4-4315-958e-eeee82365112', 90, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('99eff2b2-9913-495b-9e4e-26224f0ce3df', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', 'bab221e0-7bc4-4315-958e-eeee82365112', 90, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('eae47a92-9a58-4620-a72d-bc1617ea8b5d', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', '3c957ae1-78d7-4ecd-acf5-f518b96b756d', 65, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('4ce91001-01c0-4e21-a2a9-f9f54ff149a0', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', '3c957ae1-78d7-4ecd-acf5-f518b96b756d', 40, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('c86a584c-2a13-40cf-9002-f8c27afda04a', 'f0000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000001', 'goal', '3c957ae1-78d7-4ecd-acf5-f518b96b756d', 15, NULL, NULL, TRUE, '2026-09-17T17:57:30.347153+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('9782bf65-58da-466d-90d0-db834a7eea20', 'c0000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000001', 'goal', '66fc0bb0-3639-4f9d-8b67-fa3b5914fa70', 15, 'd973736c-6250-4c0f-96c1-06d552e50e06', NULL, TRUE, '2026-09-17T18:25:32.20853+00:00', '0a606677-174c-4206-ac80-5837273780f7'),
  ('b006ab82-1e3b-4111-b562-05e7de647395', 'c0000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000007', 'yellow', '001eab55-0423-4be8-96b9-2dc85c925c8e', 60, NULL, NULL, TRUE, '2026-09-17T21:32:27.807134+00:00', 'e65b5bff-0111-409c-836a-6012a32871a6'),
  ('501dad23-4530-4793-8d61-c435e4eff869', 'f0000000-0000-4000-8000-000000000016', '10000000-0000-4000-8000-000000000002', 'goal', '26bdb513-8c1d-43f4-9cdb-268d5b12001a', 15, NULL, NULL, TRUE, '2026-09-17T21:46:55.736416+00:00', 'fefd4e25-0893-4684-a0b6-1f42a7f92e1c'),
  ('c31b7992-b793-4688-8bb6-e67e8174ec6d', 'f0000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'goal', '5a79dc8d-7158-4d16-949c-3234d8db5be0', 15, NULL, 'Solo Goal', TRUE, '2026-09-17T21:47:16.184571+00:00', 'fefd4e25-0893-4684-a0b6-1f42a7f92e1c'),
  ('1095f9db-0906-4f4d-965a-7fb5de618477', 'c0000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000003', 'goal', '6664388d-7145-4471-bf07-4f6a469771da', 15, NULL, 'Free Kick', TRUE, '2026-09-17T22:32:58.831247+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('85c611bc-9534-496b-af62-2f77c327f1d5', 'c0000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003', 'goal', 'c4608d51-5480-4234-a47a-d15208090697', 40, NULL, 'Solo Goal', TRUE, '2026-09-17T22:34:43.347914+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('d2ce1246-82fb-458f-b16c-a64a58e5cdc3', 'c0000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000003', 'goal', '6664388d-7145-4471-bf07-4f6a469771da', 15, '85e57220-e8ed-4883-a8d2-d9419afe2052', NULL, TRUE, '2026-09-17T22:34:43.347914+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('83fd3666-b738-4450-8777-3580f1995ee4', 'c0000000-0000-4000-8000-00000000000c', '20000000-0000-4000-8000-000000000003', 'goal', '6664388d-7145-4471-bf07-4f6a469771da', 15, NULL, NULL, TRUE, '2026-09-17T22:35:54.085731+00:00', 'ce15bb37-06bf-4a85-b049-9d10307d05aa'),
  ('797dcae4-7baf-49f0-a0ec-d0816f3cad44', 'c0000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000001', 'goal', '4f647f6a-6a6f-454a-87b6-34351c456135', 15, 'd973736c-6250-4c0f-96c1-06d552e50e06', NULL, TRUE, '2026-09-18T09:33:34.73322+00:00', '0a606677-174c-4206-ac80-5837273780f7'),
  ('3a5629dc-c94b-4603-9bf4-edf19a702353', 'f0000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-00000000000a', 'goal', 'a8449690-775f-4841-bfa9-f500faa31ad1', 15, NULL, 'Solo Goal', TRUE, '2026-09-18T20:13:12.186578+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('a398cb9b-8eff-4570-bf7e-c71d9e35bfa1', 'f0000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-00000000000a', 'yellow', '1ae4a2f9-a7aa-4fa1-bd3d-52e378d4c16b', 60, NULL, NULL, TRUE, '2026-09-18T20:13:12.186578+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('6e6add3e-7b64-417b-a6b7-a85cef9f5849', 'f0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-00000000000a', 'goal', '650dc00f-6ad4-4730-a385-db1f99511300', 15, 'fa9a57d0-ba77-4fd1-a393-1e7c3be664b6', NULL, TRUE, '2026-09-18T20:15:30.822641+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('880246ac-e1fb-43d4-b4bb-e085e866ef4a', 'f0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-00000000000a', 'goal', '650dc00f-6ad4-4730-a385-db1f99511300', 40, '108957b8-c66d-4d26-a2e2-c20c8011e61f', NULL, TRUE, '2026-09-18T20:15:30.822641+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('ed8315e4-b455-4f2b-8533-61fac0f2aecd', 'f0000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-00000000000a', 'yellow', '8a8fac32-f50d-4850-8d00-77d6c42ecf7b', 60, NULL, NULL, TRUE, '2026-09-18T20:15:30.822641+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('a65b8ce0-28ab-46de-baba-16b84ce854dd', 'f0000000-0000-4000-8000-00000000000c', '10000000-0000-4000-8000-00000000000a', 'goal', '1d7e3978-bb0e-4d6f-a6fe-1f14bae3bd29', 15, 'fa9a57d0-ba77-4fd1-a393-1e7c3be664b6', NULL, TRUE, '2026-09-18T20:17:49.348061+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('e33b4fc1-a9f0-4759-bb93-abf1f111b615', 'f0000000-0000-4000-8000-00000000000c', '10000000-0000-4000-8000-00000000000a', 'goal', 'fa9a57d0-ba77-4fd1-a393-1e7c3be664b6', 65, NULL, 'Free Kick', TRUE, '2026-09-18T20:17:49.348061+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('3303dbb8-bd09-4a02-9490-22a57e7f1f45', 'f0000000-0000-4000-8000-00000000000c', '10000000-0000-4000-8000-00000000000a', 'penalty', '9802259b-e355-4e54-9589-fba859a3525c', 40, NULL, 'Penalty Kick', TRUE, '2026-09-18T20:17:49.348061+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('30b2a03d-cd82-4389-98ef-35ca8c099273', 'f0000000-0000-4000-8000-000000000017', '10000000-0000-4000-8000-00000000000a', 'goal', '650dc00f-6ad4-4730-a385-db1f99511300', 15, 'fa9a57d0-ba77-4fd1-a393-1e7c3be664b6', NULL, TRUE, '2026-09-18T20:18:52.340661+00:00', '954ee453-638c-48b4-b8f7-c9fbec92e7b5'),
  ('22d4e1cd-33f6-4f9a-8cbc-f2acd12e3b93', 'c0000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000009', 'goal', 'cb311828-9ba0-4096-86ed-7a1d39a8268f', 15, NULL, NULL, TRUE, '2026-09-19T10:58:09.272654+00:00', '10ac1229-a21c-4cd8-bb09-85d10deb664f'),
  ('410c282b-9d2a-4f38-9ef0-1f6d0c8b4f8e', 'f0000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000001', 'goal', 'bab221e0-7bc4-4315-958e-eeee82365112', 65, '21800e80-fc88-43a2-a17e-dfe5e72ef208', NULL, TRUE, '2026-09-19T19:33:03.885602+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('3cfa5d0d-e19c-4089-89ec-8af97990da1e', 'f0000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000001', 'goal', 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', 90, NULL, NULL, TRUE, '2026-09-19T19:33:03.885602+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('e389e967-d067-41b3-87ad-06e1a542eb37', 'f0000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000001', 'goal', 'bab221e0-7bc4-4315-958e-eeee82365112', 15, 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', NULL, TRUE, '2026-09-19T19:33:03.885602+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('7487eb4b-465f-4092-bee4-25011bc2e5d1', 'f0000000-0000-4000-8000-000000000019', '10000000-0000-4000-8000-000000000001', 'goal', '3548ec52-54d5-463f-b149-ae674a4a788f', 40, 'bab221e0-7bc4-4315-958e-eeee82365112', NULL, TRUE, '2026-09-19T19:33:03.885602+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('2c6df104-4fe3-406b-be8f-14a301bb412d', 'c0000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000009', 'goal', '3e4fd0dc-c474-42e0-90e3-e261692c4bd5', 15, 'cc617242-c0da-4599-abc4-7c36094aec12', NULL, TRUE, '2026-09-21T07:08:16.044539+00:00', '10ac1229-a21c-4cd8-bb09-85d10deb664f'),
  ('50e3de2d-8932-4291-a2b5-6c3914f9c8ba', 'c0000000-0000-4000-8000-00000000001e', '20000000-0000-4000-8000-000000000002', 'goal', '51f869de-fb90-4d11-8dbb-3b99ec49acb5', 15, NULL, 'Solo Goal', TRUE, '2026-09-26T17:46:31.324727+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('98a9b5d4-eca0-4ca9-aa41-ee5db67e8b38', 'c0000000-0000-4000-8000-00000000001e', '20000000-0000-4000-8000-000000000002', 'goal', '394158e4-6ba7-4f48-adfa-caea573c3388', 40, '51f869de-fb90-4d11-8dbb-3b99ec49acb5', NULL, TRUE, '2026-09-26T17:46:31.324727+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('26f9b4ea-429c-4937-b464-368787351202', 'c0000000-0000-4000-8000-00000000001e', '20000000-0000-4000-8000-000000000002', 'goal', '04cee1f2-86fc-41b2-a9c9-4c7a1d345483', 65, NULL, NULL, TRUE, '2026-09-26T17:46:31.324727+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('e34617a7-8cdc-4e00-bfb1-c4f8446b1bb3', 'f0000000-0000-4000-8000-00000000002a', '10000000-0000-4000-8000-000000000002', 'goal', '5a79dc8d-7158-4d16-949c-3234d8db5be0', 40, NULL, NULL, TRUE, '2026-09-27T11:47:20.674376+00:00', 'fefd4e25-0893-4684-a0b6-1f42a7f92e1c'),
  ('3d62ac09-ca05-45b2-b605-302f1b29f8df', 'f0000000-0000-4000-8000-00000000002a', '10000000-0000-4000-8000-000000000002', 'goal', '5a79dc8d-7158-4d16-949c-3234d8db5be0', 15, NULL, NULL, TRUE, '2026-09-27T11:47:20.674376+00:00', 'fefd4e25-0893-4684-a0b6-1f42a7f92e1c'),
  ('fc6574c6-63a3-4b24-af4c-68978e85e678', 'f0000000-0000-4000-8000-00000000001f', '10000000-0000-4000-8000-000000000001', 'goal', '2c500128-9674-4c98-83df-c46734eedd4f', 15, '0dd5b327-621e-47cc-8b1d-8688615a80cf', NULL, TRUE, '2026-09-27T16:47:42.135266+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('4af58b99-61db-4962-805f-674e2017d528', 'c0000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000002', 'goal', '394158e4-6ba7-4f48-adfa-caea573c3388', 40, NULL, 'Free Kick', TRUE, '2026-09-27T16:47:48.819154+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('03a59cd0-47c1-4d31-b821-41f163d8daea', 'c0000000-0000-4000-8000-000000000019', '20000000-0000-4000-8000-000000000002', 'goal', '30e5cf23-e60e-4c2b-96b6-e1f41b92e917', 15, 'b9328d11-f70d-462a-9d31-2a182d07a6d9', NULL, TRUE, '2026-09-27T16:47:48.819154+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('b252eabd-8c73-46e5-b45d-5d41559864d7', 'f0000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000001', 'goal', '172dae98-e7db-4685-b20c-4cb8f6ef4f22', 65, '0dd5b327-621e-47cc-8b1d-8688615a80cf', NULL, TRUE, '2026-09-27T16:50:34.405137+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('27b92c18-c6b6-47d1-8c57-5603fec41897', 'f0000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000001', 'goal', 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', 15, '508db552-2393-447e-8a50-3360307956e1', NULL, TRUE, '2026-09-27T16:50:34.405137+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('2868b392-81a2-427e-8c3c-4366e1f74f9f', 'f0000000-0000-4000-8000-000000000025', '10000000-0000-4000-8000-000000000001', 'goal', '0dd5b327-621e-47cc-8b1d-8688615a80cf', 40, 'c0419978-0475-4f5d-b604-f0127c134e65', NULL, TRUE, '2026-09-27T16:50:34.405137+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('2eb7df15-ae8d-4222-b12f-15b6e1235bff', 'c0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000002', 'goal', '4de1c863-75ed-4fab-829d-f74dcd4e71d8', 90, 'f195251b-b03d-4edd-adb0-7c41a3df0f74', NULL, TRUE, '2026-09-27T16:51:15.284728+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('abd178a8-070a-4003-af8a-5e78ea7e1705', 'c0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000002', 'goal', 'a9820406-c07c-45c5-bc92-4cc0271d9031', 90, '96c31616-4a06-47d1-9fbc-314a4d9547b6', NULL, TRUE, '2026-09-27T16:51:15.284728+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('c46e16bd-678e-4461-8492-349bc88313f6', 'c0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000002', 'goal', '5eb24bdf-1233-400e-af69-5823b99560ba', 65, NULL, 'Solo Goal', TRUE, '2026-09-27T16:51:15.284728+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('e052f290-5572-4fa3-bb9b-82b0866de4e7', 'c0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000002', 'goal', 'f195251b-b03d-4edd-adb0-7c41a3df0f74', 40, '4de1c863-75ed-4fab-829d-f74dcd4e71d8', NULL, TRUE, '2026-09-27T16:51:15.284728+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('42a7dee5-a492-4e72-bf4f-f94bfbf50d83', 'c0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000002', 'goal', 'f195251b-b03d-4edd-adb0-7c41a3df0f74', 15, '96c31616-4a06-47d1-9fbc-314a4d9547b6', NULL, TRUE, '2026-09-27T16:51:15.284728+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('9134b707-e5eb-4294-9302-4d12f84cf4c0', 'c0000000-0000-4000-8000-00000000000d', '20000000-0000-4000-8000-000000000002', 'goal', '96c31616-4a06-47d1-9fbc-314a4d9547b6', 90, NULL, 'Free Kick', TRUE, '2026-09-27T16:51:15.284728+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('1ffcb246-c721-4fab-98ec-cecf9917623f', 'f0000000-0000-4000-8000-00000000002b', '10000000-0000-4000-8000-000000000001', 'goal', '10867dc1-f272-4ef0-a8db-0b709e2011da', 65, '508db552-2393-447e-8a50-3360307956e1', NULL, TRUE, '2026-09-27T16:52:32.975555+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('144d66c9-051d-415b-a04d-76807d367720', 'f0000000-0000-4000-8000-00000000002b', '10000000-0000-4000-8000-000000000001', 'goal', '75eda454-cd99-4a6e-a550-218d58a90c3f', 40, 'd178d8df-4720-45f1-9bc9-67495f8af52a', NULL, TRUE, '2026-09-27T16:52:32.975555+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('d4e60d47-4572-4a78-a15f-61340747c3e0', 'f0000000-0000-4000-8000-00000000002b', '10000000-0000-4000-8000-000000000001', 'goal', 'c0419978-0475-4f5d-b604-f0127c134e65', 15, 'ccab2a7d-43e8-43e9-a81b-114faa0afb5a', NULL, TRUE, '2026-09-27T16:52:32.975555+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('0437bf53-9482-4297-a977-6e84e690d3b1', 'f0000000-0000-4000-8000-00000000002b', '10000000-0000-4000-8000-000000000001', 'goal', '0dd5b327-621e-47cc-8b1d-8688615a80cf', 90, '21800e80-fc88-43a2-a17e-dfe5e72ef208', NULL, TRUE, '2026-09-27T16:52:32.975555+00:00', '5143788c-c1a0-45fa-89ec-41a55ce78356'),
  ('0f031000-1377-4421-85b6-7ae8082dd319', 'c0000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'goal', '2de81e4b-4e0d-42aa-a4b1-f05c38f58dab', 40, 'f195251b-b03d-4edd-adb0-7c41a3df0f74', NULL, TRUE, '2026-09-27T16:53:30.524485+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60'),
  ('d6224539-20f0-4e22-afc5-8affea207baa', 'c0000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000002', 'goal', '2de81e4b-4e0d-42aa-a4b1-f05c38f58dab', 15, '5eb24bdf-1233-400e-af69-5823b99560ba', NULL, TRUE, '2026-09-27T16:53:30.524485+00:00', 'e1fc5efe-5cb4-41b5-8eef-95ff734a0e60')
ON CONFLICT (id) DO UPDATE SET
  created_by = EXCLUDED.created_by,
  is_official = EXCLUDED.is_official;

-- 4. Authoritatively recalculate player stats from all official authentic match events
SELECT public.recalculate_all_player_stats();
