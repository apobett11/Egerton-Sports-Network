import { useState, useMemo, useCallback } from 'react';
import type { Journalist, SupabaseSlowQuery } from '../types';
import { INITIAL_JOURNALISTS, INITIAL_QUERIES, DAU_WEEKLY_DATA } from '../constants';

export const useSuperAdmin = () => {
  const [journalists, setJournalists] = useState<Journalist[]>(INITIAL_JOURNALISTS);
  const [queries, setQueries] = useState<SupabaseSlowQuery[]>(INITIAL_QUERIES);
  const [isScanningAdvisor, setIsScanningAdvisor] = useState<boolean>(false);
  const [trafficSpikeActive, setTrafficSpikeActive] = useState<boolean>(false);

  // Derived metrics
  const totalDAU = useMemo(() => DAU_WEEKLY_DATA[DAU_WEEKLY_DATA.length - 2].dau, []);
  const avgSessionTime = useMemo(() => '14.8 mins', []);
  const dreamTeamCompletionRate = useMemo(() => '78.4%', []);

  const readLatency = useMemo(() => (trafficSpikeActive ? 28 : 12), [trafficSpikeActive]);
  const writeLatency = useMemo(() => (trafficSpikeActive ? 44 : 18), [trafficSpikeActive]);

  const flaggedQueriesCount = useMemo(
    () => queries.filter((q) => !q.isOptimized && q.durationMs > 50).length,
    [queries]
  );

  const disputedJournalistsCount = useMemo(
    () => journalists.filter((j) => j.isDisputed).length,
    [journalists]
  );

  const toggleDispute = useCallback((journalistId: string) => {
    setJournalists((prev) =>
      prev.map((j) => {
        if (j.id === journalistId) {
          const newStatus = !j.isDisputed;
          return {
            ...j,
            isDisputed: newStatus,
            disputedReason: newStatus ? 'Presidential editorial override' : undefined,
          };
        }
        return j;
      })
    );
  }, []);

  const applyIndexOptimization = useCallback((queryId: string) => {
    setQueries((prev) =>
      prev.map((q) => {
        if (q.id === queryId) {
          return {
            ...q,
            isOptimized: true,
            durationMs: Number((q.durationMs * 0.12).toFixed(1)),
          };
        }
        return q;
      })
    );
  }, []);

  const runIndexAdvisorScan = useCallback(() => {
    setIsScanningAdvisor(true);
    setTimeout(() => {
      setIsScanningAdvisor(false);
    }, 1200);
  }, []);

  return {
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
  };
};
