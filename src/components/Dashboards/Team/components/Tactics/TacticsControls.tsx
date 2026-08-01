import React from 'react';
import { Sparkles, Sliders, ChevronDown, UserCheck, Check, Save } from 'lucide-react';
import type { UserRole } from '../../types';

interface TacticsControlsProps {
  collectiveRating: number;
  collectiveStrength: number;
  formation: string;
  setFormation: (f: string) => void;
  activePlaystyle: string;
  setActivePlaystyle: (p: string) => void;
  playstyleSliders: {
    attackingDepth: number;
    defensiveLine: number;
    teamWidth: number;
    pressingIntensity: number;
    buildUpStyle: string;
  };
  setPlaystyleSliders: React.Dispatch<React.SetStateAction<{
    attackingDepth: number;
    defensiveLine: number;
    teamWidth: number;
    pressingIntensity: number;
    buildUpStyle: string;
  }>>;
  startingXILength: number;
  handleSaveSquadDraft: () => void;
  handleSubmitMatchSquad: () => void;
  showToast: (msg: string) => void;
  currentRole?: UserRole;
  onSaveFormation?: () => void;
  onSaveSquad?: () => void;
}

export const TacticsControls: React.FC<TacticsControlsProps> = ({
  collectiveRating,
  collectiveStrength,
  formation,
  setFormation,
  activePlaystyle,
  setActivePlaystyle,
  playstyleSliders,
  setPlaystyleSliders,
  startingXILength,
  handleSaveSquadDraft,
  handleSubmitMatchSquad,
  showToast,
  currentRole = 'COACH',
  onSaveFormation,
  onSaveSquad,
}) => {
  const isCoach = currentRole === 'COACH';

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-3">
          <div>
            <h3 className="text-sm md:text-base font-semibold tracking-wide text-gray-100">
              Team Collective Rating
            </h3>
            <p className="text-[11px] md:text-xs font-medium text-gray-400">
              Starting XI power metrics
            </p>
          </div>
          <div className="text-right">
            <div className="font-mono text-base md:text-lg font-bold text-white flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>{collectiveRating} OVR</span>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              STR: {collectiveStrength}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs md:text-sm font-semibold text-gray-300">
              Starting Formation
            </label>
            {isCoach && (
              <button
                onClick={() => {
                  if (onSaveFormation) onSaveFormation();
                  else showToast(`Saved Formation: ${formation}`);
                }}
                className="px-2.5 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded border border-emerald-500/30 flex items-center gap-1 transition-colors min-h-[36px] cursor-pointer"
              >
                <Save className="w-3 h-3" />
                <span>Save Formation</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {['4-4-1-1', '4-3-3', '4-2-3-1'].map(f => (
              <button
                key={f}
                disabled={!isCoach}
                onClick={() => {
                  setFormation(f);
                  showToast(`Applied formation preset: ${f}`);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all min-h-[44px] cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed ${
                  formation === f
                    ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                    : 'bg-[#111111] border-[#2A2A2A] text-gray-300 hover:border-gray-500'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs md:text-sm font-semibold text-gray-300 block mb-1.5">
            Primary Tactical Philosophy
          </label>
          <select
            disabled={!isCoach}
            value={activePlaystyle}
            onChange={e => {
              setActivePlaystyle(e.target.value);
              showToast(`Tactical philosophy updated to ${e.target.value}`);
            }}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px] disabled:opacity-75 disabled:cursor-not-allowed"
          >
            <option value="Quick Counter">⚡ Quick Counter</option>
            <option value="Possession Game">⚽ Possession Game</option>
            <option value="Out Wide">Out Wide</option>
            <option value="Long Ball Counter">🚀 Long Ball Counter</option>
          </select>
        </div>
      </div>

      <details className="group border border-[#2A2A2A] rounded-xl bg-[#1F1F1F] overflow-hidden">
        <summary className="px-4 py-3.5 cursor-pointer font-semibold text-sm md:text-base text-gray-100 flex items-center justify-between min-h-[44px] hover:bg-[#252525] transition-colors select-none">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span>Advanced Playstyle Parameters</span>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-400 group-open:rotate-180 transition-transform" />
        </summary>

        <div className="p-4 border-t border-[#2A2A2A] space-y-4 bg-[#181818]">
          <div>
            <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
              <span>Attacking Depth</span>
              <span className="font-mono text-white font-bold">{playstyleSliders.attackingDepth}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              disabled={!isCoach}
              value={playstyleSliders.attackingDepth}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, attackingDepth: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
              <span>Defensive Line Height</span>
              <span className="font-mono text-white font-bold">{playstyleSliders.defensiveLine}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              disabled={!isCoach}
              value={playstyleSliders.defensiveLine}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, defensiveLine: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
              <span>Team Support Width</span>
              <span className="font-mono text-white font-bold">{playstyleSliders.teamWidth}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              disabled={!isCoach}
              value={playstyleSliders.teamWidth}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, teamWidth: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs md:text-sm font-normal text-gray-300 mb-1">
              <span>Pressing Intensity</span>
              <span className="font-mono text-white font-bold">{playstyleSliders.pressingIntensity}</span>
            </div>
            <input
              type="range"
              min="1"
              max="100"
              disabled={!isCoach}
              value={playstyleSliders.pressingIntensity}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, pressingIntensity: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px] disabled:opacity-50"
            />
          </div>
        </div>
      </details>

      {/* Save Squad & Submission Card */}
      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
          <h3 className="text-xs md:text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Squad Management</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            {startingXILength}/11 STARTING XI
          </span>
        </div>

        {/* TASK 7 REQUIREMENT: Note display */}
        <p className="text-[11px] font-semibold text-emerald-400/90 bg-emerald-950/40 p-2.5 rounded-lg border border-emerald-500/20 leading-relaxed">
          💡 This squad applies only to the current fixture and automatically reverts to the default squad before the next fixture.
        </p>

        {isCoach && (
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={() => {
                if (onSaveSquad) onSaveSquad();
                else handleSaveSquadDraft();
              }}
              className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>Save Squad</span>
            </button>

            <button
              onClick={handleSubmitMatchSquad}
              className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer shadow-md flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Submit Match Squad</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TacticsControls;
