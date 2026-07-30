import React from 'react';
import { Sparkles, Sliders, ChevronDown, UserCheck, Check } from 'lucide-react';

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
}) => {
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
          <label className="text-xs md:text-sm font-normal leading-relaxed text-gray-300 block mb-1.5 font-semibold">
            Starting Formation
          </label>
          <div className="grid grid-cols-3 gap-2">
            {['4-4-1-1', '4-3-3', '4-2-3-1'].map(f => (
              <button
                key={f}
                onClick={() => {
                  setFormation(f);
                  showToast(`Applied formation preset: ${f}`);
                }}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-all min-h-[44px] cursor-pointer ${
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
          <label className="text-xs md:text-sm font-normal leading-relaxed text-gray-300 block mb-1.5 font-semibold">
            Primary Tactical Philosophy
          </label>
          <select
            value={activePlaystyle}
            onChange={e => {
              setActivePlaystyle(e.target.value);
              showToast(`Tactical philosophy updated to ${e.target.value}`);
            }}
            className="w-full bg-[#111111] border border-[#2A2A2A] rounded-lg px-3 py-2.5 text-xs md:text-sm text-gray-200 focus:outline-none focus:border-emerald-500 min-h-[44px]"
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
            <span>⚙️ Advanced Playstyle Tweak</span>
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
              value={playstyleSliders.attackingDepth}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, attackingDepth: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px]"
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
              value={playstyleSliders.defensiveLine}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, defensiveLine: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px]"
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
              value={playstyleSliders.teamWidth}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, teamWidth: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px]"
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
              value={playstyleSliders.pressingIntensity}
              onChange={e =>
                setPlaystyleSliders(prev => ({ ...prev, pressingIntensity: Number(e.target.value) }))
              }
              className="w-full accent-emerald-500 bg-[#2A2A2A] h-2 rounded-lg cursor-pointer min-h-[44px]"
            />
          </div>

          <div>
            <span className="text-xs md:text-sm font-normal text-gray-300 block mb-1.5">Build-Up Style</span>
            <div className="grid grid-cols-2 gap-2">
              {['Short Pass', 'Long Ball'].map(style => (
                <button
                  key={style}
                  onClick={() => setPlaystyleSliders(prev => ({ ...prev, buildUpStyle: style }))}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all min-h-[44px] cursor-pointer ${
                    playstyleSliders.buildUpStyle === style
                      ? 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-[#111111] border-[#2A2A2A] text-gray-300 hover:border-gray-500'
                  }`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>
        </div>
      </details>

      <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-xl p-5 shadow-lg space-y-3">
        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2">
          <h3 className="text-xs md:text-sm font-bold text-gray-100 uppercase tracking-wider flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-emerald-400" />
            <span>Match Squad Submission & Validation</span>
          </h3>
          <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
            {startingXILength}/11 STARTING XI
          </span>
        </div>

        <p className="text-[11px] font-medium text-gray-400">
          Prepare, validate, and officially submit your match day starting lineup and bench.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={handleSaveSquadDraft}
            className="flex-1 py-2.5 px-3 bg-[#111111] hover:bg-[#2A2A2A] text-gray-200 text-xs font-bold rounded-lg border border-[#2A2A2A] transition-colors min-h-[44px] cursor-pointer"
          >
            Save Squad Draft
          </button>

          <button
            onClick={handleSubmitMatchSquad}
            className="flex-1 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg transition-colors min-h-[44px] cursor-pointer shadow-md flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Submit Match Squad</span>
          </button>
        </div>
      </div>
    </div>
  );
};
