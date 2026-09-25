-- Migration 65: Shift Championship Fixtures by One Matchday (MD 6 to 18)
-- Matchday 6 fixtures were not played on 2026-09-20.
-- Shifting all Championship fixtures from MD 6 onwards by exactly one matchday placing (+1).
-- MD 6 -> 2026-09-26 (Saturday - tomorrow)
-- MD 7 -> 2026-09-27 (Sunday)
-- ...
-- MD 18 -> 2026-11-07 (Saturday)
-- 2026-09-20 remains blank in Championship.
-- EPL fixtures, matchday numbers, count, and structure are completely preserved.
-- Updates are executed in reverse matchday order to respect uq_pitch_date_slot.

-- Matchday 18 -> 2026-11-07 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-11-07', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000005a';
UPDATE public.fixtures SET scheduled_time = '2026-11-07T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000005a';
UPDATE public.matchday_schedules SET play_date = '2026-11-07', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000058';
UPDATE public.fixtures SET scheduled_time = '2026-11-07T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000058';
UPDATE public.matchday_schedules SET play_date = '2026-11-07', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000059';
UPDATE public.fixtures SET scheduled_time = '2026-11-07T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000059';
UPDATE public.matchday_schedules SET play_date = '2026-11-07', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000056';
UPDATE public.fixtures SET scheduled_time = '2026-11-07T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000056';
UPDATE public.matchday_schedules SET play_date = '2026-11-07', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000057';
UPDATE public.fixtures SET scheduled_time = '2026-11-07T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000057';

-- Matchday 17 -> 2026-11-01 (SUNDAY)
UPDATE public.matchday_schedules SET play_date = '2026-11-01', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000054';
UPDATE public.fixtures SET scheduled_time = '2026-11-01T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000054';
UPDATE public.matchday_schedules SET play_date = '2026-11-01', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000055';
UPDATE public.fixtures SET scheduled_time = '2026-11-01T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000055';
UPDATE public.matchday_schedules SET play_date = '2026-11-01', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000052';
UPDATE public.fixtures SET scheduled_time = '2026-11-01T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000052';
UPDATE public.matchday_schedules SET play_date = '2026-11-01', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000051';
UPDATE public.fixtures SET scheduled_time = '2026-11-01T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000051';
UPDATE public.matchday_schedules SET play_date = '2026-11-01', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000053';
UPDATE public.fixtures SET scheduled_time = '2026-11-01T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000053';

-- Matchday 16 -> 2026-10-31 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-31', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000004d';
UPDATE public.fixtures SET scheduled_time = '2026-10-31T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000004d';
UPDATE public.matchday_schedules SET play_date = '2026-10-31', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000050';
UPDATE public.fixtures SET scheduled_time = '2026-10-31T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000050';
UPDATE public.matchday_schedules SET play_date = '2026-10-31', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000004f';
UPDATE public.fixtures SET scheduled_time = '2026-10-31T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000004f';
UPDATE public.matchday_schedules SET play_date = '2026-10-31', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000004c';
UPDATE public.fixtures SET scheduled_time = '2026-10-31T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000004c';
UPDATE public.matchday_schedules SET play_date = '2026-10-31', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000004e';
UPDATE public.fixtures SET scheduled_time = '2026-10-31T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000004e';

