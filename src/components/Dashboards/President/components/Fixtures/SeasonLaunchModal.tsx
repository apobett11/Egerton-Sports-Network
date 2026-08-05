import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, Trophy, Zap, Plus, Trash2, Edit2, AlertTriangle, CheckCircle2, Shield, User, Clock, MapPin, ArrowRight } from 'lucide-react';
import { ApiService } from '../../../../../services/api';
import type { TeamItem, RefereeItem } from '../../types';

export interface SeasonLaunchModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark: boolean;
  teams: TeamItem[];
  referees: RefereeItem[];
  showToast: (msg: string) => void;
  onFixturesConfirmed?: () => void;
}

export interface ManualFixtureRow {
  id: string;
  competitionId: string;
  competitionName: string;
  homeTeamId: string;
  awayTeamId: string;
  pitch: string;
  refereeId: string;
  kickoffDate: string;
  kickoffTime: string;
  errors: string[];
}

export interface PreparedFixture {
  id: string;
  competitionId: string;
  competitionName: string;
  matchday: number;
  homeTeamId: string;
  homeTeamName: string;
  awayTeamId: string;
  awayTeamName: string;
  pitch: string;
  refereeId: string;
  refereeName: string;
  scheduledTime: string; // ISO string or YYYY-MM-DDTHH:mm
  status: string;
}

const DEFAULT_PITCHES = [
  'Egerton Main Stadium',
  'Pavilion Pitch A',
  'Pavilion Pitch B',
  'Tatton Field'
];

