import { useState, useEffect } from 'react';
import { ApiService } from '../../../../services/api';
import type {
  PresidentTab,
  LeagueTab,
  SeasonItem,
  LeagueItem,
  PendingTeam,
  TeamItem,
  RefereeItem,
  DraftFixture,
} from '../types';
import {
  INITIAL_SEASONS,
  INITIAL_LEAGUES,
  INITIAL_PENDING_TEAMS,
  INITIAL_TEAMS,
  INITIAL_REFEREES,
  INITIAL_DRAFT_FIXTURES,
} from '../constants';

export const usePresidentDashboard = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<PresidentTab>('overview');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
  const [linesmanRule, setLinesmanRule] = useState(2);
  const [neutralTeamRule, setNeutralTeamRule] = useState(true);
  const [maxRefCapacity, setMaxRefCapacity] = useState(3);

  // New Ref Form
  const [newRefName, setNewRefName] = useState('');
  const [newRefPhone, setNewRefPhone] = useState('');
  const [newRefEmail, setNewRefEmail] = useState('');
  const [newRefBadge, setNewRefBadge] = useState('FKF National Level 2');
  const [newRefExp, setNewRefExp] = useState('3 Seasons');

  // --- TAB 4: FIXTURE ENGINE & SCHEDULE LOCK STATE ---
  const [draftFixtures, setDraftFixtures] = useState<DraftFixture[]>(INITIAL_DRAFT_FIXTURES);
  const [isScheduleLocked, setIsScheduleLocked] = useState(false);
  const [showLockWarningModal, setShowLockWarningModal] = useState(false);
  const [editingFixture, setEditingFixture] = useState<DraftFixture | null>(null);
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [conflictsResolved, setConflictsResolved] = useState(false);

  // --- TAB 5: PRE-SEASON MEGAPHONE STATE ---
  const [announcementTitle, setAnnouncementTitle] = useState('');
  const [announcementBody, setAnnouncementBody] = useState('');
  const [selectedAudiences, setSelectedAudiences] = useState<string[]>(['All Dashboards']);
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('');

  const isDark = theme === 'dark';

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

  // --- TAB 1 HANDLERS ---
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

    const created: SeasonItem = {
      id: `s-${Date.now()}`,
      name: newSeasonName,
      startDate: newSeasonStart,
      endDate: newSeasonEnd,
      registrationCutoff: newSeasonCutoff,
      status: 'active',
      isLocked: false
    };

    await ApiService.createSeason(created);
    setSeasons([created, ...seasons]);
    setShowCreateSeasonModal(false);
    setNewSeasonName('');
    setNewSeasonStart('');
    setNewSeasonEnd('');
    setNewSeasonCutoff('');
    showToast('✅ Season created successfully!');
  };

  const handleToggleSeasonStatus = (id: string, newStatus: 'active' | 'inactive' | 'archived') => {
    setSeasons(seasons.map((s) => (s.id === id ? { ...s, status: newStatus } : s)));
    showToast(`Season status changed to ${newStatus}`);
  };

  const handleCreateLeague = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLeagueName) return;
    if (leagues.some((l) => l.name.toLowerCase() === newLeagueName.toLowerCase())) {
      showToast('⚠️ League with this name already exists.');
      return;
    }
    const created: LeagueItem = {
      id: `l-${Date.now()}`,
      name: newLeagueName,
      tier: newLeagueTier,
      maxTeams: newLeagueMaxTeams,
      currentTeamsCount: 0,
      status: 'Active',
      isArchived: false
    };
    await ApiService.createLeague(created);
    setLeagues([...leagues, created]);
    setShowCreateLeagueModal(false);
    setNewLeagueName('');
    showToast('✅ League created successfully!');
  };

  const handleToggleLeagueStatus = (id: string) => {
    setLeagues(leagues.map((l) => (l.id === id ? { ...l, status: l.status === 'Active' ? 'Inactive' : 'Active' } : l)));
    showToast('League status updated.');
  };

  const handleArchiveLeague = (id: string) => {
    setLeagues(leagues.map((l) => (l.id === id ? { ...l, isArchived: true } : l)));
    showToast('League archived.');
  };

  const handleDeleteLeague = (id: string) => {
    setLeagues(leagues.filter((l) => l.id !== id));
    showToast('League deleted.');
  };

  // --- TAB 2 HANDLERS (TEAM ONBOARDING) ---
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
    if (teams.some((t) => t.name.toLowerCase() === pt.name.toLowerCase() || t.code === pt.code)) {
      showToast(`⚠️ Team name or code already registered in active leagues.`);
      return;
    }

    await ApiService.approveTeam(pt.id, pt.requestedLeague, pt.division);

    const approvedTeam: TeamItem = {
      id: pt.id,
      name: pt.name,
      code: pt.code,
      league: pt.requestedLeague,
      coach: pt.coachName,
      captain: 'Assigned Captain',
      playerCount: pt.playerCount,
      maxRoster: 25,
      doctorStatus: pt.doctorAssigned ? 'Assigned' : 'Unassigned',
      hasCoach: true,
      hasCaptain: true
    };

    setTeams([...teams, approvedTeam]);
    setPendingTeams(pendingTeams.filter((t) => t.id !== pt.id));
    showToast(`✅ ${pt.name} approved & assigned to ${pt.requestedLeague.toUpperCase()} League!`);
  };

  const handleRejectTeam = async (id: string) => {
    if (!rejectionReason) {
      showToast('Please specify rejection reason.');
      return;
    }
    await ApiService.rejectTeam(id, rejectionReason);
    setPendingTeams(pendingTeams.filter((t) => t.id !== id));
    setRejectingTeamId(null);
    setRejectionReason('');
    showToast('Team registration rejected.');
  };

  // --- TAB 3 HANDLERS (REFEREE POOL) ---
  const handleAddReferee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRefName || !newRefPhone) return;
    const newRef: RefereeItem = {
      id: `r-${Date.now()}`,
      name: newRefName,
      phone: newRefPhone,
      email: newRefEmail,
      availability: 'Available',
      status: 'Active',
      experience: newRefExp,
      badgeLevel: newRefBadge,
      assignedMatchesCount: 0,
      seasonAssigned: true
    };
    setReferees([...referees, newRef]);
    setShowAddRefModal(false);
    setNewRefName('');
    setNewRefPhone('');
    setNewRefEmail('');
    showToast('✅ Referee added to pool.');
  };

  const handleToggleRefStatus = (id: string) => {
    setReferees(referees.map((r) => (r.id === id ? { ...r, status: r.status === 'Active' ? 'Deactivated' : 'Active' } : r)));
    showToast('Referee status updated.');
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
    showToast('⚡ Draft round-robin fixtures generated successfully!');
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
    setShowLockWarningModal(false);
    await ApiService.logAuditAction('LOCK_SEASON_SCHEDULE', 'seasons', 'season-2027', { locked_by: 'president' });
    showToast('🔒 Season Fixtures Confirmed & Locked! Switch portal to active season view.');
  };

  // --- TAB 5 HANDLERS (PRE-SEASON MEGAPHONE) ---
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementTitle || !announcementBody) {
      showToast('⚠️ Title and Body are required.');
      return;
    }
    const targetRole = selectedAudiences.join(', ').toLowerCase();
    await ApiService.createAnnouncement({
      title: announcementTitle,
      content: announcementBody,
      target_role: targetRole,
      author_id: 'president-1'
    });
    setAnnouncementTitle('');
    setAnnouncementBody('');
    showToast('📢 Pre-Season Announcement Broadcasted to selected audiences!');
  };

  const toggleAudience = (aud: string) => {
    if (aud === 'All Dashboards') {
      setSelectedAudiences(['All Dashboards']);
      return;
    }
    const filtered = selectedAudiences.filter((a) => a !== 'All Dashboards');
    if (filtered.includes(aud)) {
      const next = filtered.filter((a) => a !== aud);
      setSelectedAudiences(next.length === 0 ? ['All Dashboards'] : next);
    } else {
      setSelectedAudiences([...filtered, aud]);
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
    linesmanRule,
    setLinesmanRule,
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
    editingFixture,
    setEditingFixture,
    wizardStep,
    setWizardStep,
    conflictsResolved,
    announcementTitle,
    setAnnouncementTitle,
    announcementBody,
    setAnnouncementBody,
    selectedAudiences,
    isScheduled,
    setIsScheduled,
    scheduledTime,
    setScheduledTime,
    handleCreateSeason,
    handleToggleSeasonStatus,
    handleCreateLeague,
    handleToggleLeagueStatus,
    handleArchiveLeague,
    handleDeleteLeague,
    handleApproveTeam,
    handleRejectTeam,
    handleAddReferee,
    handleToggleRefStatus,
    handleGenerateFixtures,
    handleSwapTeams,
    handleUpdateFixtureDetails,
    handleLockSchedule,
    handleBroadcastAnnouncement,
    toggleAudience,
  };
};
