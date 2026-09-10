import React from 'react';
import { TeamSquadView } from '../../Dashboards/Team/components/Squad/TeamSquadView';
import type { Player } from '../../Dashboards/Team/types';

interface TeamSquadTabProps {
  teamId: string;
  roster: Player[];
  teamName?: string;
  teamCrest?: string;
  onNavigateBack: () => void;
}

export const TeamSquadTab: React.FC<TeamSquadTabProps> = ({
  teamId,
  roster,
  teamName,
  teamCrest,
  onNavigateBack,
}) => {
  return (
    <div className="fixed inset-0 z-[9999] w-screen h-screen overflow-hidden bg-[#030716] select-none touch-none">
      <TeamSquadView
        currentRole="GUEST"
        teamId={teamId}
        roster={roster}
        teamName={teamName}
        teamCrest={teamCrest}
        onNavigateBack={onNavigateBack}
        onShowToast={() => {}}
      />
    </div>
  );
};

export default TeamSquadTab;
