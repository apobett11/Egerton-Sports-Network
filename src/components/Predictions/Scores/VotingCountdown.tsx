import React, { useEffect, useState } from 'react';
import { describeVotingWindow } from '../../../lib/predictions/votingWindow';
import type { Match } from '../../../types/predictions';

interface VotingCountdownProps {
  matches: Match[];
  deviceBound: boolean;
}

export const VotingCountdown: React.FC<VotingCountdownProps> = ({ matches, deviceBound }) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const view = describeVotingWindow(matches, now);
  if (!view.label) return null;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 px-1">
      <p className={`text-sm font-black tracking-tight ${view.urgent ? 'text-[#ff0046]' : 'text-white'}`}>
        {view.label}
      </p>
      {!deviceBound && (
        <p className="text-[11px] text-slate-400">
          Open this page from the livescore app to lock this phone.
        </p>
      )}
    </div>
  );
};
