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
  if (cached) return cached;
  if (src) return src;
  return DEFAULT_TEAM_LOGO;
}

/** Crest image. Reads the permanent cache first and lazy-loads only on a miss. */
export const TeamCrest: React.FC<TeamCrestProps> = ({ teamId, src, alt = '', className, version }) => {
  const [logo, setLogo] = useState(() => resolveCrest(teamId, src));

  useEffect(() => {
    if (teamId && src) {
      writeCachedAsset(teamId, src, version);
    }
    setLogo(resolveCrest(teamId, src));
    if (teamId && needsAssetFetch(teamId, version)) {
      prioritizeTeamLogo(teamId, version);
    }
    return subscribeTeamLogos((changedId) => {
      if (changedId && changedId !== teamId) return;
      setLogo(resolveCrest(teamId, src));
    });
  }, [teamId, src, version]);

  return (
    <img
      src={logo}
      alt={alt}
      className={className}
      loading="lazy"
      decoding="async"
      onError={(e) => {
        if (e.currentTarget.src !== DEFAULT_TEAM_LOGO) {
          e.currentTarget.src = DEFAULT_TEAM_LOGO;
        }
      }}
    />
  );
};
