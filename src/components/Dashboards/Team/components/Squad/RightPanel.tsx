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
      {/* Collective Strength Section */}
      <div className="flex flex-col items-start text-left mt-2">
        <span className="text-[15px] font-normal text-[#9ea8b6] leading-tight">
          Collective
        </span>
        <span className="text-[15px] font-normal text-[#9ea8b6] leading-tight">
          Strength
        </span>
        <span className="font-efootball-num font-bold text-[42px] tracking-tight text-[#e2f800] drop-shadow-[0_2px_8px_rgba(226,248,0,0.3)] mt-1 transition-all">
          {collectiveStrength}
        </span>
      </div>

      {/* Bottom Button: Auto-pick players */}
      <div className="mb-2">
        <button
          onClick={handleAutoPickClick}
          className={`${
            isCoach 
              ? 'bg-[#202530] hover:bg-[#282f3d] text-[#4392e6] hover:text-[#64a9f5] cursor-pointer' 
              : 'bg-[#181c24] opacity-50 text-gray-500 cursor-not-allowed'
          } active:scale-95 border border-white/5 text-[13.5px] font-semibold px-4 py-2.5 rounded-[14px] shadow-lg transition-all flex flex-col items-center justify-center leading-tight focus:outline-none`}
        >
          <span>Auto-pick</span>
          <span>players</span>
        </button>
      </div>
    </aside>
  );
};
