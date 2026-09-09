import React from 'react';

interface RightPanelProps {
  collectiveStrength: number;
  onAutoPick: () => void;
  onSubmitLineup?: () => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  collectiveStrength,
  onAutoPick,
  onSubmitLineup,
  isCoach = true,
  onPermissionDenied,
}) => {
  const handleAutoPickClick = () => {
    if (!isCoach) {
      if (onPermissionDenied) {
        onPermissionDenied('Permission Denied: Only Head Coach can auto-optimize the squad.');
      }
      return;
    }
    onAutoPick();
  };

  return (
    <aside className="relative z-20 flex flex-col justify-between items-end h-full py-2.5 sm:py-4 pr-2 sm:pr-4 pl-1 select-none pointer-events-auto flex-shrink-0">
      {/* Collective Strength Section matching screenshot WA0046 with safe bounds */}
      <div className="flex flex-col items-start text-left mt-1">
        <span className="text-[12px] sm:text-[14px] font-normal text-[#8fa0b5] leading-tight font-sans">
          Collective
        </span>
        <span className="text-[12px] sm:text-[14px] font-normal text-[#8fa0b5] leading-tight font-sans">
          Strength
        </span>
        <span className="font-efootball-num font-bold text-[34px] sm:text-[42px] tracking-tight text-[#e6ff00] drop-shadow-[0_2px_10px_rgba(230,255,0,0.4)] mt-0.5 leading-none">
          {collectiveStrength}
        </span>
      </div>

      {/* Bottom Action Buttons: Submit Match Lineup + Auto-pick players */}
      <div className="flex flex-col gap-2 mb-1">
        {onSubmitLineup && (
          <button
            onClick={onSubmitLineup}
            id="btn-submit-match-lineup"
            className={`${
              isCoach
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white cursor-pointer shadow-emerald-950/40'
                : 'bg-[#12161f] opacity-40 text-gray-500 cursor-not-allowed'
            } active:scale-95 border border-emerald-400/40 text-[11px] sm:text-[12px] font-black px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-[12px] shadow-lg transition-all flex flex-col items-center justify-center leading-tight focus:outline-none`}
          >
            <span>Submit Match Lineup</span>
          </button>
        )}

        <button
          onClick={handleAutoPickClick}
          id="btn-autopick-players"
          className={`${
            isCoach 
              ? 'bg-[#181d28] hover:bg-[#202736] text-[#3b82f6] hover:text-[#60a5fa] cursor-pointer' 
              : 'bg-[#12161f] opacity-40 text-gray-500 cursor-not-allowed'
          } active:scale-95 border border-white/10 text-[11px] sm:text-[12px] font-semibold px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-[12px] shadow-lg transition-all flex flex-col items-center justify-center leading-tight focus:outline-none`}
        >
          <span>Auto-pick</span>
          <span>players</span>
        </button>
      </div>
    </aside>
  );
};
