import React, { useState, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface BackToTopButtonProps {
  theme?: 'dark' | 'light';
}

export const BackToTopButton: React.FC<BackToTopButtonProps> = ({ theme = 'dark' }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show button when scrolled 350px away from the top
      if (window.scrollY > 350) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label="Back to top"
      className={`fixed bottom-18 sm:bottom-6 right-4 sm:right-6 z-40 p-2.5 sm:p-3 rounded-full shadow-xl transition-all duration-300 cursor-pointer ${
        isVisible
          ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto'
          : 'opacity-0 translate-y-4 scale-90 pointer-events-none'
      } bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/50 shadow-blue-900/40 active:scale-95 group`}
    >
      <ArrowUp className="w-5 h-5 stroke-[2.5] transition-transform group-hover:-translate-y-0.5 text-white" />
    </button>
  );
};
