import React, { useState, useEffect } from 'react';
import { Manager, FormationType, Playstyle, Player } from './types';
import { FORMATIONS } from './initialData';
import { Check, Shield, User, Crown, Activity } from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager;
  captain?: Player;
  currentFormation: FormationType;
  currentPlaystyle: Playstyle;
  initialSubView?: 'main' | 'formation' | 'playstyle';
  onSelectFormation: (formation: FormationType) => void;
  onSelectPlaystyle: (playstyle: Playstyle) => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  captain,
  currentFormation,
  currentPlaystyle,
  initialSubView = 'main',
  onSelectFormation,
  onSelectPlaystyle,
  isCoach = true,
  onPermissionDenied,
}) => {
  const [subView, setSubView] = useState<'main' | 'formation' | 'playstyle'>(initialSubView);

  useEffect(() => {
    if (isOpen) {
      setSubView(initialSubView);
    }
  }, [isOpen, initialSubView]);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-100">
      {/* Modal Container */}
      <div className="relative w-full max-w-[580px] max-h-[92vh] bg-[#0F172A] rounded-[24px] overflow-hidden shadow-2xl text-slate-100 border border-[#2A3B5C] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-4 pb-3 border-b border-[#1E293B]">
          <h2 className="text-[18px] font-black tracking-tight text-white font-sans flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>
              {subView === 'formation'
                ? 'Change Team Formation'
                : subView === 'playstyle'
                ? 'Team Tactical Playstyle'
                : isCoach && captain
                ? `Team Captain: ${captain.name}`
                : `Head Coach: ${manager.name}`}
            </span>
          </h2>
          <button
            onClick={() => {
              if (subView !== 'main') {
                setSubView('main');
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#334155] text-blue-400 flex items-center justify-center transition-colors shadow-sm focus:outline-none active:scale-90 cursor-pointer"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-blue-400 stroke-[2.8]">
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="6" y1="18" x2="18" y2="6" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        {subView === 'main' ? (
          <div className="px-6 pb-6 pt-4 grid grid-cols-12 gap-5 items-center overflow-y-auto">
            {/* Left Column: Portrait & Details */}
            <div className="col-span-5 flex flex-col items-center text-center">
              {/* Portrait */}
              <div className="w-[84px] h-[84px] rounded-2xl bg-[#1E293B] border-[2px] border-[#3B82F6] shadow-md overflow-hidden flex items-end justify-center p-0.5 mb-2 relative">
                <img
                  src={isCoach && captain ? captain.photoUrl : manager.photoUrl}
                  alt={isCoach && captain ? captain.name : manager.name}
                  className="w-full h-full object-contain object-bottom scale-105 pointer-events-none"
                />
                {isCoach && captain && (
                  <div className="absolute bottom-1 right-1 bg-orange-500 text-white font-black text-[9px] px-1.5 py-0.5 rounded shadow">
                    CAPTAIN
                  </div>
                )}
              </div>

              <h3 className="font-black text-sm text-white">{isCoach && captain ? captain.name : manager.name}</h3>
              <p className="text-[11px] text-blue-400 font-bold mb-2">
                {isCoach && captain ? `${captain.position} • Rating ${captain.rating}` : 'Tactical Mastermind'}
              </p>

              {/* Playstyle Matrix or Captain Bio */}
              {!isCoach || !captain ? (
                <div className="w-full grid grid-cols-2 gap-1.5 text-center bg-[#1E293B]/60 p-2 rounded-xl border border-[#334155]">
                  {playstyles.slice(0, 4).map((style) => {
                    const isCurrent = style === currentPlaystyle;
                    return (
                      <div key={style} className="flex flex-col items-center">
                        <span className="text-[8.5px] font-bold text-slate-400 truncate w-full">{style}</span>
                        <span className={`font-mono font-bold text-[14px] ${isCurrent ? 'text-amber-400' : 'text-slate-300'}`}>
                          {manager.proficiencies[style] || 75}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full bg-[#1E293B]/60 p-2.5 rounded-xl border border-[#334155] space-y-1 text-left">
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span className="text-slate-400">Position:</span>
                    <span className="font-bold text-emerald-400">{captain.position}</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-300">
                    <span className="text-slate-400">Overall:</span>
                    <span className="font-bold text-amber-400">{captain.rating} OVR</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column: Menu Actions */}
            <div className="col-span-7 flex flex-col divide-y divide-[#1E293B] border-l border-[#1E293B] pl-5">
              {/* 1. Change Formation */}
              <button
                onClick={() => {
                  if (!isCoach) {
                    if (onPermissionDenied) {
                      onPermissionDenied('Permission Denied: Only Head Coach can change formation.');
                    }
                    return;
                  }
                  setSubView('formation');
                }}
                className="flex items-center gap-3 py-3 text-left hover:bg-[#1E293B]/60 rounded-xl px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-4 h-4 text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-white group-hover:text-blue-400 transition-colors">
                    Change Formation
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Current: {currentFormation}
                  </span>
                </div>
              </button>

              {/* 2. Change Tactical Playstyle */}
              <button
                onClick={() => {
                  if (!isCoach) {
                    if (onPermissionDenied) {
                      onPermissionDenied('Permission Denied: Only Head Coach can change playstyle.');
                    }
                    return;
                  }
                  setSubView('playstyle');
                }}
                className="flex items-center gap-3 py-3 text-left hover:bg-[#1E293B]/60 rounded-xl px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0">
                  <Activity className="w-4 h-4 text-amber-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[14px] font-bold text-white group-hover:text-amber-400 transition-colors">
                    Tactical Playstyle
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Current: {currentPlaystyle}
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : subView === 'formation' ? (
          /* Formation Selector with tactical previews */
          <div className="px-6 pb-5 pt-3 overflow-y-auto max-h-[75vh]">
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
                      onClose();
                    }}
                    className={`p-2.5 rounded-xl border flex flex-col items-center gap-2 text-center transition-all active:scale-95 cursor-pointer ${
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
                      <span className="text-[13.5px] font-bold">{f}</span>
                      {isSelected && <Check className="w-4 h-4 text-[#0077ff] flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Playstyle Selector */
          <div className="px-6 pb-5 pt-3 overflow-y-auto max-h-[75vh]">
            <div className="grid grid-cols-1 gap-2">
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
                      onClose();
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-between text-left transition-all active:scale-98 cursor-pointer ${
                      isSelected
                        ? 'border-[#0077ff] bg-[#ebf5ff] text-[#0077ff] font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span className="text-[14px] font-semibold">{p}</span>
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
