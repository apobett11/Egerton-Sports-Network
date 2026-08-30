import React, { useState } from 'react';
import { Manager, FormationType, Playstyle } from './types';
import { FORMATIONS } from './initialData';
import { Check } from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager;
  currentFormation: FormationType;
  currentPlaystyle: Playstyle;
  onSelectFormation: (formation: FormationType) => void;
  onSelectPlaystyle: (playstyle: Playstyle) => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  currentFormation,
  currentPlaystyle,
  onSelectFormation,
  onSelectPlaystyle,
  isCoach = true,
  onPermissionDenied,
}) => {
  const [subView, setSubView] = useState<'main' | 'formation' | 'playstyle'>('main');

  if (!isOpen) return null;

  const playstyles: Playstyle[] = [
    'Possession Game',
    'Quick Counter',
    'Long Ball Counter',
    'Out Wide',
    'Long Ball',
  ];

  const formations: FormationType[] = [
    '4-4-1-1',
    '4-3-3',
    '4-2-1-3',
    '4-2-2-2',
    '3-2-4-1',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-[2px] p-4 select-none animate-in fade-in duration-150">
      {/* Modal Container matching screenshot WA0044 */}
      <div className="relative w-full max-w-[600px] bg-white rounded-[22px] overflow-hidden shadow-2xl efootball-modal-shadow text-gray-900 border border-gray-100 flex flex-col animate-in zoom-in-95 duration-150 efootball-spring">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-[21px] font-bold tracking-tight text-gray-900 font-sans">
            {subView === 'formation' ? 'Change Formation' : subView === 'playstyle' ? 'Team Playstyle' : manager.name}
          </h2>
          <button
            onClick={() => {
              if (subView !== 'main') {
                setSubView('main');
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-full bg-[#dbeafe] hover:bg-[#bfdbfe] text-[#0077ff] flex items-center justify-center transition-colors shadow-sm focus:outline-none active:scale-90 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#0077ff] stroke-[2.8]">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {subView === 'main' ? (
          <div className="px-6 pb-6 pt-1 grid grid-cols-12 gap-6 items-center">
            {/* Left Column: Manager Portrait & Proficiencies matching WA0044 */}
            <div className="col-span-5 flex flex-col items-center">
              {/* Manager Portrait Card */}
              <div className="w-[84px] h-[84px] rounded-[18px] bg-[#0c1a40] border-[2.2px] border-[#8cb0e2] shadow-md overflow-hidden flex items-end justify-center p-0.5 mb-4">
                <img
                  src={manager.photoUrl}
                  alt={manager.name}
                  className="w-full h-full object-contain object-bottom scale-110 pointer-events-none"
                />
              </div>

              {/* Playstyle Proficiencies Matrix */}
              <div className="w-full grid grid-cols-2 gap-x-2 gap-y-2 text-center">
                {playstyles.map((style) => {
                  const isCurrent = style === currentPlaystyle;
                  return (
                    <div
                      key={style}
                      className={`flex flex-col items-center justify-center ${
                        style === 'Long Ball' ? 'col-span-2' : ''
                      }`}
                    >
                      <span className="text-[10px] font-semibold text-gray-400 leading-tight">
                        {style}
                      </span>
                      <span
                        className={`font-efootball-num font-bold text-[20px] ${
                          isCurrent ? 'text-[#f59e0b]' : 'text-gray-400'
                        }`}
                      >
                        {manager.proficiencies[style] || 70}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Menu Actions with authentic blue icons matching WA0044 */}
            <div className="col-span-7 flex flex-col divide-y divide-gray-100 border-l border-gray-100 pl-6">
              {/* 1. Manager Details */}
              <button
                onClick={() => {}}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#0077ff] stroke-[2.4]">
                    <line x1="8" y1="6" x2="21" y2="6" strokeLinecap="round" />
                    <line x1="8" y1="12" x2="21" y2="12" strokeLinecap="round" />
                    <line x1="8" y1="18" x2="21" y2="18" strokeLinecap="round" />
                    <circle cx="4" cy="6" r="1.5" fill="#0077ff" />
                    <circle cx="4" cy="12" r="1.5" fill="#0077ff" />
                    <circle cx="4" cy="18" r="1.5" fill="#0077ff" />
                  </svg>
                </div>
                <span className="text-[14.5px] font-bold text-[#0077ff]">
                  Manager Details
                </span>
              </button>

              {/* 2. Change Manager */}
              <button
                onClick={() => {
                  if (!isCoach) {
                    if (onPermissionDenied) {
                      onPermissionDenied('Permission Denied: Only Head Coach can change managers.');
                    }
                    return;
                  }
                }}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0077ff]">
                    <path d="M 17,4 L 21,8 L 17,12 L 17,9 L 7,9 L 7,7 L 17,7 Z" />
                    <path d="M 7,20 L 3,16 L 7,12 L 7,15 L 17,15 L 17,17 L 7,17 Z" />
                  </svg>
                </div>
                <span className="text-[14.5px] font-bold text-[#0077ff]">
                  Change Manager
                </span>
              </button>

              {/* 3. Change Formation */}
              <button
                onClick={() => setSubView('formation')}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#0077ff] stroke-[2.2]">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="7" cy="8" r="1.5" fill="#0077ff" />
                    <circle cx="17" cy="8" r="1.5" fill="#0077ff" />
                    <circle cx="12" cy="12" r="1.5" fill="#0077ff" />
                    <circle cx="7" cy="16" r="1.5" fill="#0077ff" />
                    <circle cx="17" cy="16" r="1.5" fill="#0077ff" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-bold text-[#0077ff]">
                    Change Formation
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Current: {currentFormation}
                  </span>
                </div>
              </button>

              {/* 4. Team Playstyle */}
              <button
                onClick={() => setSubView('playstyle')}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#0077ff] stroke-[2.4]">
                    <path d="M 12,3 L 20,6 L 20,12 C 20,17 12,21 12,21 C 12,21 4,17 4,12 L 4,6 Z" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-bold text-[#0077ff]">
                    Team Playstyle
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Current: {currentPlaystyle}
                  </span>
                </div>
              </button>

              {/* 5. Individual Instructions */}
              <button
                onClick={() => {}}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-[#0077ff] stroke-[2.4]">
                    <circle cx="7" cy="17" r="3" />
                    <line x1="9" y1="15" x2="19" y2="5" strokeLinecap="round" />
                    <polyline points="13,5 19,5 19,11" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <span className="text-[14.5px] font-bold text-[#0077ff]">
                  Individual Instructions
                </span>
              </button>
            </div>
          </div>
        ) : subView === 'formation' ? (
          /* Formation Selector with tactical previews */
          <div className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {formations.map((f) => {
                const template = FORMATIONS[f];
                const isSelected = currentFormation === f;

                return (
                  <button
                    key={f}
                    onClick={() => {
                      if (!isCoach) {
                        if (onPermissionDenied) {
                          onPermissionDenied('Permission Denied: Only Head Coach can change formations.');
                        }
                        return;
                      }
                      onSelectFormation(f);
                      setSubView('main');
                    }}
                    className={`p-3 rounded-xl border flex flex-col items-center gap-2 text-center transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-[#0077ff] bg-[#ebf5ff] text-[#0077ff] font-bold shadow-md ring-2 ring-[#0077ff]/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {/* Mini Tactical Pitch Preview */}
                    <div className="relative w-full h-[52px] bg-[#0c2411] rounded-md overflow-hidden border border-emerald-800/40">
                      {template?.coords.map((slot, idx) => (
                        <div
                          key={idx}
                          style={{
                            left: `${slot.x}%`,
                            top: `${slot.y}%`,
                            transform: 'translate(-50%, -50%)',
                          }}
                          className={`absolute w-2 h-2 rounded-full ${
                            slot.position === 'GK'
                              ? 'bg-amber-400'
                              : isSelected
                              ? 'bg-[#00d2ff] shadow-[0_0_4px_#00d2ff]'
                              : 'bg-white'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex items-center justify-between w-full px-1">
                      <span className="text-[14px] font-bold">{f}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#0077ff] flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Playstyle Selector */
          <div className="px-6 pb-6 pt-2">
            <div className="grid grid-cols-1 gap-2.5">
              {playstyles.map((p) => {
                const isSelected = currentPlaystyle === p;

                return (
                  <button
                    key={p}
                    onClick={() => {
                      if (!isCoach) {
                        if (onPermissionDenied) {
                          onPermissionDenied('Permission Denied: Only Head Coach can change team playstyles.');
                        }
                        return;
                      }
                      onSelectPlaystyle(p);
                      setSubView('main');
                    }}
                    className={`p-3.5 rounded-xl border flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer ${
                      isSelected
                        ? 'border-[#0077ff] bg-[#ebf5ff] text-[#0077ff] font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[14.5px] font-semibold">{p}</span>
                    {isSelected && <Check className="w-5 h-5 text-[#0077ff]" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
