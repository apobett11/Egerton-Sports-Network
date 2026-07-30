import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../../../../contexts/AuthContext';
import { ApiService } from '../../../../services/api';
import type { Match, MatchEventType, MatchStatus } from '../../../../types';
import type { RefereeTab, GoalEntry, CardEntry, SubstitutionEntry, InjuryEntry } from '../types';
import { useDraftRecovery } from '../../../../hooks/useDraftRecovery';
import { useUnsavedChanges } from '../../../../hooks/useUnsavedChanges';

export const useRefereeDashboard = () => {
  const { user, profile } = useAuth();
  const currentUserId = user?.id || 'referee-1';
  const currentUserName = profile ? `${profile.first_name} ${profile.last_name}` : 'Prof. J. K. Kiprop (Ref ID: REF-001)';

  const [activeTab, setActiveTab] = useState<RefereeTab>('home');
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [assignmentStatuses, setAssignmentStatuses] = useState<Record<string, 'accepted' | 'pending' | 'rejected'>>({});

  const [selectedFixtureId, setSelectedFixtureId] = useState<string>('');
  const [selectedHistoryFixture, setSelectedHistoryFixture] = useState<Match | null>(null);
  const [wizardStep, setWizardStep] = useState<number>(1);

  const [wizStatus, setWizStatus] = useState<MatchStatus>('LIVE');
  const [wizScoreHome, setWizScoreHome] = useState<number>(0);
  const [wizScoreAway, setWizScoreAway] = useState<number>(0);

  const [goalsList, setGoalsList] = useState<GoalEntry[]>([]);
  const [cardsList, setCardsList] = useState<CardEntry[]>([]);
  const [subsList, setSubsList] = useState<SubstitutionEntry[]>([]);
  const [injuriesList, setInjuriesList] = useState<InjuryEntry[]>([]);

  const [goalTeam, setGoalTeam] = useState<'home' | 'away'>('home');
  const [goalPlayer, setGoalPlayer] = useState<string>('');
  const [goalMinute, setGoalMinute] = useState<number>(15);
  const [goalType, setGoalType] = useState<'normal' | 'penalty' | 'own_goal'>('normal');

  const [cardTeam, setCardTeam] = useState<'home' | 'away'>('home');
  const [cardPlayer, setCardPlayer] = useState<string>('');
  const [cardMinute, setCardMinute] = useState<number>(30);
  const [cardType, setCardType] = useState<'yellow' | 'red'>('yellow');

  const [subTeam, setSubTeam] = useState<'home' | 'away'>('home');
  const [subOff, setSubOff] = useState<string>('');
  const [subOn, setSubOn] = useState<string>('');
  const [subMinute, setSubMinute] = useState<number>(60);

  const [injTeam, setInjTeam] = useState<'home' | 'away'>('home');
  const [injPlayer, setInjPlayer] = useState<string>('');
  const [injSeverity, setInjSeverity] = useState<'minor' | 'moderate' | 'severe'>('minor');
  const [injMinute, setInjMinute] = useState<number>(75);
  const [injNotes, setInjNotes] = useState<string>('');

  const [attendance, setAttendance] = useState<number>(2450);

  // Auto-Save Match Report Notes Draft Recovery
  const {
    value: reportDraftState,
    setValue: setReportDraftState,
    clearDraft: clearReportDraft,
    resetForm: resetReportDraft,
    hasRecoveredDraft,
  } = useDraftRecovery(
    {
      generalNotes: '',
      incidentsText: '',
      weatherText: 'Clear, 22°C pitch wet',
      additionalRemarks: '',
    },
    { key: `referee_report_${selectedFixtureId || 'default'}` }
  );

  const [authError, setAuthError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [countdownStr, setCountdownStr] = useState<string>('00h : 00m : 00s');

  // Protect Unsaved Match Wizard Changes
  const isReportDirty =
    activeTab === 'wizard' &&
    (!!reportDraftState.generalNotes.trim() || !!reportDraftState.incidentsText.trim() || goalsList.length > 0);
  useUnsavedChanges(isReportDirty);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedHistoryFixture(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    async function loadAssignedFixtures() {
      setIsLoading(true);
      const res = await ApiService.getFixtures();
      const allMatches = res.data || [];

      const assigned = allMatches.map((m, idx) => ({
        ...m,
        refereeId: idx < 2 ? currentUserId : `other_referee_${idx}`
      }));

      setFixtures(assigned);

      const initialMap: Record<string, 'accepted' | 'pending' | 'rejected'> = {};
      assigned.forEach((m) => {
        initialMap[m.id] = 'accepted';
      });
      setAssignmentStatuses(initialMap);

      const assignedToMe = assigned.filter((m) => m.refereeId === currentUserId);
      if (assignedToMe.length > 0) {
        const activeOne = assignedToMe.find((m) => m.status !== 'FT') || assignedToMe[0];
        setSelectedFixtureId(activeOne.id);
        setWizScoreHome(activeOne.scoreA);
        setWizScoreAway(activeOne.scoreB);
      }

      setIsLoading(false);
    }
    loadAssignedFixtures();
  }, [currentUserId]);

  const selectedFixture = useMemo(() => {
    return fixtures.find((f) => f.id === selectedFixtureId) || null;
  }, [fixtures, selectedFixtureId]);

  const upcomingAssignment = useMemo(() => {
    return fixtures.find((m) => m.refereeId === currentUserId && m.status !== 'FT') || null;
  }, [fixtures, currentUserId]);

  useEffect(() => {
    if (!upcomingAssignment) {
      setCountdownStr('No upcoming matches scheduled');
      return;
    }

    const timer = setInterval(() => {
      const targetTime = new Date();
      targetTime.setHours(16, 0, 0, 0);
      const diff = Math.max(0, targetTime.getTime() - Date.now());

      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((diff / (1000 * 60)) % 60);
      const seconds = Math.floor((diff / 1000) % 60);

      setCountdownStr(
        `${String(hours).padStart(2, '0')}h : ${String(minutes).padStart(2, '0')}m : ${String(seconds).padStart(2, '0')}s`
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [upcomingAssignment]);

  const refereeStats = useMemo(() => {
    const myMatches = fixtures.filter((f) => f.refereeId === currentUserId);
    const completed = myMatches.filter((f) => f.status === 'FT');

    let yellows = 0;
    let reds = 0;
    let penalties = 0;
    let cancelled = 0;
    let suspended = 0;

    myMatches.forEach((m) => {
      if (m.status === 'CANCELLED') cancelled++;
      if (m.status === 'POSTPONED') suspended++;
      (m.events || []).forEach((e) => {
        if (e.type === 'yellow') yellows++;
        if (e.type === 'red') reds++;
        if (e.type === 'penalty') penalties++;
      });
    });

    return {
      matchesRefereed: completed.length,
      yellowCards: yellows + 14,
      redCards: reds + 2,
      penalties: penalties + 3,
      cancelled: cancelled,
      suspended: suspended,
      fairPlayIndex: 94.8,
    };
  }, [fixtures, currentUserId]);

  const myAssignedFixtures = useMemo(() => {
    return fixtures.filter((f) => f.refereeId === currentUserId);
  }, [fixtures, currentUserId]);

  const groupedAssignments = useMemo(() => {
    const active = myAssignedFixtures.filter((f) => f.status !== 'FT');
    const upcoming = myAssignedFixtures.filter((f) => f.status === 'LIVE' || f.status === 'HT');
    const completed = myAssignedFixtures.filter((f) => f.status === 'FT');

    return [
      ['Active Matchday Assignments', active],
      ['Upcoming Scheduled Matches', upcoming],
      ['Completed Verified Reports', completed],
    ] as [string, Match[]][];
  }, [myAssignedFixtures]);

  const historyFixtures = useMemo(() => {
    return fixtures.filter((f) => f.refereeId === currentUserId && f.status === 'FT');
  }, [fixtures, currentUserId]);

  const handleAssignmentResponse = (fixtureId: string, status: 'accepted' | 'rejected') => {
    setAssignmentStatuses((prev) => ({
      ...prev,
      [fixtureId]: status,
    }));
    setSuccessMsg(`Assignment #${fixtureId} marked as ${status.toUpperCase()}`);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleAddGoal = () => {
    if (!goalPlayer.trim()) return;
    setGoalsList((prev) => [
      ...prev,
      {
        id: `g_${Date.now()}`,
        teamTarget: goalTeam,
        playerName: goalPlayer.trim(),
        minute: goalMinute,
        goalType: goalType,
      },
    ]);
    if (goalTeam === 'home') setWizScoreHome((s) => s + 1);
    if (goalTeam === 'away') setWizScoreAway((s) => s + 1);
    setGoalPlayer('');
  };

  const handleAddCard = () => {
    if (!cardPlayer.trim()) return;
    setCardsList((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        teamTarget: cardTeam,
        playerName: cardPlayer.trim(),
        minute: cardMinute,
        cardType: cardType,
      },
    ]);
    setCardPlayer('');
  };

  const handleAddSub = () => {
    if (!subOff.trim() || !subOn.trim()) return;
    setSubsList((prev) => [
      ...prev,
      {
        id: `s_${Date.now()}`,
        teamTarget: subTeam,
        playerOff: subOff.trim(),
        playerOn: subOn.trim(),
        minute: subMinute,
      },
    ]);
    setSubOff('');
    setSubOn('');
  };

  const handleAddInjury = () => {
    if (!injPlayer.trim()) return;
    setInjuriesList((prev) => [
      ...prev,
      {
        id: `i_${Date.now()}`,
        teamTarget: injTeam,
        playerName: injPlayer.trim(),
        severity: injSeverity,
        minute: injMinute,
        notes: injNotes,
      },
    ]);
    setInjPlayer('');
    setInjNotes('');
  };

  const handleSubmitOfficialReport = async () => {
    if (isSubmitting) return;
    if (!selectedFixture) {
      setAuthError('No active match selected for official verification.');
      return;
    }

    setIsSubmitting(true);
    setAuthError(null);

    const compiledEvents = [
      ...goalsList.map((g) => ({
        type: 'goal' as MatchEventType,
        eventTarget: g.teamTarget,
        teamId: g.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: g.minute,
        detailText: `Scored by ${g.playerName} (${g.goalType})`
      })),
      ...cardsList.map((c) => ({
        type: c.cardType as MatchEventType,
        eventTarget: c.teamTarget,
        teamId: c.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: c.minute,
        detailText: `${c.cardType.toUpperCase()} Card issued to ${c.playerName}`
      })),
      ...subsList.map((s) => ({
        type: 'sub' as MatchEventType,
        eventTarget: s.teamTarget,
        teamId: s.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: s.minute,
        detailText: `Sub: OFF ${s.playerOff} -> ON ${s.playerOn}`
      })),
      ...injuriesList.map((i) => ({
        type: 'injury' as MatchEventType,
        eventTarget: i.teamTarget,
        teamId: i.teamTarget === 'home' ? selectedFixture.teamA.id : selectedFixture.teamB.id,
        minute: i.minute,
        detailText: `Injury timeout (${i.severity}): ${i.playerName} - ${i.notes}`
      }))
    ];

    const reportText = `OFFICIAL MATCH REPORT\n\nNotes: ${reportDraftState.generalNotes}\n\nIncidents: ${reportDraftState.incidentsText || 'None'}\n\nWeather: ${reportDraftState.weatherText}\n\nRemarks: ${reportDraftState.additionalRemarks || 'None'}`;

    try {
      const result = await ApiService.verifyOfficialMatchResult({
        fixtureId: selectedFixture.id,
        refereeId: currentUserId,
        scoreHome: wizScoreHome,
        scoreAway: wizScoreAway,
        status: wizStatus,
        reportText,
        attendance,
        weather: reportDraftState.weatherText,
        incidents: reportDraftState.incidentsText,
        remarks: reportDraftState.additionalRemarks,
        officialEvents: compiledEvents
      });

      if (result.success) {
        setFixtures((prev) =>
          prev.map((f) =>
            f.id === selectedFixture.id
              ? { ...f, status: wizStatus, scoreA: wizScoreHome, scoreB: wizScoreAway, verifiedByRefereeId: currentUserId }
              : f
          )
        );
        clearReportDraft();
        resetReportDraft();
        setSuccessMsg(
          `Official Match Verification Submitted! Match #${selectedFixture.id} status updated to ${wizStatus}. Signed by ${currentUserName}.`
        );
        setWizardStep(1);
      } else {
        setAuthError(result.message || 'Failed to submit official referee verification');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Error submitting official referee report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    currentUserId,
    currentUserName,
    activeTab,
    setActiveTab,
    fixtures,
    isLoading,
    assignmentStatuses,
    selectedFixtureId,
    setSelectedFixtureId,
    selectedHistoryFixture,
    setSelectedHistoryFixture,
    selectedFixture,
    upcomingAssignment,
    countdownStr,
    refereeStats,
    myAssignedFixtures,
    groupedAssignments,
    historyFixtures,
    wizardStep,
    setWizardStep,
    wizStatus,
    setWizStatus,
    wizScoreHome,
    setWizScoreHome,
    wizScoreAway,
    setWizScoreAway,
    goalsList,
    setGoalsList,
    cardsList,
    setCardsList,
    subsList,
    setSubsList,
    injuriesList,
    setInjuriesList,
    goalTeam,
    setGoalTeam,
    goalPlayer,
    setGoalPlayer,
    goalMinute,
    setGoalMinute,
    goalType,
    setGoalType,
    cardTeam,
    setCardTeam,
    cardPlayer,
    setCardPlayer,
    cardMinute,
    setCardMinute,
    cardType,
    setCardType,
    subTeam,
    setSubTeam,
    subOff,
    setSubOff,
    subOn,
    setSubOn,
    subMinute,
    setSubMinute,
    injTeam,
    setInjTeam,
    injPlayer,
    setInjPlayer,
    injSeverity,
    setInjSeverity,
    injMinute,
    setInjMinute,
    injNotes,
    setInjNotes,
    attendance,
    setAttendance,
    generalNotes: reportDraftState.generalNotes,
    setGeneralNotes: (generalNotes: string) => setReportDraftState((prev) => ({ ...prev, generalNotes })),
    incidentsText: reportDraftState.incidentsText,
    setIncidentsText: (incidentsText: string) => setReportDraftState((prev) => ({ ...prev, incidentsText })),
    weatherText: reportDraftState.weatherText,
    setWeatherText: (weatherText: string) => setReportDraftState((prev) => ({ ...prev, weatherText })),
    additionalRemarks: reportDraftState.additionalRemarks,
    setAdditionalRemarks: (additionalRemarks: string) => setReportDraftState((prev) => ({ ...prev, additionalRemarks })),
    authError,
    setAuthError,
    successMsg,
    setSuccessMsg,
    isSubmitting,
    hasRecoveredDraft,
    handleAssignmentResponse,
    handleAddGoal,
    handleAddCard,
    handleAddSub,
    handleAddInjury,
    handleSubmitOfficialReport,
  };
};
