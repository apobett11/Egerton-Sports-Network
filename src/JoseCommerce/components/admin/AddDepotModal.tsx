import React, { useState } from 'react';
import { 
  X, 
  MapPin, 
  Building2, 
  Plus, 
  CheckCircle2, 
  ChevronDown 
} from 'lucide-react';
import { 
  getStoredCountyPickupData, 
  adminAddPickupStation, 
  CountyPickupInfo 
} from '../../data/pickupStations';

interface AddDepotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDepotAdded?: (county: string, depotName: string) => void;
  theme?: 'dark' | 'light';
}

const STORAGE_KEY_ADD_DEPOT_DRAFT = 'egerscore_admin_add_depot_draft';

export const AddDepotModal: React.FC<AddDepotModalProps> = ({
  isOpen,
  onClose,
  onDepotAdded,
  theme = 'dark',
}) => {
  const draft = React.useMemo(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ADD_DEPOT_DRAFT);
      if (raw) return JSON.parse(raw);
    } catch (_) {}
    return null;
  }, []);

  const [countyData, setCountyData] = useState<CountyPickupInfo[]>(getStoredCountyPickupData);
  const [selectedCounty, setSelectedCounty] = useState(() => draft?.selectedCounty || 'Nakuru');
  const [isCustomCounty, setIsCustomCounty] = useState(() => Boolean(draft?.isCustomCounty));
  const [customCountyName, setCustomCountyName] = useState(() => draft?.customCountyName || '');
  const [subCounty, setSubCounty] = useState(() => draft?.subCounty || '');
  const [depotName, setDepotName] = useState(() => draft?.depotName || '');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  React.useEffect(() => {
    if (isOpen) {
      try {
        localStorage.setItem(STORAGE_KEY_ADD_DEPOT_DRAFT, JSON.stringify({
          selectedCounty,
          isCustomCounty,
          customCountyName,
          subCounty,
          depotName,
        }));
      } catch (_) {}
    }
  }, [isOpen, selectedCounty, isCustomCounty, customCountyName, subCounty, depotName]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const targetCounty = isCustomCounty ? customCountyName.trim() : selectedCounty.trim();
    const targetDepot = depotName.trim();

    if (!targetCounty) {
      setErrorMsg('Please select or specify a county.');
      return;
    }
    if (!targetDepot) {
      setErrorMsg('Please enter a valid depot or pickup station name.');
      return;
    }

    // Format depot with sub-county if provided and not already included
    const fullDepotName = subCounty.trim() && !targetDepot.toLowerCase().includes(subCounty.trim().toLowerCase())
      ? `${targetDepot} (${subCounty.trim()})`
      : targetDepot;

    const updated = adminAddPickupStation(targetCounty, fullDepotName);
    setCountyData(updated);
    setSuccessMsg(`Depot "${fullDepotName}" added to ${targetCounty} County! Available for checkout.`);
    onDepotAdded?.(targetCounty, fullDepotName);

    setDepotName('');
    setSubCounty('');
    if (isCustomCounty) {
      setCustomCountyName('');
      setIsCustomCounty(false);
      setSelectedCounty(targetCounty);
    }
    try {
      localStorage.removeItem(STORAGE_KEY_ADD_DEPOT_DRAFT);
    } catch (_) {}

    setTimeout(() => {
      setSuccessMsg('');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-spring-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center font-black">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Add Pickup Depot
              </h3>
              <p className="text-[11px] text-slate-400">
                Register new pickup station for customer orders and checkout
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 text-xs font-bold">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* County Selection */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase font-bold text-slate-400">
                Target County *
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCounty(!isCustomCounty)}
                className="text-[10px] text-blue-400 hover:text-blue-300 font-bold cursor-pointer"
              >
                {isCustomCounty ? 'Choose from list' : '+ Custom County'}
              </button>
            </div>

            {isCustomCounty ? (
              <input
                type="text"
                required
                placeholder="Enter new county name (e.g. Kericho, Kajiado)"
                value={customCountyName}
                onChange={(e) => setCustomCountyName(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-bold focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              />
            ) : (
              <select
                value={selectedCounty}
                onChange={(e) => setSelectedCounty(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border font-bold focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
                }`}
              >
                {countyData.map((c) => (
                  <option key={c.county} value={c.county}>
                    {c.county} County ({c.pickupStations.length} active depots)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Sub-County (Optional) */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Sub-County / Area (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. Njoro, CBD, Westlands, Naivasha"
              value={subCounty}
              onChange={(e) => setSubCounty(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-medium focus:outline-hidden ${
                theme === 'dark' 
                  ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
          </div>

          {/* Depot Station Name */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 block">
              Depot Station Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Egerton Main Campus Gate 3 Sports Hub Depot"
              value={depotName}
              onChange={(e) => setDepotName(e.target.value)}
              className={`w-full px-3 py-2 text-xs rounded-xl border font-medium focus:outline-hidden ${
                theme === 'dark' 
                  ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                  : 'bg-slate-50 border-slate-300 text-slate-900 focus:border-blue-500'
              }`}
            />
            <p className="text-[10px] text-slate-400">
              This depot will immediately appear in the customer checkout place selection popup.
            </p>
          </div>

          {/* Current Stations Preview */}
          <div className="pt-2 border-t border-slate-800">
            <span className="text-[10px] font-bold uppercase text-slate-400 block mb-2">
              Existing Depots in {isCustomCounty ? customCountyName || 'County' : selectedCounty}:
            </span>
            <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1">
              {(countyData.find(c => c.county.toLowerCase() === (isCustomCounty ? customCountyName.toLowerCase() : selectedCounty.toLowerCase()))?.pickupStations || []).map((st, i) => (
                <div 
                  key={i}
                  className={`p-2 rounded-lg text-xs flex items-center gap-2 border ${
                    theme === 'dark' ? 'bg-[#14263b] border-slate-700/60 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="truncate">{st}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Save & Add Depot</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
