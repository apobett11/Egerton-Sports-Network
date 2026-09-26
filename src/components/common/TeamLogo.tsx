import React, { useEffect, useState } from 'react';
import {
  DEFAULT_TEAM_LOGO,
  peekTeamLogo,
  prioritizeTeamLogo,
  subscribeTeamLogos,
} from '../../lib/teamLogoCache';

interface TeamLogoProps {
  teamId?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
}

function resolveLogo(teamId?: string | null, src?: string | null): string {
  const cached = peekTeamLogo(teamId);
  if (cached) return cached;
  if (src && !src.startsWith('data:')) return src;
  return DEFAULT_TEAM_LOGO;
}

/** Shared crest. Reads the permanent logo cache and fetches this team only when missing. */
export const TeamLogo: React.FC<TeamLogoProps> = ({ teamId, src, alt = '', className }) => {
  const [logo, setLogo] = useState(() => resolveLogo(teamId, src));

  useEffect(() => {
    setLogo(resolveLogo(teamId, src));
    if (teamId) prioritizeTeamLogo(teamId);
    return subscribeTeamLogos(() => setLogo(resolveLogo(teamId, src)));
  }, [teamId, src]);

  return <img src={logo} alt={alt} className={className} />;
};
