import type { Team } from '../../types/predictions';

/**
 * Egerton Premier League clubs, copied from the livescore roster.
 * Static choices only: no database ids, no fixture join, no livescore logos.
 */
export const EPL_TEAMS: Team[] = [
  { id: 'epl-bcom', name: 'BCOM FC', shortName: 'BCM' },
  { id: 'epl-blue-blazers', name: 'Blue Blazers', shortName: 'BLU' },
  { id: 'epl-celtics', name: 'Celtics FC', shortName: 'CEL' },
  { id: 'epl-five-stars', name: 'Five Stars FC', shortName: 'FSF' },
  { id: 'epl-giants', name: 'Giants FC', shortName: 'GNT' },
  { id: 'epl-legends', name: 'Legends FC', shortName: 'LGD' },
  { id: 'epl-med', name: 'Med FC', shortName: 'MED' },
  { id: 'epl-mighty-blacks', name: 'Mighty Blacks', shortName: 'MBL' },
  { id: 'epl-rising-stars', name: 'Rising Stars', shortName: 'RST' },
  { id: 'epl-santos', name: 'Santos FC', shortName: 'SAN' },
  { id: 'epl-super-eagles', name: 'Super Eagles', shortName: 'SPE' },
  { id: 'epl-wazito', name: 'Wazito FC', shortName: 'WAZ' },
];
