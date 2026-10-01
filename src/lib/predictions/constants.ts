export const STORAGE_KEYS = {
  DEVICE_ID: 'egerscore_prediction_device_id',
  DEVICE_HANDLE: 'egerscore_prediction_handle',
  PREDICTIONS: 'egerscore_user_predictions_v1',
  UNLOCKED_DERBIES: 'egerscore_unlocked_derbies_v1',
  USER_REACTIONS: 'egerscore_user_reactions_v1',
  ACTIVE_TAB: 'egerscore_community_active_tab',
  FAVOURITE_TEAM: 'egerscore_favourite_team_v1',
};

export const BANTER_CONFIG = {
  MAX_POST_CHARS: 280,
  MAX_COMMENT_CHARS: 200,
  RATE_LIMIT_COOLDOWN_MS: 3000,
};

export const HANDLE_PREFIXES = [
  'Tatton Ultras',
  'Campus Oracle',
  'Ruiru Pundit',
  'East Stand',
  'The Touchline',
  'Main Terrace',
  'Kipchoge End',
  'Varsity Striker',
  'Midfield Maestro',
  'North Bank Fan',
  'Pavilion Pundit',
  'Press Box Eye'
];

export const IQ_STATUS_BANDS = {
  ELITE: {
    min: 85,
    max: 100,
    label: 'Elite Pundit' as const,
    badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
    description: 'Phenomenal football IQ. Reads the tactical game in sync with the community pulse.'
  },
  SHARP: {
    min: 65,
    max: 84,
    label: 'Sharp Tactical Read' as const,
    badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40',
    description: 'Disciplined tactical eye. Mixes sensible majority picks with calculated surprises.'
  },
  REBEL: {
    min: 0,
    max: 64,
    label: 'Dangerous Rebel Pick' as const,
    badgeColor: 'bg-[#ff0046]/20 text-[#ff0046] border-[#ff0046]/40',
    description: 'Fearless contrarian. Going head-to-head against crowd consensus.'
  },
  BUILDING: {
    min: 0,
    max: 0,
    label: 'Building Profile' as const,
    badgeColor: 'bg-slate-700/40 text-slate-400 border-slate-600/40',
    description: 'Lock in at least 3 matchday predictions to unlock your authoritative Matchday IQ.'
  }
};
