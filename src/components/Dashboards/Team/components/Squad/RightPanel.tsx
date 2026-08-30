import React from 'react';

interface RightPanelProps {
  collectiveStrength: number;
  onAutoPick: () => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const RightPanel: React.FC<RightPanelProps> = ({
  collectiveStrength,
  onAutoPick,
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
    <aside className="relative z-20 flex flex-col justify-between items-end h-full py-6 pr-6 pl-1 select-none pointer-events-auto flex-shrink-0">
      {/* Collective Strength Section matching screenshot WA0046 */}
      <div className="flex flex-col items-start text-left mt-2">
        <span className="text-[14.5px] font-normal text-[#8fa0b5] leading-tight font-sans">
          Collective
        </span>
        <span className="text-[14.5px] font-normal text-[#8fa0b5] leading-tight font-sans">
          Strength
        </span>
        <span className="font-efootball-num font-bold text-[46px] tracking-tight text-[#e6ff00] drop-shadow-[0_2px_10px_rgba(230,255,0,0.4)] mt-0.5 transition-all">
          {collectiveStrength}
        </span>
      </div>

      {/* Bottom Button: Auto-pick players matching WA0046 */}
      <div className="mb-2">
        <button
          onClick={handleAutoPickClick}
          className={`${
            isCoach 
              ? 'bg-[#181d28] hover:bg-[#202736] text-[#3b82f6] hover:text-[#60a5fa] cursor-pointer' 
              : 'bg-[#12161f] opacity-40 text-gray-500 cursor-not-allowed'
          } active:scale-95 border border-white/5 text-[13px] font-semibold px-4 py-2.5 rounded-[14px] shadow-lg transition-all flex flex-col items-center justify-center leading-tight focus:outline-none`}
        >
          <span>Auto-pick</span>
          <span>players</span>
        </button>
      </div>
    </aside>
  );
};
