import React, { useEffect, useState } from 'react';
import { needsAssetFetch, readCachedAsset, writeCachedAsset } from '../../lib/cache/assetCache';
import {
  DEFAULT_TEAM_LOGO,
  peekTeamLogo,
  prioritizeTeamLogo,
  subscribeTeamLogos,
} from '../../lib/teamLogoCache';

interface TeamCrestProps {
  teamId?: string | null;
  src?: string | null;
  alt?: string;
  className?: string;
  /** Pass a new token only when the crest file itself has been replaced. */
  version?: string;
}

function resolveCrest(teamId?: string | null, src?: string | null): string {
  const cached = (teamId && readCachedAsset(teamId)) || peekTeamLogo(teamId);
  if (cached && !cached.startsWith('data:')) return cached;
  if (src && !src.startsWith('data:')) return src;
  return DEFAULT_TEAM_LOGO;
}

/** Crest image. Reads the permanent cache first and lazy-loads only on a miss. */
export const TeamCrest: React.FC<TeamCrestProps> = ({ teamId, src, alt = '', className, version }) => {
  const [logo, setLogo] = useState(() => resolveCrest(teamId, src));

  useEffect(() => {
    if (teamId && src && !src.startsWith('data:')) {
      writeCachedAsset(teamId, src, version);
    }
    setLogo(resolveCrest(teamId, src));
    if (teamId && needsAssetFetch(teamId, version)) {
      prioritizeTeamLogo(teamId, version);
    }
    return subscribeTeamLogos(() => setLogo(resolveCrest(teamId, src)));
  }, [teamId, src, version]);

  return <img src={logo} alt={alt} className={className} loading="lazy" decoding="async" />;
};
