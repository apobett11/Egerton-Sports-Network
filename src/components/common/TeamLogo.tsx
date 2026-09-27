import React from 'react';
import { TeamCrest } from './TeamCrest';

interface TeamLogoProps {
  teamId?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
  version?: string;
}

/** Shared crest. Delegates to the permanent asset cache. */
export const TeamLogo: React.FC<TeamLogoProps> = (props) => {
  return <TeamCrest {...props} />;
};