export const SeasonLaunchModal: React.FC<SeasonLaunchModalProps> = ({
  isOpen,
  onClose,
  isDark,
  teams,
  referees,
  showToast,
  onFixturesConfirmed,
}) => {
  const [modalStep, setModalStep] = useState<'CHOICE' | 'MANUAL_BUILDER' | 'GENERATOR_SETTINGS' | 'REVIEW'>('CHOICE');
  const [showConfirmationDialog, setShowConfirmationDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Competitions state loaded from DB
  const [competitions, setCompetitions] = useState<Array<{ id: string; name: string; slug: string }>>([
    { id: '11111111-1111-1111-1111-111111111111', name: 'Egerton Premier League', slug: 'egerton-premier-league' },
    { id: '22222222-2222-2222-2222-222222222222', name: 'Egerton Championship', slug: 'egerton-championship' }
  ]);

  // DB Teams & Referees
  const [dbTeams, setDbTeams] = useState<any[]>([]);
  const [dbReferees, setDbReferees] = useState<any[]>([]);

  // Manual Builder State
  const [manualRows, setManualRows] = useState<ManualFixtureRow[]>([]);

  // Generator Settings State
  const [genCompetition, setGenCompetition] = useState<string>('both'); // 'epl' | 'championship' | 'both'
  const [genRoundType, setGenRoundType] = useState<'single' | 'double'>('single');
  const [genStartDate, setGenStartDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [selectedDays, setSelectedDays] = useState<string[]>(['Saturday', 'Sunday']);
  const [maxMatchesPerDay, setMaxMatchesPerDay] = useState<number>(3);
  const [selectedPitches, setSelectedPitches] = useState<string[]>(DEFAULT_PITCHES);
  const [selectedReferees, setSelectedReferees] = useState<string[]>([]);

  // Review State
  const [preparedFixtures, setPreparedFixtures] = useState<PreparedFixture[]>([]);
  const [editingFixtureId, setEditingFixtureId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ date: string; time: string; pitch: string; refereeId: string }>({
    date: '',
    time: '14:00',
    pitch: '',
    refereeId: ''
  });
  const [editError, setEditError] = useState<string | null>(null);

  // Load competitions, teams, referees from DB when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const loadData = async () => {
      // 1. Competitions
      const compRes = await ApiService.getLeagues();
      if (compRes.success && compRes.data && compRes.data.length > 0) {
        setCompetitions(compRes.data.map((c: any) => ({
          id: c.id,
          name: c.name,
          slug: c.slug
        })));
      }

      // 2. Teams
      const teamRes = await ApiService.getTeams();
      if (teamRes.success && teamRes.data && teamRes.data.length > 0) {
        setDbTeams(teamRes.data);
      } else {
        setDbTeams(teams.map((t) => ({
          id: t.id,
          name: t.name,
          competition_id: t.league === 'championship' ? '22222222-2222-2222-2222-222222222222' : '11111111-1111-1111-1111-111111111111',
          division: t.league
        })));
      }

      // 3. Referees
      const refRes = await ApiService.getReferees();
      let activeRefs: any[] = [];
      if (refRes.success && refRes.data && refRes.data.length > 0) {
        activeRefs = refRes.data.filter((r: any) => r.status === 'Active');
        setDbReferees(activeRefs);
      } else {
        activeRefs = referees.map((r) => ({ id: r.id, name: r.name }));
        setDbReferees(activeRefs);
      }
      setSelectedReferees(activeRefs.map((r: any) => r.id));
    };

    loadData();
    setModalStep('CHOICE');
    setPreparedFixtures([]);
    setShowConfirmationDialog(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const eplComp = competitions.find((c) => c.name.toLowerCase().includes('premier')) || competitions[0];
  const champComp = competitions.find((c) => c.name.toLowerCase().includes('championship')) || competitions[1] || competitions[0];

  // Helper to resolve team lists per competition
  const eplTeams = dbTeams.filter((t) => t.competition_id === eplComp.id || t.division === 'premier' || !t.division || !t.competition_id);
  const champTeams = dbTeams.filter((t) => t.competition_id === champComp.id || t.division === 'championship');

  // --- MANUAL BUILDER LOGIC ---
  const handleStartManualBuilder = () => {
    const defaultComp = eplComp;
    const initialRow: ManualFixtureRow = {
      id: `m-row-${Date.now()}-1`,
      competitionId: defaultComp.id,
      competitionName: defaultComp.name,
      homeTeamId: '',
      awayTeamId: '',
      pitch: DEFAULT_PITCHES[0],
      refereeId: dbReferees[0]?.id || '',
      kickoffDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      kickoffTime: '14:00',
      errors: []
    };
    setManualRows([initialRow]);
    setModalStep('MANUAL_BUILDER');
  };

  const addManualRow = () => {
    const defaultComp = eplComp;
    const newRow: ManualFixtureRow = {
      id: `m-row-${Date.now()}-${manualRows.length + 1}`,
      competitionId: defaultComp.id,
      competitionName: defaultComp.name,
      homeTeamId: '',
      awayTeamId: '',
      pitch: DEFAULT_PITCHES[0],
      refereeId: dbReferees[0]?.id || '',
      kickoffDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      kickoffTime: '14:00',
      errors: []
    };
    setManualRows([...manualRows, newRow]);
  };

  const removeManualRow = (id: string) => {
    if (manualRows.length === 1) {
      showToast('⚠️ Manual builder must contain at least one fixture row.');
      return;
    }
    setManualRows(manualRows.filter((r) => r.id !== id));
  };

  const updateManualRow = (id: string, updates: Partial<ManualFixtureRow>) => {
    const updated = manualRows.map((row) => {
      if (row.id !== id) return row;
      const next = { ...row, ...updates };

      if (updates.competitionId) {
        const found = competitions.find((c) => c.id === updates.competitionId);
        if (found) next.competitionName = found.name;
        next.homeTeamId = '';
        next.awayTeamId = '';
      }
      return next;
    });

    // Validate rows
    const validated = validateManualRows(updated);
    setManualRows(validated);
  };

  const validateManualRows = (rows: ManualFixtureRow[]): ManualFixtureRow[] => {
    return rows.map((row, idx) => {
      const errs: string[] = [];

      if (!row.homeTeamId || !row.awayTeamId) {
        errs.push('Select both Home and Away teams.');
      } else if (row.homeTeamId === row.awayTeamId) {
        errs.push('Home team and Away team cannot be identical.');
      }

      if (!row.kickoffDate) {
        errs.push('Valid kickoff date required.');
      }

      // Check conflicts against other rows
      if (row.homeTeamId && row.awayTeamId && row.kickoffDate && row.kickoffTime) {
        const slotKey = `${row.kickoffDate}_${row.kickoffTime}`;

        rows.forEach((other, oIdx) => {
          if (idx === oIdx) return;
          const otherSlotKey = `${other.kickoffDate}_${other.kickoffTime}`;

          if (slotKey === otherSlotKey) {
            if (row.pitch && row.pitch === other.pitch) {
              errs.push(`Pitch "${row.pitch}" is already occupied at ${row.kickoffTime}.`);
            }
            if (row.refereeId && row.refereeId === other.refereeId) {
              errs.push('Selected referee is officiating another match at this time.');
            }
            if (
              (row.homeTeamId === other.homeTeamId || row.homeTeamId === other.awayTeamId ||
               row.awayTeamId === other.homeTeamId || row.awayTeamId === other.awayTeamId)
            ) {
              errs.push('Team cannot play twice on the same day/time.');
            }
          }

          if (row.homeTeamId === other.homeTeamId && row.awayTeamId === other.awayTeamId && row.competitionId === other.competitionId) {
            errs.push('Duplicate fixture entry in table.');
          }
        });
      }

      return { ...row, errors: errs };
    });
  };

  const handleManualReview = () => {
    const validated = validateManualRows(manualRows);
    setManualRows(validated);

    const hasErrors = validated.some((r) => r.errors.length > 0 || !r.homeTeamId || !r.awayTeamId);
    if (hasErrors) {
      showToast('⚠️ Please fix all inline validation errors before reviewing fixtures.');
      return;
    }

    // Convert to PreparedFixture array
    const prepared: PreparedFixture[] = validated.map((r, i) => {
      const homeT = dbTeams.find((t) => t.id === r.homeTeamId);
      const awayT = dbTeams.find((t) => t.id === r.awayTeamId);
      const ref = dbReferees.find((rf) => rf.id === r.refereeId);

      return {
        id: `pf-manual-${Date.now()}-${i}`,
        competitionId: r.competitionId,
        competitionName: r.competitionName,
        matchday: Math.floor(i / 2) + 1,
        homeTeamId: r.homeTeamId,
        homeTeamName: homeT?.name || 'Home Team',
        awayTeamId: r.awayTeamId,
        awayTeamName: awayT?.name || 'Away Team',
        pitch: r.pitch,
        refereeId: r.refereeId,
        refereeName: ref ? ref.name : 'Unassigned',
        scheduledTime: `${r.kickoffDate}T${r.kickoffTime}:00`,
        status: 'UPCOMING'
      };
    });

    setPreparedFixtures(prepared);
    setModalStep('REVIEW');
  };

  // --- AUTOMATIC GENERATOR LOGIC ---
  const handleGenerateFixtures = async () => {
    // Check Championship Seeding first
    if (genCompetition === 'championship' || genCompetition === 'both') {
      const seedRes = await ApiService.seedChampionshipTeamsIfMissing();
      if (seedRes.success && seedRes.data && seedRes.data.length > 0) {
        const freshTeamsRes = await ApiService.getTeams();
        if (freshTeamsRes.success && freshTeamsRes.data) {
          setDbTeams(freshTeamsRes.data);
        }
      }
    }

    if (selectedPitches.length === 0) {
      showToast('⚠️ Select at least one available pitch.');
      return;
    }
    if (selectedReferees.length === 0) {
      showToast('⚠️ Select at least one available referee.');
      return;
    }
    if (selectedDays.length === 0) {
      showToast('⚠️ Select at least one available match day.');
      return;
    }

    const generated: PreparedFixture[] = [];

    // Helper generator for a single competition pool
    const runGeneratorForComp = (compObj: { id: string; name: string }, compTeamsList: any[]) => {
      if (!compTeamsList || compTeamsList.length < 2) return [];

      let pool = [...compTeamsList];
      // If odd number of teams, add a dummy bye team
      const isOdd = pool.length % 2 !== 0;
      if (isOdd) {
        pool.push({ id: 'BYE', name: 'BYE' });
      }

      const n = pool.length;
      const numRounds = n - 1;
      const matchesPerRound = n / 2;

      const pairsPerRound: Array<Array<{ home: any; away: any }>> = [];

      // Berger Algorithm for Round Robin
      for (let round = 0; round < numRounds; round++) {
        const roundPairs: Array<{ home: any; away: any }> = [];
        for (let i = 0; i < matchesPerRound; i++) {
          const home = pool[i];
          const away = pool[n - 1 - i];

          if (home.id !== 'BYE' && away.id !== 'BYE') {
            // Alternate home/away based on round for Rule 7
            if ((round + i) % 2 === 0) {
              roundPairs.push({ home, away });
            } else {
              roundPairs.push({ home: away, away: home });
            }
          }
        }
        pairsPerRound.push(roundPairs);

        // Rotate pool (keep index 0 fixed)
        pool.splice(1, 0, pool.pop());
      }

      // If double round robin, append reverse fixtures
      if (genRoundType === 'double') {
        const leg2Rounds: Array<Array<{ home: any; away: any }>> = pairsPerRound.map((r) =>
          r.map((pair) => ({ home: pair.away, away: pair.home }))
        );
        pairsPerRound.push(...leg2Rounds);
      }

      return pairsPerRound;
    };

    // Calculate dates & time slots
    const dayMap: Record<string, number> = {
      Sunday: 0, Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5, Saturday: 6
    };
    const targetDayNums = selectedDays.map((d) => dayMap[d]).sort();

    let curDate = new Date(genStartDate);
    const timeSlots = ['10:00', '14:00', '16:00', '18:00'];

    // Track occupied slots to obey Rule 4 (no team twice a day), Rule 5 (no ref simultaneous), Rule 6 (no pitch simultaneous)
    const pitchOccupancy = new Map<string, string>(); // "date_time_pitch" -> fixtureId
    const refOccupancy = new Map<string, string>();   // "date_time_refId" -> fixtureId
    const teamDailyMatches = new Map<string, Set<string>>(); // "date_teamId" -> count

    let datePointer = new Date(curDate);
    const getNextValidDate = (from: Date): Date => {
      const d = new Date(from);
      while (!targetDayNums.includes(d.getDay())) {
        d.setDate(d.getDate() + 1);
      }
      return d;
    };

    datePointer = getNextValidDate(datePointer);

    // Rule 3: Premier League receives priority scheduling first!
    const eplRounds = (genCompetition === 'epl' || genCompetition === 'both') ? runGeneratorForComp(eplComp, eplTeams) : [];
    const champRounds = (genCompetition === 'championship' || genCompetition === 'both') ? runGeneratorForComp(champComp, champTeams) : [];

    let matchCounter = 0;

    const scheduleRoundFixtures = (compObj: { id: string; name: string }, rounds: Array<Array<{ home: any; away: any }>>) => {
      rounds.forEach((roundPairs, roundIdx) => {
        const matchday = roundIdx + 1;
        let dayMatchesScheduled = 0;

        roundPairs.forEach((pair) => {
          let scheduled = false;

          // Attempt to assign date, time slot, pitch, and referee
          for (let attemptDays = 0; attemptDays < 60 && !scheduled; attemptDays++) {
            const dateStr = datePointer.toISOString().split('T')[0];
            if (!teamDailyMatches.has(dateStr)) {
              teamDailyMatches.set(dateStr, new Set());
            }
            const dailyTeams = teamDailyMatches.get(dateStr)!;

            // Check Rule 4: team plays once per day
            if (!dailyTeams.has(pair.home.id) && !dailyTeams.has(pair.away.id)) {
              for (const timeStr of timeSlots) {
                if (scheduled) break;

                for (const pitchStr of selectedPitches) {
                  if (scheduled) break;
                  const pitchKey = `${dateStr}_${timeStr}_${pitchStr}`;

                  if (!pitchOccupancy.has(pitchKey)) {
                    // Find available referee (Rule 5)
                    for (const refId of selectedReferees) {
                      const refKey = `${dateStr}_${timeStr}_${refId}`;
                      if (!refOccupancy.has(refKey)) {
                        // Slot allocated!
                        matchCounter++;
                        const refObj = dbReferees.find((r) => r.id === refId);
                        generated.push({
                          id: `pf-gen-${Date.now()}-${matchCounter}`,
                          competitionId: compObj.id,
                          competitionName: compObj.name,
                          matchday,
                          homeTeamId: pair.home.id,
                          homeTeamName: pair.home.name,
                          awayTeamId: pair.away.id,
                          awayTeamName: pair.away.name,
                          pitch: pitchStr,
                          refereeId: refId,
                          refereeName: refObj ? refObj.name : 'Unassigned',
                          scheduledTime: `${dateStr}T${timeStr}:00`,
                          status: 'UPCOMING'
                        });

                        pitchOccupancy.set(pitchKey, `m-${matchCounter}`);
                        refOccupancy.set(refKey, `m-${matchCounter}`);
                        dailyTeams.add(pair.home.id);
                        dailyTeams.add(pair.away.id);
                        dayMatchesScheduled++;
                        scheduled = true;
                        break;
                      }
                    }
                  }
                }
              }
            }

            if (!scheduled || dayMatchesScheduled >= maxMatchesPerDay) {
              // Advance date
              datePointer.setDate(datePointer.getDate() + 1);
              datePointer = getNextValidDate(datePointer);
              dayMatchesScheduled = 0;
            }
          }
        });
      });
    };

    // Priority 1: Schedule Premier League
    if (eplRounds.length > 0) {
      scheduleRoundFixtures(eplComp, eplRounds);
    }
    // Priority 2: Schedule Championship
    if (champRounds.length > 0) {
      scheduleRoundFixtures(champComp, champRounds);
    }

    if (generated.length === 0) {
      showToast('⚠️ No fixtures could be generated. Check team availability or generator settings.');
      return;
    }

    setPreparedFixtures(generated);
    setModalStep('REVIEW');
    showToast(`⚡ Generated ${generated.length} season fixtures following all 10 scheduling rules!`);
  };

  // --- REVIEW & EDIT LOGIC ---
  const handleStartEditFixture = (f: PreparedFixture) => {
    setEditingFixtureId(f.id);
    const [dStr, tStr] = f.scheduledTime.split('T');
    setEditForm({
      date: dStr || '',
      time: tStr ? tStr.slice(0, 5) : '14:00',
      pitch: f.pitch,
      refereeId: f.refereeId
    });
    setEditError(null);
  };

  const handleSaveEditFixture = (id: string) => {
    const target = preparedFixtures.find((f) => f.id === id);
    if (!target) return;

    const newSlotKey = `${editForm.date}_${editForm.time}`;

    // Conflict validation
    const conflict = preparedFixtures.find((other) => {
      if (other.id === id) return false;
      const [oDate, oTime] = other.scheduledTime.split('T');
      const otherSlotKey = `${oDate}_${oTime?.slice(0, 5)}`;

      if (newSlotKey === otherSlotKey) {
        if (other.pitch === editForm.pitch) return true;
        if (other.refereeId === editForm.refereeId) return true;
      }
      return false;
    });

    if (conflict) {
      setEditError('Conflict detected: Pitch or Referee is already occupied at this date and time.');
      return;
    }

    const refObj = dbReferees.find((r) => r.id === editForm.refereeId);

    setPreparedFixtures(
      preparedFixtures.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            pitch: editForm.pitch,
            refereeId: editForm.refereeId,
            refereeName: refObj ? refObj.name : f.refereeName,
            scheduledTime: `${editForm.date}T${editForm.time}:00`
          };
        }
        return f;
      })
    );
    setEditingFixtureId(null);
    showToast('Fixture details updated.');
  };

  const handleDeletePreparedFixture = (id: string) => {
    setPreparedFixtures(preparedFixtures.filter((f) => f.id !== id));
    showToast('Fixture removed from review list.');
  };

  const handleSwapHomeAwayPrepared = (id: string) => {
    setPreparedFixtures(
      preparedFixtures.map((f) => {
        if (f.id === id) {
          return {
            ...f,
            homeTeamId: f.awayTeamId,
            homeTeamName: f.awayTeamName,
            awayTeamId: f.homeTeamId,
            awayTeamName: f.homeTeamName
          };
        }
        return f;
      })
    );
    showToast('Swapped Home and Away teams.');
  };

  // --- FINAL CONFIRMATION & DB PUSH ---
  const handleFinalSubmitFixtures = async () => {
    if (preparedFixtures.length === 0) {
      showToast('⚠️ No fixtures to submit.');
      return;
    }

    setIsSubmitting(true);

    const payload = preparedFixtures.map((pf) => ({
      competition_id: pf.competitionId,
      home_team_id: pf.homeTeamId,
      away_team_id: pf.awayTeamId,
      scheduled_time: pf.scheduledTime,
      venue: pf.pitch,
      referee_id: pf.refereeId || null,
      matchday: pf.matchday
    }));

    const res = await ApiService.saveConfirmedFixtures(payload);
    setIsSubmitting(false);

    if (res.success) {
      showToast(`✅ ${res.data?.insertedCount || preparedFixtures.length} Fixtures successfully confirmed & pushed to database!`);
      setShowConfirmationDialog(false);
      if (onFixturesConfirmed) onFixturesConfirmed();
      onClose();
    } else {
      showToast(`⚠️ ${res.message || 'Failed to submit fixtures to database'}`);
    }
  };

  // --- GROUPING PREPARED FIXTURES FOR REVIEW ---
  const groupedFixtures = useMemo(() => {
    const groups: Record<string, PreparedFixture[]> = {};

    preparedFixtures.forEach((f) => {
      const dateObj = new Date(f.scheduledTime);
      const monthYear = dateObj.toLocaleString('default', { month: 'long', year: 'numeric' });
      const dateStr = dateObj.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
      const key = `${monthYear} | ${dateStr}`;

      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    });

    return groups;
  }, [preparedFixtures]);

  return (
    <div className="fixed inset-0 z-100 bg-black/75 backdrop-blur-md flex items-center justify-center p-3 md:p-6 overflow-y-auto">
      <div className={`w-full max-w-5xl ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col`}>
        
        {/* MODAL HEADER */}
        <div className={`p-5 md:p-6 border-b flex items-center justify-between flex-shrink-0 ${isDark ? 'bg-[#0E1424]/90 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight">
                Season Launch Portal
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                {modalStep === 'CHOICE' && 'Choose fixture preparation method to begin season workflow'}
                {modalStep === 'MANUAL_BUILDER' && 'Manual Fixture Builder — Configure individual match rows'}
                {modalStep === 'GENERATOR_SETTINGS' && 'Automatic Fixture Generator — Rule-compliant scheduler'}
                {modalStep === 'REVIEW' && `Review & Edit Fixtures (${preparedFixtures.length} Prepared)`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-2 text-slate-400 hover:text-white cursor-pointer rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* MODAL BODY */}
        <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6">
          
          {/* STEP 1: CHOICE */}
          {modalStep === 'CHOICE' && (
            <div className="space-y-8 max-w-3xl mx-auto py-6">
              <div className="text-center space-y-2">
                <span className="px-3.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/30">
                  OFFICIAL SEASON PREPARATION
                </span>
                <h3 className="text-2xl md:text-3xl font-black">
                  Select Season Fixture Engine
                </h3>
                <p className="text-xs md:text-sm text-slate-400 max-w-xl mx-auto font-medium">
                  Create matches manually with full precision or generate complete round-robin fixture schedules automatically based on platform regulations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* OPTION 1: Add Fixtures (Manual) */}
                <button
                  onClick={handleStartManualBuilder}
                  className={`p-8 rounded-3xl border text-left space-y-5 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer group shadow-lg ${
                    isDark
                      ? 'bg-[#0E1424] border-slate-800 hover:border-blue-500/60'
                      : 'bg-slate-50 border-slate-200 hover:border-blue-500'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    <Plus className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-blue-500 group-hover:text-blue-400">
                      Add Fixtures
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Manually construct fixtures row by row with real-time pitch, referee, and team availability checking.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-500 group-hover:translate-x-1 transition-transform">
                    <span>Open Fixture Builder</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>

                {/* OPTION 2: Generate Fixtures (Automatic) */}
                <button
                  onClick={() => setModalStep('GENERATOR_SETTINGS')}
                  className={`p-8 rounded-3xl border text-left space-y-5 transition-all hover:scale-[1.02] active:scale-[0.99] cursor-pointer group shadow-lg ${
                    isDark
                      ? 'bg-[#0E1424] border-slate-800 hover:border-emerald-500/60'
                      : 'bg-slate-50 border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center border border-emerald-500/20 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                    <Zap className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xl font-black text-emerald-500 group-hover:text-emerald-400">
                      Generate Fixtures
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-medium">
                      Automatically schedule Premier League & Championship round-robin matches following all 10 governance rules.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 group-hover:translate-x-1 transition-transform">
                    <span>Configure Generator</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: MANUAL BUILDER */}
          {modalStep === 'MANUAL_BUILDER' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-500" /> Manual Fixture Construction
                </h3>
                <button
                  onClick={addManualRow}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-4 h-4" /> Add Another Fixture
                </button>
              </div>

              <div className="space-y-4">
                {manualRows.map((row, idx) => {
                  const compTeams = row.competitionId === champComp.id ? champTeams : eplTeams;

                  return (
                    <div
                      key={row.id}
                      className={`p-4 md:p-5 rounded-2xl border ${
                        row.errors.length > 0
                          ? 'border-rose-500/60 bg-rose-950/10'
                          : isDark
                          ? 'bg-[#0E1424] border-slate-800'
                          : 'bg-slate-50 border-slate-200'
                      } space-y-3 transition-colors`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-slate-400">
                        <span className="uppercase tracking-wider font-black text-amber-500">
                          Fixture #{idx + 1}
                        </span>
                        <button
                          onClick={() => removeManualRow(row.id)}
                          className="text-rose-500 hover:text-rose-400 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" /> Remove
                        </button>
                      </div>

                      {/* Desktop Horizontal Row / Mobile Stack */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3 text-xs">
                        {/* Competition */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Competition</label>
                          <select
                            value={row.competitionId}
                            onChange={(e) => updateManualRow(row.id, { competitionId: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border min-h-[40px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          >
                            {competitions.map((c) => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Home Team */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Home Team</label>
                          <select
                            value={row.homeTeamId}
                            onChange={(e) => updateManualRow(row.id, { homeTeamId: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border min-h-[40px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          >
                            <option value="">Select Home Team</option>
                            {compTeams.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Away Team */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Away Team</label>
                          <select
                            value={row.awayTeamId}
                            onChange={(e) => updateManualRow(row.id, { awayTeamId: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border min-h-[40px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          >
                            <option value="">Select Away Team</option>
                            {compTeams.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Pitch */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Pitch Venue</label>
                          <select
                            value={row.pitch}
                            onChange={(e) => updateManualRow(row.id, { pitch: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border min-h-[40px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          >
                            {DEFAULT_PITCHES.map((p) => (
                              <option key={p} value={p}>{p}</option>
                            ))}
                          </select>
                        </div>

                        {/* Referee */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Center Referee</label>
                          <select
                            value={row.refereeId}
                            onChange={(e) => updateManualRow(row.id, { refereeId: e.target.value })}
                            className={`w-full p-2.5 rounded-xl border min-h-[40px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                          >
                            <option value="">Select Referee</option>
                            {dbReferees.map((r) => (
                              <option key={r.id} value={r.id}>{r.name}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date & Time */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Kickoff Date & Time</label>
                          <div className="flex gap-1.5">
                            <input
                              type="date"
                              value={row.kickoffDate}
                              onChange={(e) => updateManualRow(row.id, { kickoffDate: e.target.value })}
                              className={`w-3/5 p-2 rounded-xl border text-[11px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                            <input
                              type="time"
                              value={row.kickoffTime}
                              onChange={(e) => updateManualRow(row.id, { kickoffTime: e.target.value })}
                              className={`w-2/5 p-2 rounded-xl border text-[11px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Inline Validation Errors */}
                      {row.errors.length > 0 && (
                        <div className="pt-2 text-[11px] text-rose-400 space-y-1 font-semibold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-500" />
                          <span>{row.errors.join(' • ')}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTION BAR */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setModalStep('CHOICE')}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={handleManualReview}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <span>Review Fixtures ({manualRows.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: GENERATOR SETTINGS */}
          {modalStep === 'GENERATOR_SETTINGS' && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-lg font-black flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-500" /> Generator Preferences & Rules Configuration
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Set scheduling boundaries. Fixtures will be generated obeying all 10 platform rules.
                </p>
              </div>

              <div className="space-y-5 text-xs font-semibold">
                {/* Competition Selection */}
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Target Competition</label>
                  <select
                    value={genCompetition}
                    onChange={(e) => setGenCompetition(e.target.value)}
                    className={`w-full p-3 rounded-xl border min-h-[44px] ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  >
                    <option value="both">Both Premier League & Championship (Priority: EPL First)</option>
                    <option value="epl">Egerton Premier League Only</option>
                    <option value="championship">Egerton Championship Only</option>
                  </select>
                </div>

                {/* Round Type & Start Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Round Format</label>
                    <select
                      value={genRoundType}
                      onChange={(e) => setGenRoundType(e.target.value as any)}
                      className={`w-full p-3 rounded-xl border min-h-[44px] ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    >
                      <option value="single">Single Round Robin (Leg 1)</option>
                      <option value="double">Double Round Robin (Leg 1 & Leg 2 Home/Away)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Season Start Date</label>
                    <input
                      type="date"
                      value={genStartDate}
                      onChange={(e) => setGenStartDate(e.target.value)}
                      className={`w-full p-3 rounded-xl border min-h-[44px] ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                    />
                  </div>
                </div>

                {/* Match Days Checkbox List */}
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-2">Available Match Days</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const isChecked = selectedDays.includes(day);
                      return (
                        <label
                          key={day}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                              : isDark ? 'bg-[#0E1424] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedDays([...selectedDays, day]);
                              else setSelectedDays(selectedDays.filter((d) => d !== day));
                            }}
                            className="rounded text-emerald-600 focus:ring-emerald-500"
                          />
                          <span>{day}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Max Matches Per Day */}
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Maximum Matches Per Day</label>
                  <input
                    type="number"
                    min={1}
                    max={6}
                    value={maxMatchesPerDay}
                    onChange={(e) => setMaxMatchesPerDay(Number(e.target.value))}
                    className={`w-full p-3 rounded-xl border min-h-[44px] ${isDark ? 'bg-[#0E1424] border-slate-800 text-white' : 'bg-slate-50 border-slate-200'}`}
                  />
                </div>

                {/* Referees Checkbox List */}
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-2">Available Center Referees</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {dbReferees.map((ref) => {
                      const isChecked = selectedReferees.includes(ref.id);
                      return (
                        <label
                          key={ref.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2 cursor-pointer transition-colors ${
                            isChecked
                              ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 font-bold'
                              : isDark ? 'bg-[#0E1424] border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedReferees([...selectedReferees, ref.id]);
                              else setSelectedReferees(selectedReferees.filter((r) => r !== ref.id));
                            }}
                            className="rounded text-blue-600 focus:ring-blue-500"
                          />
                          <span className="truncate">{ref.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ACTION BAR */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setModalStep('CHOICE')}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
                >
                  Back
                </button>
                <button
                  onClick={handleGenerateFixtures}
                  className="px-6 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <Zap className="w-4 h-4" />
                  <span>Generate Fixtures</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: REVIEW & EDIT */}
          {modalStep === 'REVIEW' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-800">
                <div>
                  <h3 className="text-lg font-black text-emerald-500 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5" /> Fixture Review Stage ({preparedFixtures.length} Matches)
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Grouped by Month → Week → Date → Competition. Edit or remove fixtures prior to explicit database confirmation.
                  </p>
                </div>
                <button
                  onClick={() => setShowConfirmationDialog(true)}
                  className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg cursor-pointer flex items-center gap-2 whitespace-nowrap"
                >
                  Confirm & Submit Fixtures
                </button>
              </div>

              {/* Grouped Fixture Display */}
              <div className="space-y-8 max-h-[55vh] overflow-y-auto pr-2">
                {Object.keys(groupedFixtures).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold text-xs">
                    No fixtures available for review.
                  </div>
                ) : (
                  Object.entries(groupedFixtures).map(([groupTitle, fixList]) => (
                    <div key={groupTitle} className="space-y-3">
                      <div className="flex items-center gap-2 font-black text-xs text-amber-500 uppercase tracking-wider bg-amber-500/10 px-4 py-2 rounded-xl border border-amber-500/20">
                        <Calendar className="w-4 h-4" />
                        <span>{groupTitle}</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fixList.map((f) => {
                          const isEditing = editingFixtureId === f.id;
                          const [dStr, tStr] = f.scheduledTime.split('T');

                          return (
                            <div
                              key={f.id}
                              className={`p-5 rounded-2xl border ${
                                isDark ? 'bg-[#0E1424] border-slate-800' : 'bg-slate-50 border-slate-200'
                              } space-y-3 shadow-md transition-all`}
                            >
                              <div className="flex items-center justify-between text-xs">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                                  f.competitionName.toLowerCase().includes('premier')
                                    ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                                    : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                }`}>
                                  {f.competitionName} • Matchday {f.matchday}
                                </span>
                                <span className="text-[10px] font-bold uppercase text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-md">
                                  Draft Status
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm font-black">
                                <div className="space-y-0.5">
                                  <div className="text-slate-200">{f.homeTeamName}</div>
                                  <div className="text-slate-400 text-xs font-normal">VS</div>
                                  <div className="text-slate-200">{f.awayTeamName}</div>
                                </div>
                                <button
                                  onClick={() => handleSwapHomeAwayPrepared(f.id)}
                                  className="px-2.5 py-1 rounded-lg bg-blue-600/10 text-blue-400 hover:bg-blue-600 hover:text-white transition-all text-[11px] font-bold cursor-pointer"
                                >
                                  Swap H/A
                                </button>
                              </div>

                              {!isEditing ? (
                                <div className="text-[11px] text-slate-400 space-y-1 pt-2 border-t border-slate-800/80 font-medium">
                                  <div className="flex items-center justify-between">
                                    <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-slate-500" /> {f.pitch}</span>
                                    <span className="flex items-center gap-1 font-mono text-slate-300"><Clock className="w-3.5 h-3.5 text-slate-500" /> {dStr} @ {tStr?.slice(0, 5)}</span>
                                  </div>
                                  <div className="flex items-center justify-between pt-1">
                                    <span className="flex items-center gap-1 text-slate-300"><User className="w-3.5 h-3.5 text-slate-500" /> Ref: {f.refereeName}</span>
                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={() => handleStartEditFixture(f)}
                                        className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Edit2 className="w-3.5 h-3.5" /> Edit
                                      </button>
                                      <button
                                        onClick={() => handleDeletePreparedFixture(f.id)}
                                        className="text-rose-400 hover:text-rose-300 font-bold flex items-center gap-1 cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" /> Delete
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                /* Inline Edit Form */
                                <div className="space-y-3 pt-2 border-t border-slate-800/80 text-xs">
                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Date</label>
                                      <input
                                        type="date"
                                        value={editForm.date}
                                        onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
                                        className={`w-full p-2 rounded-lg border text-[11px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                                      />
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Time</label>
                                      <input
                                        type="time"
                                        value={editForm.time}
                                        onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
                                        className={`w-full p-2 rounded-lg border text-[11px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                                      />
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2">
                                    <div>
                                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Pitch</label>
                                      <select
                                        value={editForm.pitch}
                                        onChange={(e) => setEditForm({ ...editForm, pitch: e.target.value })}
                                        className={`w-full p-2 rounded-lg border text-[11px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                                      >
                                        {DEFAULT_PITCHES.map((p) => (
                                          <option key={p} value={p}>{p}</option>
                                        ))}
                                      </select>
                                    </div>
                                    <div>
                                      <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Referee</label>
                                      <select
                                        value={editForm.refereeId}
                                        onChange={(e) => setEditForm({ ...editForm, refereeId: e.target.value })}
                                        className={`w-full p-2 rounded-lg border text-[11px] ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200'}`}
                                      >
                                        {dbReferees.map((r) => (
                                          <option key={r.id} value={r.id}>{r.name}</option>
                                        ))}
                                      </select>
                                    </div>
                                  </div>

                                  {editError && (
                                    <div className="text-[10px] text-rose-400 font-bold">
                                      ⚠️ {editError}
                                    </div>
                                  )}

                                  <div className="flex justify-end gap-2 pt-1">
                                    <button
                                      onClick={() => setEditingFixtureId(null)}
                                      className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 font-bold"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleSaveEditFixture(f.id)}
                                      className="px-3 py-1 rounded-lg bg-emerald-600 text-white font-bold"
                                    >
                                      Save Changes
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* ACTION BAR */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                <button
                  onClick={() => setModalStep('CHOICE')}
                  className="px-5 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs cursor-pointer hover:bg-slate-700"
                >
                  Start Over
                </button>
                <button
                  onClick={() => setShowConfirmationDialog(true)}
                  className="px-8 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer shadow-xl flex items-center gap-2"
                >
                  <span>Confirm & Submit Fixtures ({preparedFixtures.length})</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CONFIRMATION DIALOG OVERLAY */}
      {showConfirmationDialog && (
        <div className="fixed inset-0 z-110 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={`w-full max-w-md ${isDark ? 'bg-[#090D16] border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 md:p-8 space-y-6 text-center shadow-2xl animate-in zoom-in-95 duration-200`}>
            <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black">
                Confirm & Submit Fixtures
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed font-medium">
                You are about to publish <strong className="text-amber-400 font-bold">{preparedFixtures.length} fixtures</strong>. This action will write them directly into the production database and make them available throughout the platform. Continue?
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                disabled={isSubmitting}
                onClick={() => setShowConfirmationDialog(false)}
                className="w-1/2 py-3 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700 font-bold text-xs cursor-pointer min-h-[44px]"
              >
                Cancel
              </button>
              <button
                disabled={isSubmitting}
                onClick={handleFinalSubmitFixtures}
                className="w-1/2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs cursor-pointer min-h-[44px] flex items-center justify-center gap-2"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
