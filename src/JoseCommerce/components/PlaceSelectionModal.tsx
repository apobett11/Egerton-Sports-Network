import React, { useState, useEffect } from 'react';
import { X, MapPin, Building2, CheckCircle2, ChevronRight, AlertCircle, ArrowRight } from 'lucide-react';
import { getStoredCountyPickupData, CountyPickupInfo } from '../data/pickupStations';

interface PlaceSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCounty: string;
  selectedSubCounty: string;
  selectedStation: string;
  onConfirmSelection: (county: string, subCounty: string, pickupStation: string) => void;
  theme?: 'dark' | 'light';
}

export const PlaceSelectionModal: React.FC<PlaceSelectionModalProps> = ({
  isOpen,
  onClose,
  selectedCounty,
  selectedSubCounty,
  selectedStation,
  onConfirmSelection,
  theme = 'dark',
}) => {
  const [countiesData, setCountiesData] = useState<CountyPickupInfo[]>(getStoredCountyPickupData);
  const [county, setCounty] = useState<string>(selectedCounty || 'Nakuru');
  const [subCounty, setSubCounty] = useState<string>(selectedSubCounty || 'Njoro');
  const [station, setStation] = useState<string>(selectedStation || '');
  const [isCustomTown, setIsCustomTown] = useState<boolean>(false);
  const [customTownName, setCustomTownName] = useState<string>('');

  useEffect(() => {
    const handleUpdated = (e: any) => {
      setCountiesData(e.detail || getStoredCountyPickupData());
    };
    window.addEventListener('pickup_stations_updated', handleUpdated);
    return () => window.removeEventListener('pickup_stations_updated', handleUpdated);
  }, []);

  const currentCountyObj = countiesData.find((c) => c.county.toLowerCase() === county.toLowerCase()) || countiesData[0];

  // Auto-select first sub-county and station when county changes
  useEffect(() => {
    if (currentCountyObj) {
      if (!isCustomTown && !currentCountyObj.subCounties.includes(subCounty)) {
        setSubCounty(currentCountyObj.subCounties[0] || 'Central');
      }
      if (!currentCountyObj.pickupStations.includes(station)) {
        setStation(currentCountyObj.pickupStations[0] || '');
      }
    }
  }, [county, currentCountyObj, isCustomTown]);

  if (!isOpen) return null;

  const resolvedTown = isCustomTown ? (customTownName.trim() || 'Custom Town') : subCounty;
  const resolvedStation = station || `${resolvedTown} Central Pickup Depot`;

  const handleConfirm = () => {
    if (!county || !resolvedTown) {
      alert('Please choose a county and town for delivery.');
      return;
    }
    onConfirmSelection(county, resolvedTown, resolvedStation);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-spring-in">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-lg rounded-2xl shadow-2xl border flex flex-col overflow-hidden ${
          theme === 'dark' ? 'bg-[#0f1d2e] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className={`px-5 py-4 border-b flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                Select Pickup Station & Location
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose your county, sub-county, and designated collection hub
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

        {/* Content Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Step 1: County Selection */}
          <div>
            <label className="text-xs font-bold uppercase text-slate-300 block mb-1.5">
              1. County
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {countiesData.map((c) => {
                const isSelected = c.county.toLowerCase() === county.toLowerCase();
                return (
                  <button
                    key={c.county}
                    type="button"
                    onClick={() => {
                      setCounty(c.county);
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold text-left transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-blue-600 border-blue-400 text-white shadow-sm'
                        : theme === 'dark'
                        ? 'bg-[#182b42] border-slate-700 text-slate-300 hover:border-slate-500'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{c.county}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 2: Town Selection with Custom Town Input Option */}
          {currentCountyObj && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold uppercase text-slate-300 block">
                  2. Town for Delivery
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomTown((prev) => !prev)}
                  className="text-[11px] font-bold text-blue-400 hover:text-blue-300 cursor-pointer"
                >
                  {isCustomTown ? '← Choose from list' : '+ Town not in list?'}
                </button>
              </div>

              {!isCustomTown ? (
                <div className="space-y-1.5">
                  <select
                    value={subCounty}
                    onChange={(e) => {
                      if (e.target.value === '__custom__') {
                        setIsCustomTown(true);
                      } else {
                        setSubCounty(e.target.value);
                      }
                    }}
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-hidden ${
                      theme === 'dark' 
                        ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-blue-500'
                    }`}
                  >
                    {currentCountyObj.subCounties.map((sub) => (
                      <option key={sub} value={sub}>
                        {sub}
                      </option>
                    ))}
                    <option value="__custom__">+ Other / Town not listed...</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    type="text"
                    autoFocus
                    value={customTownName}
                    onChange={(e) => {
                      setCustomTownName(e.target.value);
                      setStation(`${e.target.value.trim() || 'Town'} Central Pickup Depot`);
                    }}
                    placeholder="Enter your town name (e.g. Rongai, Salgaa, Subukia)..."
                    className={`w-full px-3 py-2 text-xs rounded-xl border font-semibold focus:outline-hidden ${
                      theme === 'dark'
                        ? 'bg-[#182b42] border-blue-500 text-white placeholder:text-slate-400'
                        : 'bg-white border-blue-500 text-slate-900 placeholder:text-slate-400'
                    }`}
                  />
                  <p className="text-[10px] text-slate-400">
                    Your parcel will be dispatched to the central courier depot nearest to {customTownName || 'your town'}.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Step 3: Pickup Station Selection */}
          {currentCountyObj && (
            <div>
              <label className="text-xs font-bold uppercase text-slate-300 block mb-1.5">
                3. Pickup Station ({county} Depot)
              </label>

              {isCustomTown && customTownName.trim() && (
                <div className="mb-2 p-2.5 rounded-xl border border-blue-500/40 bg-blue-600/10 flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    <span>{customTownName.trim()} Central Pickup Depot</span>
                  </div>
                  <span className="text-[10px] font-bold text-blue-400 bg-blue-500/20 px-2 py-0.5 rounded-full">
                    Auto-Assigned
                  </span>
                </div>
              )}

              <div className="space-y-2">
                {currentCountyObj.pickupStations.map((st) => {
                  const isSelected = st === station;
                  return (
                    <div
                      key={st}
                      onClick={() => setStation(st)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-600/15 border-blue-500 text-white shadow-sm'
                          : theme === 'dark'
                          ? 'bg-[#182b42] border-slate-700/80 text-slate-300 hover:border-slate-500'
                          : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-slate-400'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Building2 className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-400' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold leading-snug">{st}</span>
                      </div>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        isSelected ? 'border-blue-500 bg-blue-600' : 'border-slate-500'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Information Notice */}
          <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
            <span>
              Your order parcel will be delivered directly to this collection depot. You will receive an SMS and email notification once ready for pickup.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className={`px-5 py-3.5 border-t flex items-center justify-between ${
          theme === 'dark' ? 'bg-[#15273c] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!station}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
          >
            <span>Confirm Pickup Point</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
