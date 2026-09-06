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
  onSuccess?: () => void;
}

export const MatchReportWorkflow: React.FC<MatchReportWorkflowProps> = ({
  selectedFixture,
  homeLineup,
  awayLineup,
  setActiveTab,
  onSuccess,
}) => {
  return (
    <div className="w-full bg-[#081018] border border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs">
      <RefereeReconciliationWorkflow
        selectedFixture={selectedFixture}
        homeLineup={homeLineup}
        awayLineup={awayLineup}
        setActiveTab={setActiveTab}
        onSuccess={onSuccess}
      />
    </div>
  );
};

export default MatchReportWorkflow;
