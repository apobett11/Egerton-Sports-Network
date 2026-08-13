// Algorithm Integration Service Boundaries for President's Season Management Mode
// Serves as the formal contract between President UI actions and future backend scheduling/allocation engines.

import type {
  SeasonFixture,
  SeasonReferee,
  SeasonPitch,
  RefereeEligibility,
  PitchAvailabilityMode,
} from '../types/seasonMode';

export interface StandardAlgorithmResponse<T> {
  success: boolean;
  data?: T;
  error?: string | null;
  validationWarnings?: string[];
}

// Algorithm 2 Boundary — Calendar & Matchday Progression
export interface CalendarProgressionInput {
  current_date: string;
  is_offday: boolean;
  current_matchday: number;
  total_matches_played: number;
  total_matches_scheduled: number;
}

export interface CalendarProgressionResult {
  next_matchday: number;
  assigned_date: string;
  spillover_count: number;
  is_season_complete: boolean;
}

// Algorithm 3 Boundary — Pitch Allocation & Time Slotting
export interface PitchAllocationInput {
  pitch_id: string;
  proposed_mode: PitchAvailabilityMode;
  matchday: number;
  affected_date: string;
}

export interface PitchAllocationResult {
  pitch_id: string;
  updated_mode: PitchAvailabilityMode;
  rescheduled_fixture_ids: string[];
  conflict_warnings: string[];
}

// Algorithm 4 Boundary — Referee Allocation & Swap
export interface RefereeSwapInput {
  fixture_id: string;
  current_referee_id?: string | null;
  proposed_referee_id: string;
  match_time: string;
  competition_id: string;
}

export interface RefereeSwapResult {
  fixture_id: string;
  assigned_referee_id: string;
  referee_name: string;
  eligibility: RefereeEligibility;
}

// Algorithm 5 Boundary — Linesman Allocation
export interface LinesmanAllocationInput {
  fixture_id: string;
  team_responsible_id: string;
  flagged_default: boolean;
  reason?: string;
}

export interface LinesmanAllocationResult {
  fixture_id: string;
  team_id: string;
  linesman_status: 'Assigned' | 'Defaulted' | 'Replaced' | 'Pending';
  penalty_recorded: boolean;
}

export const algorithmIntegrationService = {
  /**
   * Algorithm 2 Contract: Matchday & Calendar Progression
   */
  async processCalendarProgression(
    input: CalendarProgressionInput
  ): Promise<StandardAlgorithmResponse<CalendarProgressionResult>> {
    // Contract placeholder for future backend algorithm
    try {
      return {
        success: true,
        data: {
          next_matchday: input.current_matchday + 1,
          assigned_date: input.current_date,
          spillover_count: 0,
          is_season_complete: false,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to process calendar progression',
      };
    }
  },

  /**
   * Algorithm 3 Contract: Pitch Allocation & Time Slotting
   */
  async updatePitchAvailability(
    input: PitchAllocationInput
  ): Promise<StandardAlgorithmResponse<PitchAllocationResult>> {
    try {
      return {
        success: true,
        data: {
          pitch_id: input.pitch_id,
          updated_mode: input.proposed_mode,
          rescheduled_fixture_ids: [],
          conflict_warnings: input.proposed_mode === 'Unavailable' 
            ? ['2 fixtures may need time slot re-assignment by scheduling engine'] 
            : [],
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to update pitch availability',
      };
    }
  },

  /**
   * Algorithm 4 Contract: Referee Allocation & Swap
   */
  async getEligibleRefereesForMatch(
    fixture: SeasonFixture,
    referees: SeasonReferee[]
  ): Promise<RefereeEligibility[]> {
    return referees.map((ref) => {
      const isUnavailable = ref.status === 'Unavailable' || ref.status === 'Deactivated' || ref.status === 'Suspended';
      const rejectionReasons: string[] = [];

      if (isUnavailable) {
        rejectionReasons.push(`Referee is marked as ${ref.status}`);
      }

      return {
        referee: ref,
        is_eligible: !isUnavailable,
        rejection_reasons: rejectionReasons,
        fatigue_warning: false,
        tier_match: true,
        current_assignments_today: 0,
      };
    });
  },

  async executeRefereeSwap(
    input: RefereeSwapInput
  ): Promise<StandardAlgorithmResponse<RefereeSwapResult>> {
    try {
      return {
        success: true,
        data: {
          fixture_id: input.fixture_id,
          assigned_referee_id: input.proposed_referee_id,
          referee_name: 'Assigned Referee',
          eligibility: {
            referee: {
              id: input.proposed_referee_id,
              name: 'Ref. Swapped',
              phone: 'N/A',
              status: 'Active',
            },
            is_eligible: true,
            rejection_reasons: [],
            tier_match: true,
            current_assignments_today: 1,
          },
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to execute referee swap',
      };
    }
  },

  /**
   * Algorithm 5 Contract: Linesman Allocation & Default Management
   */
  async flagLinesmanDefault(
    input: LinesmanAllocationInput
  ): Promise<StandardAlgorithmResponse<LinesmanAllocationResult>> {
    try {
      return {
        success: true,
        data: {
          fixture_id: input.fixture_id,
          team_id: input.team_responsible_id,
          linesman_status: input.flagged_default ? 'Defaulted' : 'Assigned',
          penalty_recorded: input.flagged_default,
        },
      };
    } catch (err: any) {
      return {
        success: false,
        error: err?.message || 'Failed to update linesman status',
      };
    }
  },
};
