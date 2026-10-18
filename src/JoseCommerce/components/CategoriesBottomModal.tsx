import React from 'react';
import { 
  X, 
  LayoutGrid, 
  ChevronRight,
  Dumbbell,
  Wind,
  Shirt,
  Shield,
  Footprints,
  Flag,
  Layers
} from 'lucide-react';
import { Category } from '../types';
import { CATEGORIES } from '../data/categories';

interface CategoriesBottomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (slug: string) => void;
  categories?: Category[];
  theme?: 'dark' | 'light';
}

export const CategoriesBottomModal: React.FC<CategoriesBottomModalProps> = ({
  isOpen,
  onClose,
  onSelectCategory,
  categories = CATEGORIES,
  theme = 'dark',
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';

  const getCategoryIcon = (slug: string) => {
    switch (slug) {
      case 'fitness-and-training':
        return Dumbbell;
      case 'pitch-training':
        return Wind;
      case 'kit':
        return Shirt;
      case 'goalkeepers':
        return Shield;
      case 'boots-and-balls':
        return Footprints;
      case 'officiating':
        return Flag;
      default:
        return Layers;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 pb-16 sm:p-4 bg-black/75 backdrop-blur-sm animate-bottom-backdrop">
      {/* Backdrop: Clicking outside closes */}
      <div 
        className="fixed inset-0" 
        onClick={onClose} 
      />

      {/* Bottom Popup Dialog: Categories in cards with very little spacing between them */}
      <div 
        className={`relative w-full max-w-lg rounded-2xl p-4 sm:p-5 shadow-2xl border transition-all duration-300 z-10 animate-bottom-sheet max-h-[82vh] flex flex-col mb-1 sm:mb-0 ${
          isDark 
            ? 'bg-[#0f1d2e] border-slate-700 text-white shadow-black/80' 
            : 'bg-white border-slate-200 text-slate-900 shadow-slate-300'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Pill */}
        <div className="w-12 h-1.5 rounded-full bg-slate-500/40 mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/60 mb-3">
          <div className="flex items-center gap-2.5">
            <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 border border-blue-500/30 font-bold">
              <LayoutGrid className="w-4 h-4" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-black uppercase tracking-wider">
                Store Categories
              </h3>
              <p className="text-[11px] text-slate-400">
                Tap any category to browse official gear
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500'
            }`}
            aria-label="Close categories modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* CARDS GRID WITH VERY LITTLE SPACING BETWEEN THEM */}
        <div className="flex-grow overflow-y-auto pr-0.5">
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {categories.map((category) => {
              const Icon = getCategoryIcon(category.slug);

              return (
                <button
                  key={category.slug}
                  type="button"
                  onClick={() => {
                    onClose();
                    onSelectCategory(category.slug);
                  }}
                  className={`group relative overflow-hidden rounded-xl border p-2.5 sm:p-3 transition-all duration-200 touch-spring text-left cursor-pointer flex flex-col justify-between h-24 sm:h-28 active:scale-[0.98] ${
                    isDark
                      ? 'bg-[#14263b] hover:bg-[#1b3450] border-slate-700/80 hover:border-blue-500/60'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {/* Subtle Background Image Overlay */}
                  {category.imageUrl && (
                    <div 
                      className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity bg-cover bg-center"
                      style={{ backgroundImage: `url(${category.imageUrl})` }}
                    />
                  )}

                  <div className="relative z-10 flex items-start justify-between">
                    <span className="w-8 h-8 rounded-lg bg-blue-600/15 text-blue-400 border border-blue-500/20 flex items-center justify-center font-bold">
                      <Icon className="w-4 h-4" />
                    </span>
                    {category.count > 0 && (
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-slate-800/80 text-slate-300 border border-slate-700/60">
                        {category.count}
                      </span>
                    )}
                  </div>

                  <div className="relative z-10">
                    <h4 className="text-xs font-black truncate leading-tight group-hover:text-blue-400 transition-colors">
                      {category.name}
                    </h4>
                    <p className="text-[9px] text-slate-400 truncate mt-0.5 font-medium">
                      {category.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
