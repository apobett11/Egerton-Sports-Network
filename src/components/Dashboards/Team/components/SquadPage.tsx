import React from 'react';
import { UserRole } from '../types';
import { TeamSquadView } from './Squad/TeamSquadView';

interface SquadPageProps {
  currentRole?: UserRole;
  showToast?: (msg: string) => void;
  onNavigateBack?: () => void;
}

export const SquadPage: React.FC<SquadPageProps> = ({
  currentRole = 'COACH',
  showToast,
  onNavigateBack,
}) => {
  return (
    <TeamSquadView
      currentRole={currentRole}
      onNavigateBack={onNavigateBack}
      onShowToast={showToast}
    />
  );
};

export default SquadPage;
