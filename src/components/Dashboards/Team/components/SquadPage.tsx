import React from 'react';
import { UserRole, Player } from '../types';
import { TeamSquadView } from './Squad/TeamSquadView';

interface SquadPageProps {
  currentRole?: UserRole;
  teamId?: string;
  roster?: Player[];
  teamName?: string;
  teamCrest?: string;
  activeFixtureId?: string;
  showToast?: (msg: string) => void;
  onNavigateBack?: () => void;
  onSaveMatchLineup?: (fixtureId?: string, startingXI?: any[], subs?: any[], formation?: string, capId?: string) => Promise<any>;
}

export const SquadPage: React.FC<SquadPageProps> = ({
  currentRole = 'COACH',
  teamId,
  roster,
  teamName,
  teamCrest,
  activeFixtureId,
  showToast,
  onNavigateBack,
  onSaveMatchLineup,
}) => {
  return (
    <TeamSquadView
      currentRole={currentRole}
      teamId={teamId}
      roster={roster}
      teamName={teamName}
      teamCrest={teamCrest}
      activeFixtureId={activeFixtureId}
      onNavigateBack={onNavigateBack}
      onShowToast={showToast}
      onSaveMatchLineup={onSaveMatchLineup}
    />
  );
};

export default SquadPage;
