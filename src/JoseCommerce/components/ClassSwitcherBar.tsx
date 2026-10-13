import React from 'react';
import { Layers, Users, User, Trophy, ShieldCheck, HeartPulse, Sparkles } from 'lucide-react';
import { PRODUCT_CLASSES } from '../services/productIdService';

interface ClassSwitcherBarProps {
  selectedClass: string; // 'all' | 'T' | 'P' | 'F' | 'C' | 'E'
  onSelectClass: (classCode: string) => void;
  productCounts?: Record<string, number>;
  totalProductsCount: number;
  theme?: 'dark' | 'light';
}

export const ClassSwitcherBar: React.FC<ClassSwitcherBarProps> = ({
  selectedClass,
  onSelectClass,
  productCounts = {},
  totalProductsCount,
  theme = 'dark',
}) => {
  const isDark = theme === 'dark';

  const getClassIcon = (code: string) => {
    switch (code) {
      case 'I':
      case 'individual':
        return <User className="w-3.5 h-3.5" />;
      case 'T':
      case 'team':
        return <Users className="w-3.5 h-3.5" />;
      case 'C':
      case 'coaching':
        return <ShieldCheck className="w-3.5 h-3.5" />;
      case 'O':
      case 'officiation':
        return <Trophy className="w-3.5 h-3.5" />;
      default:
        return <Layers className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div
      className={`w-full border-b transition-colors select-none ${
        isDark
          ? 'bg-[#102235] border-[#224466] text-slate-200'
          : 'bg-white border-slate-200 text-slate-800 shadow-2xs'
      }`}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          {/* Label indicating Universal Page Class Switcher */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center justify-center w-6 h-6 rounded-md bg-[#ff0046]/15 text-[#ff0046]">
              <Layers className="w-3.5 h-3.5" />
            </span>
            <div className="flex flex-col">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-300">
                Universal Page Class
              </span>
              <span className="text-[9px] text-slate-400 font-medium">
                {selectedClass === 'all'
                  ? 'Showing all inventory across all categories'
                  : `Filtered exclusively to Class ${selectedClass} across page`}
              </span>
            </div>
          </div>

          {/* Button capsules row */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {/* All Products Option */}
            <button
              type="button"
              onClick={() => onSelectClass('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                selectedClass === 'all'
                  ? 'bg-[#ff0046] text-white border-[#ff0046] shadow-sm'
                  : isDark
                  ? 'bg-[#182f48] text-slate-300 hover:text-white border-[#2b517a]'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
              }`}
              title="Show All Products across all classes"
            >
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>All Products</span>
              <span
                className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                  selectedClass === 'all'
                    ? 'bg-white/20 text-white'
                    : isDark
                    ? 'bg-slate-800 text-slate-300'
                    : 'bg-slate-200 text-slate-800'
                }`}
              >
                {totalProductsCount}
              </span>
            </button>

            {/* Individual Product Classes: T, P, F, C, E */}
            {PRODUCT_CLASSES.map((cls) => {
              const isSelected = selectedClass === cls.code;
              const count = productCounts[cls.code] || 0;

              return (
                <button
                  key={cls.code}
                  type="button"
                  onClick={() => onSelectClass(cls.code)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap border shrink-0 ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                      : isDark
                      ? 'bg-[#182f48] text-slate-300 hover:text-white border-[#2b517a]'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-300'
                  }`}
                  title={`${cls.name} - ${cls.description}`}
                >
                  <span className={isSelected ? 'text-white' : 'text-blue-400'}>
                    {getClassIcon(cls.code)}
                  </span>
                  <span>{cls.label}</span>
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : isDark
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-slate-200 text-slate-800'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
