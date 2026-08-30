import React, { useEffect, useState } from 'react';
import { Smartphone, RotateCw, Maximize2 } from 'lucide-react';

export const LandscapeGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth <= 860 || /Android|iPhone|iPad|iPod|webOS|Windows Phone/i.test(navigator.userAgent);
      const isPortrait = window.innerHeight > window.innerWidth;
      
      // If mobile device and in portrait mode
      setIsMobilePortrait(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  const handleRequestOrientation = async () => {
    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
      if (window.screen.orientation && 'lock' in window.screen.orientation) {
        await (window.screen.orientation as any).lock('landscape');
      }
    } catch {
      // Browser might require manual rotation
    }
  };

  return (
    <>
      {/* Landscape Lock Overlay for Mobile in Portrait */}
      {isMobilePortrait && (
        <div className="fixed inset-0 z-50 bg-[#040817] flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in">
          {/* Glowing Animated Phone */}
          <div className="relative mb-8 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-[#0085ff]/20 animate-ping absolute" />
            <div className="w-24 h-24 rounded-full bg-[#0085ff]/30 flex items-center justify-center relative">
              <Smartphone className="w-12 h-12 text-[#00d2ff] animate-bounce" />
              <RotateCw className="w-6 h-6 text-[#e2f800] absolute -right-1 -top-1 animate-spin" />
            </div>
          </div>

          <h2 className="text-[22px] font-bold text-white mb-2 font-efootball-title tracking-wide">
            Rotate Device to Landscape
          </h2>
          <p className="text-[14px] text-gray-300 max-w-[280px] mb-8 leading-relaxed">
            Game Plan is designed for mobile in <span className="text-[#00d2ff] font-semibold">Landscape Mode</span>.
          </p>

          <button
            onClick={handleRequestOrientation}
            className="flex items-center gap-2 bg-gradient-to-r from-[#0085ff] to-[#0055d4] hover:from-[#0094ff] hover:to-[#0066ee] text-white px-6 py-3 rounded-full font-bold shadow-[0_4px_20px_rgba(0,133,255,0.5)] active:scale-95 transition-all text-[15px]"
          >
            <Maximize2 className="w-4 h-4" />
            <span>Enter Landscape View</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className={`w-full h-full ${isMobilePortrait ? 'hidden' : 'block'}`}>
        {children}
      </div>
    </>
  );
};
