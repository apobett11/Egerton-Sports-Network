import { test, expect } from '@playwright/test';
import { generateFixtures as invokeAlgorithm1, type LeagueInput } from '../../src/algorithms/algorithm1';
import { runAlgorithm2, type Algorithm2Input, type PlaydayInput, type FixtureInput } from '../../src/algorithms/algorithm2';
import { allocateMatches, type Algorithm3Signal } from '../../src/algorithms/algorithm3';
import { generateOfficiatingAssignments, type Algorithm45Input } from '../../src/algorithms/algorithm45';
import { createAlgorithmCommand } from '../../src/shared/algorithmProtocol';
import { handleEvent as handleAgent0Event, type Agent0Adapters, type PresidentEvent } from '../../src/services/agent0';

test.describe('Rigorous Scheduling Algorithm & Agent 0 Invariant Suite', () => {
  const EPL_LEAGUE_UID = '11111111-1111-4111-8111-000000000001';
  const CHAMP_LEAGUE_UID = '22222222-2222-4222-8222-000000000002';

  const eplTeams = Array.from({ length: 10 }, (_, i) => `e00000${String(i + 1).padStart(2, '0')}-0000-4000-8000-0000000000${String(i + 1).padStart(2, '0')}`);
  const champTeams = Array.from({ length: 13 }, (_, i) => `c00000${String(i + 1).padStart(2, '0')}-0000-4000-8000-0000000000${String(i + 1).padStart(2, '0')}`);

  const pitchIds = [
    '91111111-1111-4111-8111-111111111111',
    '92222222-2222-4222-8222-222222222222',
    '93333333-3333-4333-8333-333333333333',
  ];

  const referees = [
    { referee_id: 'r0000001-0000-4000-8000-000000000001', tier: 'EPL_Exclusive' as const },
    { referee_id: 'r0000002-0000-4000-8000-000000000002', tier: 'EPL_Exclusive' as const },
    { referee_id: 'r0000003-0000-4000-8000-000000000003', tier: 'Mixed' as const },
    { referee_id: 'r0000004-0000-4000-8000-000000000004', tier: 'Mixed' as const },
    { referee_id: 'r0000005-0000-4000-8000-000000000005', tier: 'Mixed' as const },
    { referee_id: 'r0000006-0000-4000-8000-000000000006', tier: 'Mixed' as const },
  ];

  test('Algorithm 1: Mathematical Fixture Generation & Round-Robin Invariants', () => {
    const cmd1 = createAlgorithmCommand<LeagueInput[]>({
      execution_id: crypto.randomUUID(),
      season_id: 'season-spec-1',
      algorithm: 'ALGORITHM_1',
      command: 'GENERATE_FIXTURES',
      payload_schema_version: '1.0',
      payload: [
        { league_id: EPL_LEAGUE_UID, teams: eplTeams },
        { league_id: CHAMP_LEAGUE_UID, teams: champTeams },
      ],
    });

    const res1 = invokeAlgorithm1(cmd1);
    expect(res1.status).toBe('success');
    expect(res1.verification.passed).toBe(true);

    const eplData = res1.payload.data[EPL_LEAGUE_UID];
    const champData = res1.payload.data[CHAMP_LEAGUE_UID];

    expect(eplData.leg_1.length).toBe(45);
    expect(eplData.leg_2.length).toBe(45);
    expect(champData.leg_1.length).toBe(78);
    expect(champData.leg_2.length).toBe(78);

    // Verify Berger Polygon round integrity: In each round chunk, every team plays at most once
    const eplMatchesPerRound = 5;
    for (let r = 0; r < 9; r++) {
      const roundMatches = eplData.leg_1.slice(r * eplMatchesPerRound, (r + 1) * eplMatchesPerRound);
      const roundTeams = new Set<string>();
      for (const m of roundMatches) {
        expect(roundTeams.has(m.home_id)).toBe(false);
        expect(roundTeams.has(m.away_id)).toBe(false);
        roundTeams.add(m.home_id);
        roundTeams.add(m.away_id);
      }
      expect(roundTeams.size).toBe(10);
    }
  });

  test('Algorithm 2: Matchday & Playday Scheduling & Date Advancement Invariants', () => {
    const cmd1 = createAlgorithmCommand<LeagueInput[]>({
      execution_id: crypto.randomUUID(),
      season_id: 'season-spec-2',
      algorithm: 'ALGORITHM_1',
      command: 'GENERATE_FIXTURES',
      payload_schema_version: '1.0',
      payload: [{ league_id: EPL_LEAGUE_UID, teams: eplTeams }],
    });
    const res1 = invokeAlgorithm1(cmd1);
    const eplData = res1.payload.data[EPL_LEAGUE_UID];

    const flatFixtures: FixtureInput[] = [];
    let seq = 1;
    for (const m of [...eplData.leg_1, ...eplData.leg_2]) {
      flatFixtures.push({
        fixture_id: crypto.randomUUID(),
        league_id: EPL_LEAGUE_UID,
        home_id: m.home_id,
        away_id: m.away_id,
        leg: seq <= 45 ? 1 : 2,
        match_sequence: seq++,
        matchday_number: null,
        playday: null,
        completed: false,
        historical: false,
      });
    }

    const playdaysInput: PlaydayInput[] = [
      { date: '2026-09-05', mode: 'PERMANENT', active: true },
      { date: '2026-09-06', mode: 'PERMANENT', active: true },
    ];

    const cmd2 = createAlgorithmCommand<Algorithm2Input>({
      execution_id: crypto.randomUUID(),
      season_id: 'season-spec-2',
      algorithm: 'ALGORITHM_2',
      command: 'SCHEDULE_MATCHDAYS',
      payload_schema_version: '1.0',
      payload: {
        fixtures: flatFixtures,
        signal: {
          signal_id: crypto.randomUUID(),
          change_type: 'INITIAL_SCHEDULING',
          affected_leagues: [EPL_LEAGUE_UID],
          matches_per_matchday: { [EPL_LEAGUE_UID]: 5 },
          playdays: playdaysInput,
        },
      },
    });

    const res2 = runAlgorithm2(cmd2);
    if (res2.status === 'failed') {
      console.error('ALGO 2 FAILED LOGS:', res2.verification.logs);
    }
    expect(res2.status).toBe('success');
    expect(res2.verification.passed).toBe(true);

    const scheduledEpl = res2.payload.final_schedule[EPL_LEAGUE_UID];
    expect(scheduledEpl.length).toBe(90);

    const matchdayPlaydayMap = new Map<number, string>();
    for (const item of scheduledEpl) {
      if (!matchdayPlaydayMap.has(item.matchday_number)) {
        matchdayPlaydayMap.set(item.matchday_number, item.playday);
      }
    }

    expect(matchdayPlaydayMap.get(1)).toBe('2026-09-05');
    expect(matchdayPlaydayMap.get(2)).toBe('2026-09-06');
    expect(matchdayPlaydayMap.get(3)).toBe('2026-09-12');
    expect(matchdayPlaydayMap.get(4)).toBe('2026-09-13');
    expect(matchdayPlaydayMap.get(5)).toBe('2026-09-19');

    let previousDate = '2000-01-01';
    for (let md = 1; md <= 18; md++) {
      const d = matchdayPlaydayMap.get(md)!;
      expect(d >= previousDate).toBe(true);
      previousDate = d;
    }
  });

  test('Algorithm 3: Horizontal Pitch Allocation & Non-Collision', () => {
    const sampleMatches = Array.from({ length: 5 }, (_, i) => ({
      match_id: crypto.randomUUID(),
      league_id: EPL_LEAGUE_UID,
      home_id: eplTeams[i],
      away_id: eplTeams[9 - i],
      matchday_number: 1,
      status: 'scheduled' as const,
    }));

    const cmd3 = createAlgorithmCommand<Algorithm3Signal>({
      execution_id: crypto.randomUUID(),
      season_id: 'season-spec-3',
      algorithm: 'ALGORITHM_3',
      command: 'ALLOCATE_PITCH_SLOTS',
      payload_schema_version: '1.0',
      payload: {
        run_id: crypto.randomUUID(),
        change_type: 'INITIAL_ALLOCATION',
        matchdays: [
          {
            matchday_number: 1,
            play_date: '2026-09-05',
            playable: true,
            matches: sampleMatches,
          },
        ],
        pitches: pitchIds.map((id) => ({ pitch_id: id, state: 'available' as const })),
        time_configuration: [
          {
            league_id: EPL_LEAGUE_UID,
            slots: [
              { slot_number: 1, start_time: '08:30', end_time: '10:30' },
              { slot_number: 2, start_time: '10:45', end_time: '12:45' },
              { slot_number: 3, start_time: '13:00', end_time: '15:00' },
            ],
          },
        ],
      },
    });

    const res3 = allocateMatches(cmd3);
    expect(res3.status).toBe('success');
    expect(res3.verification.passed).toBe(true);

    const allocations = res3.payload.database_operations.allocations;
    expect(allocations.length).toBe(5);

    // Verify 3 matches kick off in parallel at 08:30 across 3 distinct pitches
    const slot1Allocations = allocations.filter((a) => a.start_time === '08:30');
    expect(slot1Allocations.length).toBe(3);
    const slot1Pitches = new Set(slot1Allocations.map((a) => a.pitch_id));
    expect(slot1Pitches.size).toBe(3);

    // Verify remaining 2 matches use Slot 2
    const slot2Allocations = allocations.filter((a) => a.start_time === '10:45');
    expect(slot2Allocations.length).toBe(2);

    // Verify zero pitch collision
    const occupiedIntervals = new Set<string>();
    for (const a of allocations) {
      const key = `${a.play_date}|${a.pitch_id}|${a.start_time}-${a.end_time}`;
      expect(occupiedIntervals.has(key)).toBe(false);
      occupiedIntervals.add(key);
    }
  });

  test('Algorithm 4 & 5: Officiating & Linesman Playing Collision Check', () => {
    const sampleTimeSlottedMatches = [
      {
        match_id: crypto.randomUUID(),
        league_type: 'EPL' as const,
        home_team_id: eplTeams[0],
        away_team_id: eplTeams[1],
        start_time: '2026-09-05T08:30:00.000Z',
        end_time: '2026-09-05T10:30:00.000Z',
      },
      {
        match_id: crypto.randomUUID(),
        league_type: 'EPL' as const,
        home_team_id: eplTeams[2],
        away_team_id: eplTeams[3],
        start_time: '2026-09-05T08:30:00.000Z',
        end_time: '2026-09-05T10:30:00.000Z',
      },
    ];

    const cmd45 = createAlgorithmCommand<Algorithm45Input>({
      execution_id: crypto.randomUUID(),
      season_id: 'season-spec-45',
      algorithm: 'ALGORITHM_4_5',
      command: 'ALLOCATE_OFFICIATING',
      payload_schema_version: '1.0',
      payload: {
        matches: sampleTimeSlottedMatches,
        referees,
        teams: eplTeams.map((id) => ({ team_id: id })),
      },
    });

    const res45 = generateOfficiatingAssignments(cmd45);
    expect(res45.status).toBe('success');
    expect(res45.verification.passed).toBe(true);

    for (const assign of res45.payload.assignments) {
      const match = sampleTimeSlottedMatches.find((m) => m.match_id === assign.match_id)!;
      const matchStart = Date.parse(match.start_time);
      const matchEnd = Date.parse(match.end_time);

      for (const otherMatch of sampleTimeSlottedMatches) {
        const otherStart = Date.parse(otherMatch.start_time);
        const otherEnd = Date.parse(otherMatch.end_time);

        const overlap = matchStart < otherEnd && otherStart < matchEnd;
        if (overlap) {
          expect(assign.linesman_team_a_id !== otherMatch.home_team_id).toBe(true);
          expect(assign.linesman_team_a_id !== otherMatch.away_team_id).toBe(true);
          expect(assign.linesman_team_b_id !== otherMatch.home_team_id).toBe(true);
          expect(assign.linesman_team_b_id !== otherMatch.away_team_id).toBe(true);
        }
      }
    }
  });

  test('Agent 0 End-to-End Orchestration & Database Integrity', async () => {
    const inMemoryDB = {
      fixtures: [] as any[],
      matchdays: [] as any[],
      matchAssignments: [] as any[],
      playdays: [
        { date: '2026-09-05', mode: 'PERMANENT' as const, active: true },
        { date: '2026-09-06', mode: 'PERMANENT' as const, active: true },
      ],
      capacity: { EPL: 5, Championship: 6 },
      pitches: pitchIds.map((id) => ({ pitch_id: id, state: 'available' as const })),
      referees,
      teams: [
        ...eplTeams.map((id) => ({ team_id: id, league_type: 'EPL' as const })),
        ...champTeams.map((id) => ({ team_id: id, league_type: 'CHAMPIONSHIP' as const })),
      ],
    };

    const testAdapters: Agent0Adapters = {
      async fetchCurrentState(_sid: string) {
        return inMemoryDB;
      },
      async persistAtomically(args) {
        if (args.stage === 'ALGORITHM_1' && args.algorithm1Result) {
          const flat: any[] = [];
          let seqNo = 1;
          for (const [leagueId, d] of Object.entries(args.algorithm1Result.payload.data)) {
            for (const m of [...d.leg_1, ...d.leg_2]) {
              flat.push({
                fixture_id: crypto.randomUUID(),
                league_id: leagueId,
                home_id: m.home_id,
                away_id: m.away_id,
                leg: m.match_sequence <= d.leg_1.length ? 1 : 2,
                match_sequence: seqNo++,
                matchday_number: null,
                playday: null,
                completed: false,
                historical: false,
              });
            }
          }
          inMemoryDB.fixtures = flat;
        }

        if (args.stage === 'ALGORITHM_2' && args.algorithm2Result) {
          const schedule = args.algorithm2Result.payload.final_schedule;
          const mdMap = new Map<number, { playDate: string; matchIds: string[] }>();
          for (const [_lid, list] of Object.entries(schedule)) {
            for (const item of list) {
              const f = inMemoryDB.fixtures.find((fix) => fix.fixture_id === item.fixture_id);
              if (f) {
                f.matchday_number = item.matchday_number;
                f.playday = item.playday;
              }
              if (!mdMap.has(item.matchday_number)) {
                mdMap.set(item.matchday_number, { playDate: item.playday, matchIds: [] });
              }
              mdMap.get(item.matchday_number)!.matchIds.push(item.fixture_id);
            }
          }
          inMemoryDB.matchdays = Array.from(mdMap.entries()).map(([mdNum, info]) => ({
            matchday_id: `md-${mdNum}`,
            matchday_number: mdNum,
            play_date: info.playDate,
            playable: true,
            match_ids: info.matchIds,
          }));
        }

        if (args.stage === 'ALGORITHM_3' && args.algorithm3Result) {
          const allocations = args.algorithm3Result.payload.database_operations.allocations;
          inMemoryDB.matchAssignments = allocations.map((a) => ({
            match_id: a.match_id,
            matchday_id: `md-${a.matchday_number}`,
            play_date: a.play_date,
            pitch_id: a.pitch_id,
            slot_id: `slot-${a.slot_number}`,
            start_time: a.start_time,
            end_time: a.end_time,
            allocation_status: 'ALLOCATED',
          }));
        }

        if (args.stage === 'ALGORITHM_4_5' && args.algorithm45Result) {
          for (const assign of args.algorithm45Result.payload.assignments) {
            const f = inMemoryDB.fixtures.find((fix) => fix.fixture_id === assign.match_id);
            if (f) {
              f.referee_id = assign.center_referee_id;
              f.linesman_team_a_id = assign.linesman_team_a_id;
              f.linesman_team_b_id = assign.linesman_team_b_id;
            }
          }
        }
      },
      async readBackAndVerify(_args) {
        expect(inMemoryDB.fixtures.length).toBe(246);
        expect(inMemoryDB.matchAssignments.length).toBe(246);
      },
      async getLeagueConfigs(_sid) {
        return [
          { league_id: EPL_LEAGUE_UID, teams: eplTeams },
          { league_id: CHAMP_LEAGUE_UID, teams: champTeams },
        ];
      },
    };

    const beginEvent: PresidentEvent = {
      type: 'BEGIN_SEASON',
      seasonId: 'season-spec-e2e',
      seasonStartDate: '2026-09-05',
    };

    const agent0Result = await handleAgent0Event(beginEvent, testAdapters);
    if (!agent0Result.success) {
      console.error('AGENT 0 FAILED RESULT:', agent0Result);
    }
    expect(agent0Result.success).toBe(true);
    expect(agent0Result.stage).toBe('COMPLETED');
    expect(inMemoryDB.fixtures.length).toBe(246);
    expect(inMemoryDB.matchAssignments.length).toBe(246);
  });
});