-- Matchday 15 -> 2026-10-25 (SUNDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-25', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000004b';
UPDATE public.fixtures SET scheduled_time = '2026-10-25T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000004b';
UPDATE public.matchday_schedules SET play_date = '2026-10-25', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000048';
UPDATE public.fixtures SET scheduled_time = '2026-10-25T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000048';
UPDATE public.matchday_schedules SET play_date = '2026-10-25', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000004a';
UPDATE public.fixtures SET scheduled_time = '2026-10-25T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000004a';
UPDATE public.matchday_schedules SET play_date = '2026-10-25', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000049';
UPDATE public.fixtures SET scheduled_time = '2026-10-25T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000049';
UPDATE public.matchday_schedules SET play_date = '2026-10-25', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000047';
UPDATE public.fixtures SET scheduled_time = '2026-10-25T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000047';

-- Matchday 14 -> 2026-10-24 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-24', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000042';
UPDATE public.fixtures SET scheduled_time = '2026-10-24T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000042';
UPDATE public.matchday_schedules SET play_date = '2026-10-24', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000046';
UPDATE public.fixtures SET scheduled_time = '2026-10-24T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000046';
UPDATE public.matchday_schedules SET play_date = '2026-10-24', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000044';
UPDATE public.fixtures SET scheduled_time = '2026-10-24T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000044';
UPDATE public.matchday_schedules SET play_date = '2026-10-24', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000043';
UPDATE public.fixtures SET scheduled_time = '2026-10-24T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000043';
UPDATE public.matchday_schedules SET play_date = '2026-10-24', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000045';
UPDATE public.fixtures SET scheduled_time = '2026-10-24T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000045';

-- Matchday 13 -> 2026-10-18 (SUNDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-18', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000003d';
UPDATE public.fixtures SET scheduled_time = '2026-10-18T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000003d';
UPDATE public.matchday_schedules SET play_date = '2026-10-18', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000041';
UPDATE public.fixtures SET scheduled_time = '2026-10-18T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000041';
UPDATE public.matchday_schedules SET play_date = '2026-10-18', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000003f';
UPDATE public.fixtures SET scheduled_time = '2026-10-18T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000003f';
UPDATE public.matchday_schedules SET play_date = '2026-10-18', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000040';
UPDATE public.fixtures SET scheduled_time = '2026-10-18T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000040';
UPDATE public.matchday_schedules SET play_date = '2026-10-18', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000003e';
UPDATE public.fixtures SET scheduled_time = '2026-10-18T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000003e';

-- Matchday 12 -> 2026-10-17 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-17', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000039';
UPDATE public.fixtures SET scheduled_time = '2026-10-17T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000039';
UPDATE public.matchday_schedules SET play_date = '2026-10-17', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000003a';
UPDATE public.fixtures SET scheduled_time = '2026-10-17T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000003a';
UPDATE public.matchday_schedules SET play_date = '2026-10-17', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000003c';
UPDATE public.fixtures SET scheduled_time = '2026-10-17T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000003c';
UPDATE public.matchday_schedules SET play_date = '2026-10-17', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000038';
UPDATE public.fixtures SET scheduled_time = '2026-10-17T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000038';
UPDATE public.matchday_schedules SET play_date = '2026-10-17', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000003b';
UPDATE public.fixtures SET scheduled_time = '2026-10-17T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000003b';

-- Matchday 11 -> 2026-10-11 (SUNDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-11', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000037';
UPDATE public.fixtures SET scheduled_time = '2026-10-11T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000037';
UPDATE public.matchday_schedules SET play_date = '2026-10-11', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000034';
UPDATE public.fixtures SET scheduled_time = '2026-10-11T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000034';
UPDATE public.matchday_schedules SET play_date = '2026-10-11', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000035';
UPDATE public.fixtures SET scheduled_time = '2026-10-11T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000035';
UPDATE public.matchday_schedules SET play_date = '2026-10-11', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000036';
UPDATE public.fixtures SET scheduled_time = '2026-10-11T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000036';
UPDATE public.matchday_schedules SET play_date = '2026-10-11', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000033';
UPDATE public.fixtures SET scheduled_time = '2026-10-11T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000033';

-- Matchday 10 -> 2026-10-10 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-10', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000002f';
UPDATE public.fixtures SET scheduled_time = '2026-10-10T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000002f';
UPDATE public.matchday_schedules SET play_date = '2026-10-10', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000031';
UPDATE public.fixtures SET scheduled_time = '2026-10-10T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000031';
UPDATE public.matchday_schedules SET play_date = '2026-10-10', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000032';
UPDATE public.fixtures SET scheduled_time = '2026-10-10T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000032';
UPDATE public.matchday_schedules SET play_date = '2026-10-10', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000002e';
UPDATE public.fixtures SET scheduled_time = '2026-10-10T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000002e';
UPDATE public.matchday_schedules SET play_date = '2026-10-10', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000030';
UPDATE public.fixtures SET scheduled_time = '2026-10-10T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000030';

-- Matchday 9 -> 2026-10-04 (SUNDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-04', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000002a';
UPDATE public.fixtures SET scheduled_time = '2026-10-04T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000002a';
UPDATE public.matchday_schedules SET play_date = '2026-10-04', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000029';
UPDATE public.fixtures SET scheduled_time = '2026-10-04T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000029';
UPDATE public.matchday_schedules SET play_date = '2026-10-04', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000002c';
UPDATE public.fixtures SET scheduled_time = '2026-10-04T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000002c';
UPDATE public.matchday_schedules SET play_date = '2026-10-04', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000002b';
UPDATE public.fixtures SET scheduled_time = '2026-10-04T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000002b';
UPDATE public.matchday_schedules SET play_date = '2026-10-04', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000002d';
UPDATE public.fixtures SET scheduled_time = '2026-10-04T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000002d';

-- Matchday 8 -> 2026-10-03 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-10-03', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000024';
UPDATE public.fixtures SET scheduled_time = '2026-10-03T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000024';
UPDATE public.matchday_schedules SET play_date = '2026-10-03', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000026';
UPDATE public.fixtures SET scheduled_time = '2026-10-03T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000026';
UPDATE public.matchday_schedules SET play_date = '2026-10-03', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000028';
UPDATE public.fixtures SET scheduled_time = '2026-10-03T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000028';
UPDATE public.matchday_schedules SET play_date = '2026-10-03', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000025';
UPDATE public.fixtures SET scheduled_time = '2026-10-03T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000025';
UPDATE public.matchday_schedules SET play_date = '2026-10-03', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000027';
UPDATE public.fixtures SET scheduled_time = '2026-10-03T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000027';

-- Matchday 7 -> 2026-09-27 (SUNDAY)
UPDATE public.matchday_schedules SET play_date = '2026-09-27', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000022';
UPDATE public.fixtures SET scheduled_time = '2026-09-27T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000022';
UPDATE public.matchday_schedules SET play_date = '2026-09-27', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000023';
UPDATE public.fixtures SET scheduled_time = '2026-09-27T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000023';
UPDATE public.matchday_schedules SET play_date = '2026-09-27', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001f';
UPDATE public.fixtures SET scheduled_time = '2026-09-27T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000001f';
UPDATE public.matchday_schedules SET play_date = '2026-09-27', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000021';
UPDATE public.fixtures SET scheduled_time = '2026-09-27T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000021';
UPDATE public.matchday_schedules SET play_date = '2026-09-27', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-000000000020';
UPDATE public.fixtures SET scheduled_time = '2026-09-27T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-000000000020';

-- Matchday 6 -> 2026-09-26 (SATURDAY)
UPDATE public.matchday_schedules SET play_date = '2026-09-26', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001a';
UPDATE public.fixtures SET scheduled_time = '2026-09-26T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000001a';
UPDATE public.matchday_schedules SET play_date = '2026-09-26', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001e';
UPDATE public.fixtures SET scheduled_time = '2026-09-26T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000001e';
UPDATE public.matchday_schedules SET play_date = '2026-09-26', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001c';
UPDATE public.fixtures SET scheduled_time = '2026-09-26T13:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000001c';
UPDATE public.matchday_schedules SET play_date = '2026-09-26', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001d';
UPDATE public.fixtures SET scheduled_time = '2026-09-26T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000001d';
UPDATE public.matchday_schedules SET play_date = '2026-09-26', updated_at = NOW() WHERE fixture_id = 'c0000000-0000-4000-8000-00000000001b';
UPDATE public.fixtures SET scheduled_time = '2026-09-26T15:00:00.000Z', updated_at = NOW() WHERE id = 'c0000000-0000-4000-8000-00000000001b';

