import React, { useEffect, useState } from 'react';

interface LandscapeGuardProps {
  children: React.ReactNode;
}

export const LandscapeGuard: React.FC<LandscapeGuardProps> = ({ children }) => {
  const [isPortrait, setIsPortrait] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerHeight > window.innerWidth && window.innerWidth <= 860;
  });

  useEffect(() => {
    const handleResize = () => {
      const isMobileDevice = window.innerWidth <= 860 || /Android|iPhone|iPad|iPod|webOS|Windows Phone/i.test(navigator.userAgent);
      const isVertical = window.innerHeight > window.innerWidth;
      setIsPortrait(isMobileDevice && isVertical);
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    // Attempt orientation lock if supported by the browser
    if (window.screen.orientation && 'lock' in window.screen.orientation) {
      (window.screen.orientation as any).lock('landscape').catch(() => {
        // Safe fallback if lock requires gesture
      });
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  return (
    <div
      style={
        isPortrait
          ? {
              position: 'fixed',
              top: 0,
              left: '100vw',
              width: '100vh',
              height: '100vw',
              transformOrigin: 'top left',
              transform: 'rotate(90deg)',
              overflow: 'hidden',
              zIndex: 99999,
            }
          : {
              position: 'fixed',
              inset: 0,
              width: '100vw',
              height: '100vh',
              transform: 'none',
              overflow: 'hidden',
              zIndex: 99999,
            }
      }
      className="bg-[#030716] select-none touch-none"
    >
      {children}
    </div>
  );
};

export default LandscapeGuard;
