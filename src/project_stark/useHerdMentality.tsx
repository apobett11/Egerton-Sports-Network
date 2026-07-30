import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

export interface CampusLocationCount {
  location: string;
  viewers: number;
}

export interface MatchHerdStats {
  matchId: string;
  viewersCount: number;
  trend: 'UP' | 'DOWN' | 'STABLE';
  campusBreakdown: CampusLocationCount[];
  socialProofText: string;
}

export interface HerdMentalityContextType {
  totalCampusActiveUsers: number;
  getMatchStats: (matchId: string) => MatchHerdStats;
  getViewerBadgeText: (matchId: string) => string;
  isPeakTraffic: boolean;
}

const DEFAULT_MATCH_VIEWERS: Record<string, number> = {
  m1: 412, // Science FC vs Engineering FC
  m2: 289, // Medical School vs Education FC
  m3: 174, // Agriculture FC vs Arts United
  m4: 523, // Business FC vs Environmental FC
  m5: 340, // Science FC vs Medical School
};

const CAMPUS_LOCATIONS = [
  'Njoro Main Campus',
  'Science Complex',
  'Tatton Hall',
  'Kilimo Hall',
  'Engineering Labs',
  'Ruiru Hostel Quarter',
];

const HerdMentalityContext = createContext<HerdMentalityContextType | undefined>(undefined);

export const HerdMentalityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [matchViewers, setMatchViewers] = useState<Record<string, number>>(DEFAULT_MATCH_VIEWERS);
  const [totalCampusUsers, setTotalCampusUsers] = useState<number>(1482);
  const [trends, setTrends] = useState<Record<string, 'UP' | 'DOWN' | 'STABLE'>>({});

  // Simulate dynamic organic user fluctuations (every 3 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      setMatchViewers((prev) => {
        const next = { ...prev };
        const newTrends: Record<string, 'UP' | 'DOWN' | 'STABLE'> = {};

        Object.keys(next).forEach((matchId) => {
          // Delta between -5 and +8 students to simulate organic traffic surge
          const delta = Math.floor(Math.random() * 14) - 5;
          const updated = Math.max(45, next[matchId] + delta);
          next[matchId] = updated;

          if (delta > 2) newTrends[matchId] = 'UP';
          else if (delta < -2) newTrends[matchId] = 'DOWN';
          else newTrends[matchId] = 'STABLE';
        });

        setTrends(newTrends);
        return next;
      });

      // Fluctuate global campus concurrent counter
      setTotalCampusUsers((prev) => {
        const delta = Math.floor(Math.random() * 19) - 8;
        return Math.max(850, prev + delta);
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getMatchStats = useCallback(
    (matchId: string): MatchHerdStats => {
      const count = matchViewers[matchId] || 180;
      const trend = trends[matchId] || 'STABLE';

      // Distribute count realistically across Egerton campus hubs
      const breakdown: CampusLocationCount[] = [
        { location: CAMPUS_LOCATIONS[0], viewers: Math.floor(count * 0.42) },
        { location: CAMPUS_LOCATIONS[1], viewers: Math.floor(count * 0.25) },
        { location: CAMPUS_LOCATIONS[2], viewers: Math.floor(count * 0.18) },
        { location: CAMPUS_LOCATIONS[3], viewers: Math.floor(count * 0.15) },
      ];

      return {
        matchId,
        viewersCount: count,
        trend,
        campusBreakdown: breakdown,
        socialProofText: `🔥 ${count} students viewing this match in Njoro right now`,
      };
    },
    [matchViewers, trends]
  );

  const getViewerBadgeText = useCallback(
    (matchId: string): string => {
      const stats = getMatchStats(matchId);
      return stats.socialProofText;
    },
    [getMatchStats]
  );

  const isPeakTraffic = useMemo(() => totalCampusUsers > 1200, [totalCampusUsers]);

  const value = useMemo(
    () => ({
      totalCampusActiveUsers: totalCampusUsers,
      getMatchStats,
      getViewerBadgeText,
      isPeakTraffic,
    }),
    [totalCampusUsers, getMatchStats, getViewerBadgeText, isPeakTraffic]
  );

  return (
    <HerdMentalityContext.Provider value={value}>
      {children}
    </HerdMentalityContext.Provider>
  );
};

export function useHerdMentality(): HerdMentalityContextType {
  const context = useContext(HerdMentalityContext);
  if (!context) {
    // Fallback if hook is called outside provider
    return {
      totalCampusActiveUsers: 1482,
      getMatchStats: (matchId: string) => ({
        matchId,
        viewersCount: 412,
        trend: 'UP',
        campusBreakdown: [
          { location: 'Njoro Main Campus', viewers: 180 },
          { location: 'Science Complex', viewers: 120 },
        ],
        socialProofText: '🔥 412 students viewing this match in Njoro right now',
      }),
      getViewerBadgeText: () => '🔥 412 students viewing this match in Njoro right now',
      isPeakTraffic: true,
    };
  }
  return context;
}

export default useHerdMentality;
