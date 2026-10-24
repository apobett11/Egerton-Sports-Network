import React, { useState } from 'react';
import { Plus, Feather, Image as ImageIcon, BarChart2, X } from 'lucide-react';

interface XFloatingComposeButtonProps {
  onSelectAction: (action: 'text' | 'media' | 'poll') => void;
}

export const XFloatingComposeButton: React.FC<XFloatingComposeButtonProps> = ({
  onSelectAction,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleAction = (action: 'text' | 'media' | 'poll') => {
    setIsOpen(false);
    onSelectAction(action);
  };

  return (
    <>
      {/* Backdrop for click dismiss */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-39 bg-black/60 backdrop-blur-xs md:hidden animate-fadeIn"
          data-testid="fab-backdrop"
        />
      )}

      {/* Floating Action Menu & Button Container */}
      <div className="fixed bottom-20 right-4 z-40 md:hidden flex flex-col items-end gap-2.5">
        {/* Animated Micro-Sheet / Popup Menu */}
        {isOpen && (
          <div className="flex flex-col gap-2 items-end mb-1 animate-slideUp">
            {/* Start Poll */}
            <button
              type="button"
              onClick={() => handleAction('poll')}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-white shadow-xl hover:bg-zinc-800 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-xs font-bold tracking-wide">Start Poll</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/20 text-sky-400">
                <BarChart2 className="h-4 w-4" />
              </div>
            </button>

            {/* Upload Media */}
            <button
              type="button"
              onClick={() => handleAction('media')}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-white shadow-xl hover:bg-zinc-800 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-xs font-bold tracking-wide">Add Photo / 15s Clip</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                <ImageIcon className="h-4 w-4" />
              </div>
            </button>

            {/* Write Take */}
            <button
              type="button"
              onClick={() => handleAction('text')}
              className="flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-zinc-900 border border-zinc-700/80 text-white shadow-xl hover:bg-zinc-800 transition-transform active:scale-95 cursor-pointer"
            >
              <span className="text-xs font-bold tracking-wide">Write Take</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500 text-white">
                <Feather className="h-4 w-4" />
              </div>
            </button>
          </div>
        )}

        {/* Main Floating Trigger Button */}
        <button
          type="button"
          aria-label={isOpen ? 'Close menu' : 'Create post'}
          onClick={() => setIsOpen(prev => !prev)}
          className={`flex h-14 w-14 items-center justify-center rounded-full bg-sky-500 text-white shadow-2xl transition-all duration-200 active:scale-90 cursor-pointer hover:bg-sky-400 focus:outline-none focus:ring-4 focus:ring-sky-500/30 ${
            isOpen ? 'rotate-45 bg-zinc-800 text-zinc-300' : 'hover:scale-105'
          }`}
        >
          <Plus className="h-7 w-7 transition-transform" />
        </button>
      </div>
    </>
  );
};
