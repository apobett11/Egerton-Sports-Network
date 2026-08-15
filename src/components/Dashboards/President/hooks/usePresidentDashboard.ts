import { useState, useEffect, useCallback } from 'react';
import { ApiService } from '../../../../services/api';
import { pitchesService } from '../services/pitchesService';
import { fixturesService } from '../services/fixturesService';
import type {
  PresidentTab,
  LeagueTab,
  SeasonItem,
  LeagueItem,
  PendingTeam,
  TeamItem,
  RefereeItem,
  DraftFixture,
  PitchItem,
  SeasonFixture,
} from '../types';
import {
  INITIAL_SEASONS,
  INITIAL_LEAGUES,
  INITIAL_PENDING_TEAMS,
  INITIAL_TEAMS,
  INITIAL_REFEREES,
  INITIAL_DRAFT_FIXTURES,
  OFFICIAL_PITCHES,
} from '../constants';

export const usePresidentDashboard = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<PresidentTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- DUAL MODE MANAGEMENT: PRE-SEASON VS SEASON MODE ---
  const [isSeasonMode, setIsSeasonMode] = useState<boolean>(() => {
    return localStorage.getItem('egerton_season_mode_active') === 'true';
  });

  // --- TAB 0: CAMPUS PITCHES STATE ---
  const [pitches, setPitches] = useState<PitchItem[]>(OFFICIAL_PITCHES as PitchItem[]);

  // --- TAB 1: SEASON & LEAGUE ENGINE STATE ---
  const [seasons, setSeasons] = useState<SeasonItem[]>(INITIAL_SEASONS);
  const [leagues, setLeagues] = useState<LeagueItem[]>(INITIAL_LEAGUES);
  const [showCreateSeasonModal, setShowCreateSeasonModal] = useState(false);
  const [showCreateLeagueModal, setShowCreateLeagueModal] = useState(false);
  const [editingLeague, setEditingLeague] = useState<LeagueItem | null>(null);

  // New Season Form State
  const [newSeasonName, setNewSeasonName] = useState('');
  const [newSeasonStart, setNewSeasonStart] = useState('');
  const [newSeasonEnd, setNewSeasonEnd] = useState('');
  const [newSeasonCutoff, setNewSeasonCutoff] = useState('');

  // New League Form State
  const [newLeagueName, setNewLeagueName] = useState('');
  const [newLeagueTier, setNewLeagueTier] = useState('Division 1');
  const [newLeagueMaxTeams, setNewLeagueMaxTeams] = useState(16);

  // --- TAB 2: TEAM ONBOARDING & APPROVALS STATE ---
  const [pendingTeams, setPendingTeams] = useState<PendingTeam[]>(INITIAL_PENDING_TEAMS);
  const [teams, setTeams] = useState<TeamItem[]>(INITIAL_TEAMS);
  const [leagueTab, setLeagueTab] = useState<LeagueTab>('premier');
  const [selectedTeam, setSelectedTeam] = useState<TeamItem | null>(null);
  const [activeMenuTeamId, setActiveMenuTeamId] = useState<string | null>(null);
  const [rejectingTeamId, setRejectingTeamId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // --- TAB 3: REFEREE POOL SETUP STATE ---
  const [referees, setReferees] = useState<RefereeItem[]>(INITIAL_REFEREES);
  const [selectedReferee, setSelectedReferee] = useState<RefereeItem | null>(null);
  const [activeMenuRefId, setActiveMenuRefId] = useState<string | null>(null);
  const [showAddRefModal, setShowAddRefModal] = useState(false);
  const [editingRef, setEditingRef] = useState<RefereeItem | null>(null);

  // Ref Rules
  const [neutralTeamRule, setNeutralTeamRule] = useState(true);
  const [maxRefCapacity, setMaxRefCapacity] = useState(3);

  // New Ref Form
  const [newRefName, setNewRefName] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');
  const [newRefEmail, setNewRefEmail] = useState('');
  const [newRefBadge, setNewRefBadge] = useState('FKF National Level 2');
  const [newRefExp, setNewRefExp] = useState('3 Seasons');

  // --- TAB 4: FIXTURE ENGINE & SCHEDULE LOCK STATE ---
  const [draftFixtures, setDraftFixtures] = useState<DraftFixture[]>([]);
  const [savedFixtures, setSavedFixtures] = useState<SeasonFixture[]>([]);
  const [isScheduleLocked, setIsScheduleLocked] = useState(false);
  const [showLockWarningModal, setShowLockWarningModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState<DraftFixture | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [conflictsResolved, setConflictsResolved] = useState(false);

  // --- PHASE P: SEASON LAUNCH MODAL STATE ---
  const [isSeasonLaunchModalOpen, setIsSeasonLaunchModalOpen] = useState(false);

  // --- TAB 5: MAKE ANNOUNCEMENT STATE ---
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [recipientGroup, setRecipientGroup] = useState('all');
  const [announcements, setAnnouncements] = useState<any[]>([]);

  const isDark = theme === 'dark';

  // =========================================================================
  // REFRESH ALL DATABASE STATE - SINGLE SOURCE OF TRUTH
  // =========================================================================
  const fetchPresidentData = useCallback(async () => {
    try {
      // 1. Fetch Referees
      const refRes = await ApiService.getReferees();
      if (refRes.success && refRes.data && refRes.data.length > 0) {
        const formatted: RefereeItem[] = refRes.data.map((r: any) => ({
          id: r.id,
          name: r.name,
          email: r.email || '',
          phone: r.phone || '',
          status: r.status || 'Active',
          badgeLevel: r.badge_level || 'FKF National Level 2'
        }));
        setReferees(formatted);
      }

      // 2. Fetch Announcements
      const ancRes = await ApiService.getAnnouncements();
      if (ancRes.success && ancRes.data) {
        setAnnouncements(ancRes.data);
      }

      // 3. Fetch Approved Teams
      const teamRes = await ApiService.getTeams();
      if (teamRes.success && teamRes.data && teamRes.data.length > 0) {
        const formattedTeams: TeamItem[] = teamRes.data
          .filter((t: any) => t.status !== 'pending' && t.status !== 'rejected')
          .map((t: any) => ({
            id: t.id,
            name: t.name,
            code: t.shortName || t.short_name || 'EGA',
            league: t.division?.toLowerCase().includes('championship') ? 'championship' : 'premier',
            coach: t.coach || 'Assigned Head Coach',
            captain: t.captain || 'Team Captain',
            playerCount: t.squadCount || t.playerCount || 16,
            maxRoster: 25,
            doctorStatus: 'Assigned',
            doctorName: 'Dr. Official',
            hasCoach: true,
            hasCaptain: true
          }));
        if (formattedTeams.length > 0) {
          setTeams(formattedTeams);
        }
      }

      // 4. Fetch Pending Teams
      const pendingRes = await ApiService.getPendingTeams();
      if (pendingRes.success && pendingRes.data && pendingRes.data.length > 0) {
        setPendingTeams(pendingRes.data);
      }

      // 5. Fetch Seasons
      const seasonsRes = await ApiService.getSeasons();
      if (seasonsRes.success && seasonsRes.data && seasonsRes.data.length > 0) {
        const formattedSeasons: SeasonItem[] = seasonsRes.data.map((s: any) => ({
          id: s.id,
          name: s.name,
          startDate: s.start_date || s.startDate || '2026-09-01',
          endDate: s.end_date || s.endDate || '2027-05-30',
          registrationCutoff: s.registration_cutoff || s.registrationCutoff || '2026-08-25',
          status: s.status || 'active',
          isLocked: Boolean(s.is_locked ?? s.isLocked ?? false)
        }));
        setSeasons(formattedSeasons);
      }

      // 6. Fetch Competitions / Leagues
      const leaguesRes = await ApiService.getLeagues();
      if (leaguesRes.success && leaguesRes.data && leaguesRes.data.length > 0) {
        const formattedLeagues: LeagueItem[] = leaguesRes.data.map((l: any) => ({
          id: l.id,
          name: l.name,
          tier: l.slug?.includes('championship') ? 'Division 2' : 'Division 1',
          maxTeams: 16,
          currentTeamsCount: teams.filter((t) => t.league === (l.slug?.includes('championship') ? 'championship' : 'premier')).length,
          status: l.is_active !== false ? 'Active' : 'Inactive',
          isArchived: Boolean(l.is_archived)
        }));
        setLeagues(formattedLeagues);
      }

      // 7. Fetch Campus Pitches
      const pitchRes = await pitchesService.fetchPitches();
      if (pitchRes.pitches && pitchRes.pitches.length > 0) {
        setPitches(pitchRes.pitches);
      }

      // 8. Fetch Official Saved Season Fixtures & Check Season Mode Lock
      const fixRes = await fixturesService.fetchFixtures();
      if (fixRes.fixtures && fixRes.fixtures.length > 0) {
        setSavedFixtures(fixRes.fixtures);
        setIsScheduleLocked(true);
        setIsSeasonMode(true);
        localStorage.setItem('egerton_season_mode_active', 'true');
      }
    } catch (err: any) {
      console.warn('Live database sync info:', err.message);
    }
  }, [teams]);

  // Initial mount load
  useEffect(() => {
    fetchPresidentData();
  }, []);

  const reloadSavedFixtures = async () => {
    const fixRes = await fixturesService.fetchFixtures();
    if (fixRes.fixtures && fixRes.fixtures.length > 0) {
      setSavedFixtures(fixRes.fixtures);
      setIsScheduleLocked(true);
    }
  };

  // Called when Season Launch Wizard confirms & locks fixtures to DB
  const handleFixturesConfirmed = useCallback(() => {
    setIsSeasonMode(true);
    setIsScheduleLocked(true);
    localStorage.setItem('egerton_season_mode_active', 'true');
    reloadSavedFixtures();
  }, []);

  // Safe manual reset helper for administrative overhaul / test suite
  const handleResetToPreSeason = useCallback(() => {
    setIsSeasonMode(false);
    setIsScheduleLocked(false);
    localStorage.removeItem('egerton_season_mode_active');
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowCreateSeasonModal(false);
        setShowCreateLeagueModal(false);
        setShowLockWarningModal(false);
        setShowAddRefModal(false);
        setRejectingTeamId(null);
        setIsSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  // --- TAB 1 HANDLERS (SEASONS & LEAGUES) ---
  const handleCreateSeason = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeasonName || !newSeasonStart || !newSeasonEnd || !newSeasonCutoff) {
      showToast('⚠️ All season fields are required.');
      return;
    }
    if (new Date(newSeasonEnd) <= new Date(newSeasonStart)) {
      showToast('⚠️ End Date must be after Start Date.');
      return;
    }
    if (new Date(newSeasonCutoff) >= new Date(newSeasonStart)) {
      showToast('⚠️ Registration cutoff must be before Start Date.');
      return;
    }
    const duplicate = seasons.some((s) => s.name.toLowerCase() === newSeasonName.toLowerCase());
    if (duplicate) {
      showToast('⚠️ Season name already exists.');
      return;
    }

    const created = {
      name: newSeasonName,
      startDate: newSeasonStart,
      endDate: newSeasonEnd,
      registrationCutoff: newSeasonCutoff,
      status: 'active',
      isLocked: false
    };

    const res = await ApiService.createSeason(created);
    if (res.success) {
      await ApiService.logAuditAction('CREATE_SEASON', 'seasons', res.data?.id || 'new', { name: newSeasonName });
      setShowCreateSeasonModal(false);
      setNewSeasonName('');
      setNewSeasonStart('');
      setNewSeasonEnd('');
      setNewSeasonCutoff('');
      await fetchPresidentData();
      showToast('✅ Season saved into database!');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to save season'}`);
    }
  };

  const handleToggleSeasonStatus = async (id: string, newStatus: 'active' | 'inactive' | 'archived') => {
    const res = await ApiService.updateSeasonStatus(id, newStatus);
    if (res.success) {
      await ApiService.logAuditAction('UPDATE_SEASON_STATUS', 'seasons', id, { new_status: newStatus });
      await fetchPresidentData();
      showToast(`Season status changed to ${newStatus}`);
    } else {
      showToast(`⚠️ ${res.message || 'Failed to update status'}`);
    }
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName) return;
    if (leagues.some((l) => l.name.toLowerCase() === newLeagueName.toLowerCase())) {
      showToast('⚠️ League with this name already exists.');
      return;
    }
    const created = {
      name: newLeagueName,
      tier: newLeagueTier,
      maxTeams: newLeagueMaxTeams,
    };
    const res = await ApiService.createLeague(created);
    if (res.success) {
      await ApiService.logAuditAction('CREATE_LEAGUE', 'competitions', res.data?.id || 'new', { name: newLeagueName });
      setShowCreateLeagueModal(false);
      setNewLeagueName('');
      await fetchPresidentData();
      showToast('✅ League created and saved in database!');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to create league'}`);
    }
  };

  const handleToggleLeagueStatus = async (id: string) => {
    const target = leagues.find((l) => l.id === id);
    const newActiveState = target ? target.status !== 'Active' : true;
    const res = await ApiService.updateLeagueStatus(id, newActiveState);
    if (res.success) {
      await ApiService.logAuditAction('TOGGLE_LEAGUE_STATUS', 'competitions', id, { is_active: newActiveState });
      await fetchPresidentData();
      showToast('League status updated in database.');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to update league status'}`);
    }
  };

  const handleArchiveLeague = async (id: string) => {
    const res = await ApiService.updateLeagueStatus(id, false);
    if (res.success) {
      await ApiService.logAuditAction('ARCHIVE_LEAGUE', 'competitions', id, { is_archived: true });
      await fetchPresidentData();
      showToast('League archived in database.');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to archive league'}`);
    }
  };

  const handleDeleteLeague = async (id: string) => {
    const res = await ApiService.deleteLeague(id);
    if (res.success) {
      await ApiService.logAuditAction('DELETE_LEAGUE', 'competitions', id, {});
      await fetchPresidentData();
      showToast('League deleted from database.');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to delete league'}`);
    }
  };

  // --- TAB 2 HANDLERS (TEAM ONBOARDING & APPROVALS) ---
  const handleApproveTeam = async (pt: PendingTeam) => {
    if (pt.playerCount < 15) {
      showToast(`⚠️ Cannot approve ${pt.name}: Minimum roster requirement is 15 players (current: ${pt.playerCount}).`);
      return;
    }
    if (pt.playerCount > 25) {
      showToast(`⚠️ Cannot approve ${pt.name}: Roster exceeds capacity (current: ${pt.playerCount}, max: 25).`);
      return;
    }
    if (!pt.coachAssigned || !pt.coachName) {
      showToast(`⚠️ Cannot approve ${pt.name}: An assigned head coach is mandatory.`);
      return;
    }

    const res = await ApiService.approveTeam(pt.id, pt.requestedLeague, pt.division);
    if (res.success) {
      await ApiService.logAuditAction('APPROVE_TEAM', 'teams', pt.id, {
        team_name: pt.name,
        league: pt.requestedLeague,
      });
      await fetchPresidentData();
      showToast(`✅ ${pt.name} approved & assigned to ${pt.requestedLeague.toUpperCase()} League in database!`);
    } else {
      showToast(`⚠️ ${res.message || 'Failed to approve team'}`);
    }
  };

  const handleRejectTeam = async (id: string) => {
    if (!rejectionReason) {
      showToast('Please specify rejection reason.');
      return;
    }
    const res = await ApiService.rejectTeam(id, rejectionReason);
    if (res.success) {
      await ApiService.logAuditAction('REJECT_TEAM', 'teams', id, { reason: rejectionReason });
      setRejectingTeamId(null);
      setRejectionReason('');
      await fetchPresidentData();
      showToast('Team registration rejected in database.');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to reject team'}`);
    }
  };

  // --- TAB 3 HANDLERS (REFEREE POOL) ---
  const handleAddReferee = async (ref: { name: string; email: string; phone: string }) => {
    const res = await ApiService.createReferee(ref);
    if (res.success && res.data) {
      await ApiService.logAuditAction('ADD_REFEREE', 'referees', res.data.id || 'new', { name: ref.name });
      await fetchPresidentData();
      showToast('✅ Referee saved to database.');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to save referee'}`);
    }
  };

  const handleUpdateRefStatus = async (id: string, status: 'Active' | 'Suspended' | 'Deactivated') => {
    const res = await ApiService.updateRefereeStatus(id, status);
    if (res.success) {
      await ApiService.logAuditAction('UPDATE_REFEREE_STATUS', 'referees', id, { new_status: status });
      await fetchPresidentData();
      showToast(`Referee status updated to ${status} in database.`);
    } else {
      showToast(`⚠️ ${res.message || 'Failed to update referee status'}`);
    }
  };

  const handleDeleteReferee = async (id: string) => {
    if (isScheduleLocked) {
      showToast('⚠️ Referees cannot be deleted during an active/confirmed season.');
      return;
    }
    const res = await ApiService.deleteReferee(id);
    if (res.success) {
      await ApiService.logAuditAction('DELETE_REFEREE', 'referees', id, {});
      await fetchPresidentData();
      showToast('Referee deleted from database.');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to delete referee'}`);
    }
  };

  // --- TAB 4 HANDLERS (FIXTURE ENGINE & SCHEDULE LOCK) ---
  const handleGenerateFixtures = () => {
    if (isScheduleLocked) {
      showToast('🔒 Schedule is locked. Fixtures cannot be regenerated.');
      return;
    }
    const generated: DraftFixture[] = [
      { id: 'df-101', matchday: 1, homeTeam: 'Agriculture FC', awayTeam: 'Engineering Strikers FC', date: '2027-09-04', timeSlot: '14:00', pitch: 'Main Stadium Pitch A', hasConflict: false },
      { id: 'df-102', matchday: 1, homeTeam: 'Njoro Spurs', awayTeam: 'Science Lions', date: '2027-09-04', timeSlot: '16:00', pitch: 'Main Stadium Pitch A', hasConflict: false },
      { id: 'df-103', matchday: 1, homeTeam: 'Tatton United FC', awayTeam: 'Vet Med Warriors', date: '2027-09-04', timeSlot: '16:00', pitch: 'Pavilion Field 1', hasConflict: false },
      { id: 'df-104', matchday: 2, homeTeam: 'Engineering Strikers FC', awayTeam: 'Njoro Spurs', date: '2027-09-11', timeSlot: '15:00', pitch: 'Pavilion Ground', hasConflict: false },
      { id: 'df-105', matchday: 2, homeTeam: 'Science Lions', awayTeam: 'Tatton United FC', date: '2027-09-11', timeSlot: '15:00', pitch: 'Tatton Complex', hasConflict: false }
    ];
    setDraftFixtures(generated);
    setConflictsResolved(true);
    showToast('⚡ Leg 1 round-robin fixtures generated for review!');
  };

  const handleSwapTeams = (id: string) => {
    if (isScheduleLocked) {
      showToast('🔒 Schedule is locked.');
      return;
    }
    setDraftFixtures(
      draftFixtures.map((f) => {
        if (f.id === id) {
          return { ...f, homeTeam: f.awayTeam, awayTeam: f.homeTeam };
        }
        return f;
      })
    );
    showToast('Swapped Home and Away teams.');
  };

  const handleUpdateFixtureDetails = (id: string, newTime: string, newPitch: string) => {
    if (isScheduleLocked) return;
    setDraftFixtures(
      draftFixtures.map((f) => {
        if (f.id === id) {
          return { ...f, timeSlot: newTime, pitch: newPitch };
        }
        return f;
      })
    );
    setEditingFixture(null);
    showToast('Fixture slot updated.');
  };

  const handleLockSchedule = async () => {
    setIsScheduleLocked(true);
    setIsSeasonMode(true);
    localStorage.setItem('egerton_season_mode_active', 'true');
    setShowLockWarningModal(false);
    await ApiService.logAuditAction('LOCK_SEASON_SCHEDULE', 'seasons', 'season-2027', { locked_by: 'president' });
    showToast('🔒 Season Fixtures Confirmed & Locked! Switch portal to active season view.');
  };

  // --- TAB 5 HANDLERS (MAKE ANNOUNCEMENT) ---
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementBody) {
      showToast('⚠️ Title and Body are required.');
      return;
    }
    const res = await ApiService.createAnnouncement({
      title: announcementTitle,
      content: announcementBody,
      target_role: recipientGroup
    });
    if (res.success && res.data) {
      await ApiService.logAuditAction('BROADCAST_ANNOUNCEMENT', 'announcements', res.data.id || 'new', {
        title: announcementTitle,
        target_role: recipientGroup
      });
      setAnnouncementTitle('');
      setAnnouncementBody('');
      await fetchPresidentData();
      showToast('📢 Announcement published to database!');
    } else {
      showToast(`⚠️ ${res.message || 'Failed to publish announcement'}`);
    }
  };

  return {
    theme,
    isDark,
    toggleTheme,
    isSidebarOpen,
    setIsSidebarOpen,
    activeView,
    setActiveView,
    isSeasonMode,
    setIsSeasonMode,
    handleFixturesConfirmed,
    handleResetToPreSeason,
    toastMessage,
    showToast,
    seasons,
    leagues,
    showCreateSeasonModal,
    setShowCreateSeasonModal,
    showCreateLeagueModal,
    setShowCreateLeagueModal,
    editingLeague,
    setEditingLeague,
    newSeasonName,
    setNewSeasonName,
    newSeasonStart,
    setNewSeasonStart,
    newSeasonEnd,
    setNewSeasonEnd,
    newSeasonCutoff,
    setNewSeasonCutoff,
    newLeagueName,
    setNewLeagueName,
    newLeagueTier,
    setNewLeagueTier,
    newLeagueMaxTeams,
    setNewLeagueMaxTeams,
    pendingTeams,
    teams,
    leagueTab,
    setLeagueTab,
    selectedTeam,
    setSelectedTeam,
    activeMenuTeamId,
    setActiveMenuTeamId,
    rejectingTeamId,
    setRejectingTeamId,
    rejectionReason,
    setRejectionReason,
    referees,
    selectedReferee,
    setSelectedReferee,
    activeMenuRefId,
    setActiveMenuRefId,
    showAddRefModal,
    setShowAddRefModal,
    editingRef,
    setEditingRef,
    neutralTeamRule,
    setNeutralTeamRule,
    maxRefCapacity,
    setMaxRefCapacity,
    newRefName,
    setNewRefName,
    newRefPhone,
    setNewRefPhone,
    newRefEmail,
    setNewRefEmail,
    newRefBadge,
    setNewRefBadge,
    newRefExp,
    setNewRefExp,
    draftFixtures,
    isScheduleLocked,
    showLockWarningModal,
    setShowLockWarningModal,
    isSeasonLaunchModalOpen,
    setIsSeasonLaunchModalOpen,
    editingFixture,
    setEditingFixture,
    wizardStep,
    setWizardStep,
    conflictsResolved,
    announcementTitle,
    setAnnouncementTitle,
    announcementBody,
    setAnnouncementBody,
    recipientGroup,
    setRecipientGroup,
    announcements,
    pitches,
    savedFixtures,
    reloadSavedFixtures,
    refreshAllData: fetchPresidentData,
    handleCreateSeason,
    handleToggleSeasonStatus,
    handleCreateLeague,
    handleToggleLeagueStatus,
    handleArchiveLeague,
    handleDeleteLeague,
    handleApproveTeam,
    handleRejectTeam,
    handleAddReferee,
    handleUpdateRefStatus,
    handleDeleteReferee,
    handleGenerateFixtures,
    handleSwapTeams,
    handleUpdateFixtureDetails,
    handleLockSchedule,
    handleBroadcastAnnouncement,
  };
};
