import React, { useState } from 'react';
import { Player, TeamData } from './types';
import { Crown, Check } from 'lucide-react';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  collectiveStrength: number;
  players: Player[];
  teamName: string;
  teamCrest: string;
  currentTeamId: string;
  teamsList: TeamData[];
  onSelectTeam: (teamId: string) => void;
  onSetCaptain: (playerId: string) => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  collectiveStrength,
  players,
  teamName,
  teamCrest,
  currentTeamId,
  teamsList,
  onSelectTeam,
  onSetCaptain,
  isCoach = true,
  onPermissionDenied,
}) => {
  const [subView, setSubView] = useState<'main' | 'roles' | 'teams'>('main');

  if (!isOpen) return null;

  const currentCaptain = players.find((p) => p.isCaptain) || players[0];

  const handleOpenTeams = () => {
    if (!isCoach) {
      if (onPermissionDenied) {
        onPermissionDenied('Permission Denied: Only Head Coach can change team presets.');
      }
      return;
    }
    setSubView('teams');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-[2px] p-4 select-none animate-in fade-in duration-150">
      {/* Modal Container matching screenshot WA0043 */}
      <div className="relative w-full max-w-[600px] bg-white rounded-[22px] overflow-hidden shadow-2xl efootball-modal-shadow text-gray-900 border border-gray-100 flex flex-col animate-in zoom-in-95 duration-150 efootball-spring">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <h2 className="text-[21px] font-bold tracking-tight text-gray-900 font-sans">
            {subView === 'roles'
              ? 'In-Match Roles'
              : subView === 'teams'
              ? 'Select Team Game Plan'
              : teamName}
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
            {/* Left Column: Crest, Game Plan title, Strength matching WA0043 */}
            <div className="col-span-5 flex flex-col items-center text-center">
              {/* Team Crest */}
              <div className="w-[84px] h-[84px] mb-2 flex items-center justify-center">
                <img
                  src={teamCrest}
                  alt={teamName}
                  className="w-full h-full object-contain drop-shadow-md pointer-events-none"
                />
              </div>

              {/* Game Plan Title */}
              <h3 className="text-[18px] font-bold text-gray-900 mb-1 font-sans">
                Game Plan
              </h3>

              {/* Collective Strength */}
              <span className="text-[11px] font-semibold text-gray-400">
                Collective Strength
              </span>
              <span className="font-efootball-num font-bold text-[36px] text-gray-900 leading-tight">
                {collectiveStrength}
              </span>
            </div>

            {/* Right Column: Menu Actions with authentic blue icons matching WA0043 */}
            <div className="col-span-7 flex flex-col divide-y divide-gray-100 border-l border-gray-100 pl-6">
              {/* 1. In-Match Roles */}
              <button
                onClick={() => setSubView('roles')}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0077ff]">
                    <path d="M 5,2 L 5,22 L 7,22 L 7,14 L 19,10 L 7,6 L 7,2 Z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-bold text-[#0077ff]">
                    In-Match Roles
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Captain: {currentCaptain?.name || 'None'}
                  </span>
                </div>
              </button>

              {/* 2. Automatic Match Support */}
              <button
                onClick={() => {}}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0077ff]">
                    <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                  </svg>
                </div>
                <span className="text-[14.5px] font-bold text-[#0077ff]">
                  Automatic Match Support
                </span>
              </button>

              {/* 3. Edit Squad Number */}
              <button
                onClick={() => {}}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-5 h-5 fill-[#0077ff]">
                    <path d="M 28,26 L 38,18 C 42,26 58,26 62,18 L 72,26 L 87,38 L 77,53 L 68,45 L 68,83 L 32,83 L 32,45 L 23,53 L 13,38 Z" />
                    <text x="50" y="62" fontSize="28" fontFamily="Arial Black" fontWeight="bold" textAnchor="middle" fill="white">2</text>
                  </svg>
                </div>
                <span className="text-[14.5px] font-bold text-[#0077ff]">
                  Edit Squad Number
                </span>
              </button>

              {/* 4. Base Team Settings */}
              <button
                onClick={handleOpenTeams}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 100 100" className="w-5 h-5 fill-[#0077ff]">
                    <path d="M 50,10 L 85,25 L 85,60 C 85,78 50,92 50,92 C 50,92 15,78 15,60 L 15,25 Z" />
                    <text x="50" y="65" fontSize="34" fontFamily="Arial Black" fontWeight="900" textAnchor="middle" fill="white">A</text>
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-bold text-[#0077ff]">
                    Base Team Settings
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Select active club or national squad
                  </span>
                </div>
              </button>

              {/* 5. Game Plan List */}
              <button
                onClick={handleOpenTeams}
                className="flex items-center gap-3.5 py-3 text-left hover:bg-gray-50 rounded-lg px-2 -mx-2 transition-colors group active:scale-98 cursor-pointer"
              >
                <div className="w-6 h-6 text-[#0077ff] flex items-center justify-center flex-shrink-0">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#0077ff]">
                    <path d="M 12,2 L 20,5 L 20,11 C 20,16 12,21 12,21 C 12,21 4,16 4,11 L 4,5 Z" />
                  </svg>
                </div>
                <div className="flex flex-col">
                  <span className="text-[14.5px] font-bold text-[#0077ff]">
                    Game Plan List
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    Load saved team formations
                  </span>
                </div>
              </button>
            </div>
          </div>
        ) : subView === 'roles' ? (
          /* In-Match Roles: Assign Captain */
          <div className="px-6 pb-6 pt-2">
            <h4 className="text-[13px] font-bold text-gray-500 mb-3 uppercase tracking-wider">
              {isCoach ? 'Select Captain' : 'Current Captain'}
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[260px] overflow-y-auto pr-1">
              {players.map((p) => {
                const isCap = p.isCaptain;
                return (
                  <button
                    key={p.id}
                    onClick={() => {
                      if (!isCoach) {
                        if (onPermissionDenied) {
                          onPermissionDenied('Permission Denied: Only Head Coach can appoint or change the Team Captain.');
                        }
                        return;
                      }
                      onSetCaptain(p.id);
                      setSubView('main');
                    }}
                    className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-left transition-all active:scale-95 cursor-pointer ${
                      isCap
                        ? 'border-[#0077ff] bg-[#ebf5ff] text-[#0077ff] font-bold shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
                      <img src={p.photoUrl} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[12px] font-bold truncate">{p.name}</span>
                      <span className="text-[10px] text-gray-500">{p.position} • {p.rating}</span>
                    </div>
                    {isCap && <Crown className="w-4 h-4 ml-auto text-amber-500 fill-amber-500 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          /* Base Team Settings: Select Team Game Plan */
          <div className="px-6 pb-6 pt-2">
            <h4 className="text-[13px] font-bold text-gray-500 mb-3 uppercase tracking-wider">
              Choose Team Preset
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[280px] overflow-y-auto pr-1">
              {teamsList.map((t) => {
                const isSelected = t.id === currentTeamId;

                return (
                  <button
                    key={t.id}
                    onClick={() => {
                      onSelectTeam(t.id);
                      setSubView('main');
                    }}
                    className={`p-3 rounded-xl border flex items-center gap-3 text-left transition-all active:scale-95 cursor-pointer ${
                      isSelected
                        ? 'border-[#0077ff] bg-[#ebf5ff] text-[#0077ff] font-bold shadow-md ring-2 ring-[#0077ff]/20'
                        : 'border-gray-200 hover:border-gray-300 bg-white text-gray-800 hover:bg-gray-50'
                    }`}
                  >
                    {/* Club Crest */}
                    <div className="w-10 h-10 flex-shrink-0 flex items-center justify-center">
                      <img src={t.crestUrl} alt={t.name} className="w-full h-full object-contain" />
                    </div>

                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="text-[14px] font-bold truncate text-gray-900">{t.name}</span>
                      <span className="text-[11px] text-gray-500">
                        {t.manager.name} • {t.formation}
                      </span>
                    </div>

                    {isSelected && <Check className="w-5 h-5 text-[#0077ff] flex-shrink-0 ml-auto" />}
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
