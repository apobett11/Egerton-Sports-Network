import { supabase } from '../../lib/supabase';
import type {
  OperationalMatch,
  SeasonReferee,
  SeasonPitch,
  SeasonTeam,
  PitchAvailabilityMode,
  RefereeEligibility,
  FriendlyMatchPayload,
  FriendlyConflictResult,
  OperationalAlert,
} from '../types/seasonMode';
import { COMPETITIONS } from '../constants/seasonConstants';

export const seasonOperationsService = {
  /**
   * ALGORITHM 2 BOUNDARY: Matchday Progression & Operations
   */
  calculateMatchdayProgress(matchdayNumber: number, fixtures: OperationalMatch[]) {
    const mdFixtures = fixtures.filter((f) => f.matchday === matchdayNumber);
    const total = mdFixtures.length;
    const played = mdFixtures.filter((f) => f.status === 'FT').length;
    const remaining = mdFixtures.filter((f) => f.status === 'UPCOMING' || f.status === 'LIVE' || f.status === 'HT').length;
    const cancelled = mdFixtures.filter((f) => f.status === 'CANCELLED').length;
    const postponed = mdFixtures.filter((f) => f.status === 'POSTPONED').length;
    const completionPercentage = total > 0 ? Math.round((played / total) * 100) : 0;

    const eplFixtures = mdFixtures.filter((f) => f.competition_id === COMPETITIONS.PREMIER_LEAGUE.id);
    const champFixtures = mdFixtures.filter((f) => f.competition_id === COMPETITIONS.CHAMPIONSHIP.id);

    const eplPlayed = eplFixtures.filter((f) => f.status === 'FT').length;
    const champPlayed = champFixtures.filter((f) => f.status === 'FT').length;

    const eplProgress = eplFixtures.length > 0 ? Math.round((eplPlayed / eplFixtures.length) * 100) : 0;
    const champProgress = champFixtures.length > 0 ? Math.round((champPlayed / champFixtures.length) * 100) : 0;

    return {
      matchdayNumber,
      total,
      played,
      remaining,
      cancelled,
      postponed,
      completionPercentage,
      eplFixturesCount: eplFixtures.length,
      eplPlayed,
      eplProgress,
      champFixturesCount: champFixtures.length,
      champPlayed,
      champProgress,
    };
  },

  /**
   * Cancel an entire matchday operationally
   */
  async cancelMatchday(
    matchdayNumber: number,
    fixtures: OperationalMatch[],
    reason: string
  ): Promise<{ success: boolean; updatedFixtures: OperationalMatch[]; error: string | null }> {
    try {
      const affectedIds = fixtures.filter((f) => f.matchday === matchdayNumber && f.status !== 'FT').map((f) => f.id);

      if (affectedIds.length === 0) {
        return { success: false, updatedFixtures: fixtures, error: 'No active or upcoming matches found for this matchday.' };
      }

      const { error } = await supabase
        .from('fixtures')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .in('id', affectedIds);

      if (error) {
        console.warn('DB update failed, applying in-memory operational state update:', error.message);
      }

      const updatedFixtures = fixtures.map((f) => {
        if (f.matchday === matchdayNumber && f.status !== 'FT') {
          return { ...f, status: 'CANCELLED' as const, cancellation_reason: reason };
        }
        return f;
      });

      // Log audit
      await supabase.from('audit_logs').insert([
        {
          action: 'MATCHDAY_CANCELLED',
          resource_type: 'matchdays',
          resource_id: `MATCHDAY-${matchdayNumber}`,
          details: { matchday: matchdayNumber, reason, affected_matches_count: affectedIds.length },
        },
      ]);

      return { success: true, updatedFixtures, error: null };
    } catch (err: any) {
      return { success: false, updatedFixtures: fixtures, error: err.message || 'Failed to cancel matchday' };
    }
  },

  /**
   * ALGORITHM 4 BOUNDARY: Referee Allocation & Eligibility Filter
   * Evaluates available referees for a specific match.
   */
  getEligibleRefereesForSwap(
    match: OperationalMatch,
    allReferees: SeasonReferee[],
    allFixtures: OperationalMatch[]
  ): RefereeEligibility[] {
    const matchDateStr = match.scheduled_time ? match.scheduled_time.split('T')[0] : '';
    const isEpl = match.competition_id === COMPETITIONS.PREMIER_LEAGUE.id;

    return allReferees.map((ref) => {
      const rejection_reasons: string[] = [];
      let is_eligible = true;

      // 1. Availability check
      if (ref.status !== 'Active') {
        is_eligible = false;
        rejection_reasons.push(`Referee status is ${ref.status}`);
      }

      // 2. Schedule conflict check on the same date/time
      const assignmentsOnDate = allFixtures.filter(
        (f) => f.referee_id === ref.id && f.scheduled_time?.startsWith(matchDateStr) && f.id !== match.id && f.status !== 'CANCELLED'
      );
      const sameTimeConflict = assignmentsOnDate.find((f) => f.scheduled_time === match.scheduled_time);

      if (sameTimeConflict) {
        is_eligible = false;
        rejection_reasons.push('Assigned to another match at the exact same scheduled time');
      }

      // 3. Tier match check
      let tier_match = true;
      if (ref.tier === 'EPL_Exclusive' && !isEpl) {
        tier_match = false;
        is_eligible = false;
        rejection_reasons.push('EPL Exclusive referee cannot officiate Championship matches');
      } else if (ref.tier === 'Championship' && isEpl) {
        tier_match = false;
        is_eligible = false;
        rejection_reasons.push('Championship referee pool cannot officiate EPL matches without Presidential override');
      }

      // 4. Fatigue status warning
      const current_assignments_today = assignmentsOnDate.length;
      const fatigue_warning = current_assignments_today >= 2;
      if (current_assignments_today >= 3) {
        is_eligible = false;
        rejection_reasons.push('Maximum daily match allocation limit reached (3 matches)');
      }

      return {
        referee: ref,
        is_eligible,
        rejection_reasons,
        fatigue_warning,
        tier_match,
        current_assignments_today,
      };
    });
  },

  /**
   * Swap referee for a match
   */
  async swapReferee(
    matchId: string,
    newRefereeId: string,
    fixtures: OperationalMatch[],
    referees: SeasonReferee[]
  ): Promise<{ success: boolean; updatedFixtures: OperationalMatch[]; error: string | null }> {
    try {
      const match = fixtures.find((f) => f.id === matchId);
      if (!match) return { success: false, updatedFixtures: fixtures, error: 'Match not found' };

      const newRef = referees.find((r) => r.id === newRefereeId);
      if (!newRef) return { success: false, updatedFixtures: fixtures, error: 'Selected referee not found' };

      const { error } = await supabase
        .from('fixtures')
        .update({ referee_id: newRefereeId, updated_at: new Date().toISOString() })
        .eq('id', matchId);

      if (error) {
        console.warn('DB referee update warning:', error.message);
      }

      const updatedFixtures = fixtures.map((f) => {
        if (f.id === matchId) {
          return {
            ...f,
            referee_id: newRefereeId,
            referee: newRef,
          };
        }
        return f;
      });

      await supabase.from('audit_logs').insert([
        {
          action: 'REFEREE_SWAPPED',
          resource_type: 'fixtures',
          resource_id: matchId,
          details: { match_id: matchId, previous_referee_id: match.referee_id, new_referee_id: newRefereeId },
        },
      ]);

      return { success: true, updatedFixtures, error: null };
    } catch (err: any) {
      return { success: false, updatedFixtures: fixtures, error: err.message || 'Failed to swap referee' };
    }
  },

  /**
   * ALGORITHM 3 BOUNDARY: Pitch Allocation & Availability Control
   */
  async updatePitchAvailability(
    pitchId: string,
    mode: PitchAvailabilityMode,
    pitches: SeasonPitch[],
    fixtures: OperationalMatch[]
  ): Promise<{ success: boolean; updatedPitches: SeasonPitch[]; affectedMatches: OperationalMatch[]; error: string | null }> {
    try {
      const targetPitch = pitches.find((p) => p.id === pitchId);
      if (!targetPitch) return { success: false, updatedPitches: pitches, affectedMatches: [], error: 'Pitch not found' };

      // Find affected upcoming matches on this pitch
      const affectedMatches = fixtures.filter(
        (f) => (f.venue === targetPitch.name || f.venue === targetPitch.short_code) && (f.status === 'UPCOMING' || f.status === 'LIVE')
      );

      const dbStatus = mode === 'Unavailable' ? 'Unavailable' : mode === 'Morning only' || mode === 'Afternoon only' ? 'Occupied' : 'Available';

      const { error } = await supabase
        .from('pitches')
        .update({ status: dbStatus, updated_at: new Date().toISOString() })
        .eq('id', pitchId);

      if (error) console.warn('Pitch DB status update warning:', error.message);

      const updatedPitches = pitches.map((p) => (p.id === pitchId ? { ...p, status: dbStatus as any } : p));

      await supabase.from('audit_logs').insert([
        {
          action: 'PITCH_AVAILABILITY_CHANGED',
          resource_type: 'pitches',
          resource_id: pitchId,
          details: { pitch_name: targetPitch.name, new_mode: mode, affected_matches_count: affectedMatches.length },
        },
      ]);

      return { success: true, updatedPitches, affectedMatches, error: null };
    } catch (err: any) {
      return { success: false, updatedPitches: pitches, affectedMatches: [], error: err.message || 'Failed to update pitch availability' };
    }
  },

  /**
   * ALGORITHM 5 BOUNDARY: Linesman Allocation & Default Flagging
   */
  async flagLinesmanDefault(
    matchId: string,
    linesmanTeam: 1 | 2,
    fixtures: OperationalMatch[]
  ): Promise<{ success: boolean; updatedFixtures: OperationalMatch[]; error: string | null }> {
    try {
      const match = fixtures.find((f) => f.id === matchId);
      if (!match) return { success: false, updatedFixtures: fixtures, error: 'Match not found' };

      const currentLinesmen = match.linesmen || {
        linesman_team1_name: match.home_team?.short_name ? `${match.home_team.short_name} Linesman` : 'Home Team Linesman',
        linesman_team1_status: 'Assigned',
        linesman_team2_name: match.away_team?.short_name ? `${match.away_team.short_name} Linesman` : 'Away Team Linesman',
        linesman_team2_status: 'Assigned',
      };

      const updatedLinesmen = { ...currentLinesmen };
      if (linesmanTeam === 1) {
        updatedLinesmen.linesman_team1_status = 'Defaulted';
      } else {
        updatedLinesmen.linesman_team2_status = 'Defaulted';
      }

      const updatedFixtures = fixtures.map((f) => (f.id === matchId ? { ...f, linesmen: updatedLinesmen } : f));

      await supabase.from('audit_logs').insert([
        {
          action: 'LINESMAN_DEFAULT_FLAGGED',
          resource_type: 'fixtures',
          resource_id: matchId,
          details: { match_id: matchId, defaulted_team: linesmanTeam },
        },
      ]);

      return { success: true, updatedFixtures, error: null };
    } catch (err: any) {
      return { success: false, updatedFixtures: fixtures, error: err.message || 'Failed to flag linesman default' };
    }
  },

  /**
   * Shift match date / time / venue
   */
  async shiftMatch(
    matchId: string,
    newScheduledTime: string,
    newVenue: string | undefined,
    fixtures: OperationalMatch[]
  ): Promise<{ success: boolean; updatedFixtures: OperationalMatch[]; error: string | null }> {
    try {
      const match = fixtures.find((f) => f.id === matchId);
      if (!match) return { success: false, updatedFixtures: fixtures, error: 'Match not found' };

      const venueToUse = newVenue || match.venue;

      // Check conflict at new time & venue
      const conflict = fixtures.find(
        (f) => f.id !== matchId && f.scheduled_time === newScheduledTime && f.venue === venueToUse && f.status !== 'CANCELLED'
      );

      if (conflict) {
        return {
          success: false,
          updatedFixtures: fixtures,
          error: `Scheduling conflict: Another match (${conflict.home_team?.short_name || 'Team A'} vs ${conflict.away_team?.short_name || 'Team B'}) is already scheduled at ${newVenue} on ${newScheduledTime}.`,
        };
      }

      const { error } = await supabase
        .from('fixtures')
        .update({ scheduled_time: newScheduledTime, venue: venueToUse, updated_at: new Date().toISOString() })
        .eq('id', matchId);

      if (error) console.warn('Shift match DB warning:', error.message);

      const updatedFixtures = fixtures.map((f) => (f.id === matchId ? { ...f, scheduled_time: newScheduledTime, venue: venueToUse } : f));

      await supabase.from('audit_logs').insert([
        {
          action: 'MATCH_SHIFTED',
          resource_type: 'fixtures',
          resource_id: matchId,
          details: { match_id: matchId, previous_time: match.scheduled_time, new_time: newScheduledTime, venue: venueToUse },
        },
      ]);

      return { success: true, updatedFixtures, error: null };
    } catch (err: any) {
      return { success: false, updatedFixtures: fixtures, error: err.message || 'Failed to shift match' };
    }
  },

  /**
   * Cancel single match
   */
  async cancelMatch(
    matchId: string,
    reason: string,
    fixtures: OperationalMatch[]
  ): Promise<{ success: boolean; updatedFixtures: OperationalMatch[]; error: string | null }> {
    try {
      const { error } = await supabase
        .from('fixtures')
        .update({ status: 'CANCELLED', updated_at: new Date().toISOString() })
        .eq('id', matchId);

      if (error) console.warn('Cancel match DB warning:', error.message);

      const updatedFixtures = fixtures.map((f) => (f.id === matchId ? { ...f, status: 'CANCELLED' as const, cancellation_reason: reason } : f));

      await supabase.from('audit_logs').insert([
        {
          action: 'MATCH_CANCELLED',
          resource_type: 'fixtures',
          resource_id: matchId,
          details: { match_id: matchId, reason },
        },
      ]);

      return { success: true, updatedFixtures, error: null };
    } catch (err: any) {
      return { success: false, updatedFixtures: fixtures, error: err.message || 'Failed to cancel match' };
    }
  },

  /**
   * FRIENDLIES ENGINE & CONFLICT VALIDATION
   */
  validateFriendlyConflicts(
    payload: FriendlyMatchPayload,
    fixtures: OperationalMatch[],
    referees: SeasonReferee[],
    pitches: SeasonPitch[]
  ): FriendlyConflictResult {
    const scheduledDateTime = `${payload.date}T${payload.time}:00`;

    // 1. Team conflict
    const homeConflict = fixtures.find(
      (f) =>
        f.status !== 'CANCELLED' &&
        f.scheduled_time?.startsWith(payload.date) &&
        (f.home_team_id === payload.home_team_id || f.away_team_id === payload.home_team_id)
    );
    if (homeConflict) {
      return {
        has_conflict: true,
        team_conflict: `Home team is already scheduled for a match on ${payload.date}.`,
      };
    }

    const awayConflict = fixtures.find(
      (f) =>
        f.status !== 'CANCELLED' &&
        f.scheduled_time?.startsWith(payload.date) &&
        (f.home_team_id === payload.away_team_id || f.away_team_id === payload.away_team_id)
    );
    if (awayConflict) {
      return {
        has_conflict: true,
        team_conflict: `Away team is already scheduled for a match on ${payload.date}.`,
      };
    }

    // 2. Referee conflict
    const refConflict = fixtures.find(
      (f) => f.status !== 'CANCELLED' && f.referee_id === payload.referee_id && f.scheduled_time === scheduledDateTime
    );
    if (refConflict) {
      return {
        has_conflict: true,
        referee_conflict: `Selected referee is already assigned to a match at ${payload.time}.`,
      };
    }

    // 3. Pitch conflict
    const pitch = pitches.find((p) => p.id === payload.pitch_id);
    const pitchName = pitch?.name || 'Pitch';
    const pitchConflict = fixtures.find(
      (f) => f.status !== 'CANCELLED' && f.venue === pitchName && f.scheduled_time === scheduledDateTime
    );
    if (pitchConflict) {
      return {
        has_conflict: true,
        pitch_conflict: `${pitchName} is already booked for a match at ${payload.time}.`,
      };
    }

    return { has_conflict: false };
  },

  /**
   * Create friendly match and persist into Supabase database
   */
  async createFriendly(
    payload: FriendlyMatchPayload,
    teams: SeasonTeam[],
    referees: SeasonReferee[],
    pitches: SeasonPitch[]
  ): Promise<{ success: boolean; friendlyMatch?: OperationalMatch; error: string | null }> {
    const homeTeam = teams.find((t) => t.id === payload.home_team_id);
    const awayTeam = teams.find((t) => t.id === payload.away_team_id);
    const ref = referees.find((r) => r.id === payload.referee_id);
    const pitch = pitches.find((p) => p.id === payload.pitch_id);

    if (!homeTeam || !awayTeam) {
      return { success: false, error: 'Invalid home or away team selected for friendly.' };
    }

    const scheduled_time = `${payload.date}T${payload.time}:00`;
    const venue = pitch?.name || 'Egerton Main Stadium Pitch';
    const competition_id = homeTeam.competition_id || COMPETITIONS.PREMIER_LEAGUE.id;

    try {
      const { data: inserted, error } = await supabase
        .from('fixtures')
        .insert([
          {
            competition_id,
            home_team_id: payload.home_team_id,
            away_team_id: payload.away_team_id,
            scheduled_time,
            status: 'UPCOMING',
            venue,
            referee_id: payload.referee_id || null,
            matchday: 0,
          },
        ])
        .select()
        .single();

      if (error) {
        console.warn('Friendly fixture DB insert warning:', error.message);
      }

      const friendlyMatch: OperationalMatch = {
        id: inserted?.id || `friendly-${Date.now()}`,
        competition_id,
        home_team_id: payload.home_team_id,
        away_team_id: payload.away_team_id,
        scheduled_time,
        status: 'UPCOMING',
        score_home: 0,
        score_away: 0,
        venue,
        referee_id: payload.referee_id,
        matchday: 0,
        home_team: homeTeam,
        away_team: awayTeam,
        referee: ref,
        is_friendly: true,
        friendly_name: payload.friendly_name,
      };

      await supabase.from('audit_logs').insert([
        {
          action: 'CREATE_FRIENDLY_MATCH',
          resource_type: 'fixtures',
          resource_id: friendlyMatch.id,
          details: {
            friendly_name: payload.friendly_name,
            home_team: homeTeam.name,
            away_team: awayTeam.name,
            scheduled_time,
            venue,
          },
        },
      ]);

      return { success: true, friendlyMatch, error: null };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to create friendly match in database' };
    }
  },

  /**
   * Generate active operational alerts
   */
  generateOperationalAlerts(fixtures: OperationalMatch[], referees: SeasonReferee[], pitches: SeasonPitch[]): OperationalAlert[] {
    const alerts: OperationalAlert[] = [];

    // Cancelled matches alert
    const cancelledMatches = fixtures.filter((f) => f.status === 'CANCELLED');
    if (cancelledMatches.length > 0) {
      alerts.push({
        id: 'alert-cancelled',
        type: 'MATCH_CANCELLED',
        severity: 'high',
        title: `${cancelledMatches.length} Match(es) Cancelled`,
        description: 'Operationally cancelled fixtures requiring scheduling review.',
        timestamp: new Date().toISOString(),
      });
    }

    // Postponed matches
    const postponedMatches = fixtures.filter((f) => f.status === 'POSTPONED');
    if (postponedMatches.length > 0) {
      alerts.push({
        id: 'alert-postponed',
        type: 'MATCH_POSTPONED',
        severity: 'medium',
        title: `${postponedMatches.length} Match(es) Postponed`,
        description: 'Matches currently marked postponed needing reschedule date.',
        timestamp: new Date().toISOString(),
      });
    }

    // Unassigned referee alerts
    const unassignedCount = fixtures.filter((f) => f.status === 'UPCOMING' && !f.referee_id).length;
    if (unassignedCount > 0) {
      alerts.push({
        id: 'alert-unassigned-ref',
        type: 'UNASSIGNED_REFEREE',
        severity: 'medium',
        title: `${unassignedCount} Fixture(s) Missing Referee Assignment`,
        description: 'Upcoming matches require center referee assignment before matchday.',
        timestamp: new Date().toISOString(),
      });
    }

    // Unavailable pitches alert
    const unavailPitches = pitches.filter((p) => p.status === 'Unavailable');
    if (unavailPitches.length > 0) {
      alerts.push({
        id: 'alert-pitch-unavail',
        type: 'PITCH_UNAVAILABLE',
        severity: 'high',
        title: `${unavailPitches.length} Pitch(es) Marked Unavailable`,
        description: `Affected venue: ${unavailPitches.map((p) => p.short_code).join(', ')}.`,
        timestamp: new Date().toISOString(),
      });
    }

    // Linesman default alerts
    const defaultedLinesmenCount = fixtures.filter(
      (f) => f.linesmen?.linesman_team1_status === 'Defaulted' || f.linesmen?.linesman_team2_status === 'Defaulted'
    ).length;
    if (defaultedLinesmenCount > 0) {
      alerts.push({
        id: 'alert-linesman-default',
        type: 'LINESMAN_DEFAULT',
        severity: 'medium',
        title: `${defaultedLinesmenCount} Linesman Default(s) Flagged`,
        description: 'Team-provided linesmen flagged as defaulted.',
        timestamp: new Date().toISOString(),
      });
    }

    return alerts;
  },
};
