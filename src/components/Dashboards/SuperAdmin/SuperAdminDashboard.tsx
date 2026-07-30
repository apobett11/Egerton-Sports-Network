import React from 'react';
import { useSuperAdmin } from './hooks/useSuperAdmin';
import { SuperAdminHeader } from './components/Header/SuperAdminHeader';
import { AnalyticsCharts } from './components/Charts/AnalyticsCharts';
import { DatabaseHealthWidget } from './components/Database/DatabaseHealthWidget';
import { JournalistManagementWidget } from './components/Journalists/JournalistManagementWidget';

export const SuperAdminDashboard: React.FC = () => {
  const {
    journalists,
    queries,
    isScanningAdvisor,
    trafficSpikeActive,
    setTrafficSpikeActive,
    totalDAU,
    avgSessionTime,
    dreamTeamCompletionRate,
    readLatency,
    writeLatency,
    flaggedQueriesCount,
    disputedJournalistsCount,
    toggleDispute,
    applyIndexOptimization,
    runIndexAdvisorScan,
  } = useSuperAdmin();

  return (
    <div className="w-full min-h-screen bg-[#111111] text-gray-100 p-4 md:p-8 font-sans transition-colors">
      <div className="max-w-7xl mx-auto space-y-6">
        <SuperAdminHeader
          trafficSpikeActive={trafficSpikeActive}
          setTrafficSpikeActive={setTrafficSpikeActive}
          isScanningAdvisor={isScanningAdvisor}
          runIndexAdvisorScan={runIndexAdvisorScan}
          totalDAU={totalDAU}
          avgSessionTime={avgSessionTime}
          dreamTeamCompletionRate={dreamTeamCompletionRate}
          flaggedQueriesCount={flaggedQueriesCount}
        />

        <AnalyticsCharts />

        <DatabaseHealthWidget
          queries={queries}
          flaggedQueriesCount={flaggedQueriesCount}
          readLatency={readLatency}
          writeLatency={writeLatency}
          applyIndexOptimization={applyIndexOptimization}
        />

        <JournalistManagementWidget
          journalists={journalists}
          disputedJournalistsCount={disputedJournalistsCount}
          toggleDispute={toggleDispute}
        />
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
