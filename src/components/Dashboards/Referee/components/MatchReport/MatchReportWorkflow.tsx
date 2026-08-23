import React from 'react';
import type { Match } from '../../../../../types';
import type { PlayerLookupItem, RefereeTab } from '../../types';
import { RefereeReconciliationWorkflow } from '../Reconciliation/RefereeReconciliationWorkflow';

interface MatchReportWorkflowProps {
  selectedFixture: Match | null;
  homeLineup: PlayerLookupItem[];
  awayLineup: PlayerLookupItem[];
  isSubmitting?: boolean;
  onSubmitReport?: (reportData: any) => Promise<void>;
  setActiveTab: (tab: RefereeTab) => void;
}

export const MatchReportWorkflow: React.FC<MatchReportWorkflowProps> = ({
  selectedFixture,
  homeLineup,
  awayLineup,
  setActiveTab,
}) => {
  return (
    <RefereeReconciliationWorkflow
      selectedFixture={selectedFixture}
      homeLineup={homeLineup}
      awayLineup={awayLineup}
      setActiveTab={setActiveTab}
    />
  );
};

export default MatchReportWorkflow;
