import React, { useState } from 'react';
import { 
  Building2, 
  PhoneCall, 
  SlidersHorizontal, 
  MapPin, 
  UserCheck, 
  Palette, 
  Save, 
  CheckCircle2, 
  Plus, 
  Sun, 
  Moon,
  ChevronRight
} from 'lucide-react';
import { 
  AdminCheckoutSettings, 
  BusinessContactSettings, 
  AdminProfile 
} from '../../types';
import { AdminContactsTab } from './AdminContactsTab';
import { AdminProfileTab } from './AdminProfileTab';
import { getStoredCountyPickupData, adminAddPickupStation, CountyPickupInfo } from '../../data/pickupStations';

interface AdminSettingsViewProps {
  checkoutSettings: AdminCheckoutSettings;
  businessContact: BusinessContactSettings;
  adminProfile: AdminProfile;
  onUpdateCheckoutSettings: (settings: AdminCheckoutSettings) => void;
  onUpdateBusinessContact: (contact: BusinessContactSettings) => void;
  onUpdateAdminProfile: (profile: AdminProfile) => void;
  onOpenAddDepot?: () => void;
  onShowToast?: (message: string) => void;
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
  initialSubTab?: 'contact' | 'checkout' | 'depots' | 'profile' | 'appearance';
}

export const AdminSettingsView: React.FC<AdminSettingsViewProps> = ({
  checkoutSettings,
  businessContact,
  adminProfile,
  onUpdateCheckoutSettings,
  onUpdateBusinessContact,
  onUpdateAdminProfile,
  onOpenAddDepot,
  onShowToast,
  theme = 'dark',
  onToggleTheme,
  initialSubTab = 'contact',
}) => {
  const isDark = theme === 'dark';
  const [activeSubTab, setActiveSubTab] = useState<'contact' | 'checkout' | 'depots' | 'profile' | 'appearance'>(initialSubTab);

  // Checkout settings form state
  const [formSettings, setFormSettings] = useState<AdminCheckoutSettings>(checkoutSettings);

  // Pickup stations state
  const [countyData, setCountyData] = useState<CountyPickupInfo[]>(getStoredCountyPickupData);
  const [selectedCounty, setSelectedCounty] = useState('Nakuru');
  const [newStationName, setNewStationName] = useState('');
  const [stationSuccess, setStationSuccess] = useState('');

  const isCheckoutDirty = 
    formSettings.teamKitMinQuantity !== checkoutSettings.teamKitMinQuantity ||
    formSettings.depositRequired !== checkoutSettings.depositRequired ||
    formSettings.depositType !== checkoutSettings.depositType ||
    formSettings.depositValue !== checkoutSettings.depositValue ||
    formSettings.freeShippingThreshold !== checkoutSettings.freeShippingThreshold;

  const handleSaveCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCheckoutDirty) return;
    onUpdateCheckoutSettings(formSettings);
    onShowToast?.('Checkout deposit & delivery settings saved successfully!');
  };

  const handleAddStation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStationName.trim()) return;
    const updated = adminAddPickupStation(selectedCounty, newStationName.trim());
    setCountyData(updated);
    setStationSuccess(`Station "${newStationName.trim()}" added to ${selectedCounty} County!`);
    onShowToast?.(`Station added to ${selectedCounty}!`);
    setNewStationName('');
    setTimeout(() => setStationSuccess(''), 3500);
  };

  const SETTING_TABS = [
    { id: 'contact', label: 'Business Contact', icon: PhoneCall },
    { id: 'checkout', label: 'Checkout & Delivery', icon: SlidersHorizontal },
    { id: 'depots', label: 'Pickup Locations', icon: MapPin },
    { id: 'profile', label: 'Administrator Profile', icon: UserCheck },
    { id: 'appearance', label: 'Appearance', icon: Palette },
  ] as const;

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs transition-colors ${
        isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider">
                Store Configuration
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-100 tracking-tight">
              Settings & Store Operations
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Centralised hub for customer support contact points, checkout rules, pickup stations, and admin security.
            </p>
          </div>
        </div>

        {/* SUBSECTION NAVIGATION TABS */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {SETTING_TABS.map((t) => {
            const Icon = t.icon;
            const isActive = activeSubTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveSubTab(t.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : isDark
                    ? 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SUBSECTION A: BUSINESS CONTACT (PRESERVED AS IS PER USER MANDATE) */}
      {activeSubTab === 'contact' && (
        <div className="animate-spring-in">
          <AdminContactsTab
            contactSettings={businessContact}
            onSaveContactSettings={onUpdateBusinessContact}
            onShowToast={onShowToast}
            theme={theme}
          />
        </div>
      )}

      {/* SUBSECTION B: CHECKOUT & DELIVERY RULES */}
      {activeSubTab === 'checkout' && (
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs animate-spring-in ${
          isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              Checkout, Deposit & Delivery Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Set upfront deposit rates for custom team wear, minimum order quantities (MOQ), and shipping thresholds.
            </p>
          </div>

          <form onSubmit={handleSaveCheckout} className="pt-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* MOQ */}
              <div className={`p-4 rounded-xl border ${
                isDark ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <label className="text-xs font-bold text-slate-200 block mb-1">
                  Team Kit Minimum Order Quantity (MOQ)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formSettings.teamKitMinQuantity}
                  onChange={(e) => setFormSettings({ ...formSettings, teamKitMinQuantity: parseInt(e.target.value) || 1 })}
                  className={`w-full px-3 py-1.5 text-xs rounded-xl border font-mono font-bold focus:outline-hidden ${
                    isDark ? 'bg-[#122336] border-slate-600 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                  }`}
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Minimum number of jerseys/kits required to trigger team squad discounts.
                </span>
              </div>

              {/* Deposit Toggle */}
              <div className={`p-4 rounded-xl border flex items-center justify-between ${
                isDark ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Require Upfront Deposit</span>
                  <span className="text-[11px] text-slate-400">Mandatory commitment prior to custom kit printing</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formSettings.depositRequired}
                    onChange={(e) => setFormSettings({ ...formSettings, depositRequired: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-700 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                </label>
              </div>

            </div>

            {formSettings.depositRequired && (
              <div className={`p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-2 gap-4 ${
                isDark ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
              }`}>
                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Deposit Calculation Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setFormSettings({ ...formSettings, depositType: 'percentage' })}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        formSettings.depositType === 'percentage'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Percentage (%)
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormSettings({ ...formSettings, depositType: 'fixed' })}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold cursor-pointer transition-colors ${
                        formSettings.depositType === 'fixed'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      Fixed (KES)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    {formSettings.depositType === 'percentage' ? 'Deposit Value (%)' : 'Deposit Amount (KES)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={formSettings.depositType === 'percentage' ? 100 : 100000}
                    value={formSettings.depositValue}
                    onChange={(e) => setFormSettings({ ...formSettings, depositValue: parseInt(e.target.value) || 0 })}
                    className={`w-full px-3 py-1.5 text-xs rounded-xl border font-mono font-bold focus:outline-hidden ${
                      isDark ? 'bg-[#122336] border-slate-600 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'
                    }`}
                  />
                </div>
              </div>
            )}

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                {isCheckoutDirty ? 'Modifications ready to save' : 'Settings are up to date.'}
              </span>
              <button
                type="submit"
                disabled={!isCheckoutDirty}
                className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2 transition-all ${
                  isCheckoutDirty
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs cursor-pointer'
                    : 'bg-slate-700 text-slate-400 opacity-50 cursor-not-allowed'
                }`}
              >
                <Save className="w-4 h-4" />
                <span>Save Checkout Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SUBSECTION C: PICKUP DEPOTS & COUNTY LOCATIONS */}
      {activeSubTab === 'depots' && (
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs animate-spring-in space-y-5 ${
          isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
            <div>
              <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
                Pickup Stations & County Depots
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage collection hubs where customers can collect orders without home delivery fees.
              </p>
            </div>

            {onOpenAddDepot && (
              <button
                type="button"
                onClick={onOpenAddDepot}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2 shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Register Depot</span>
              </button>
            )}
          </div>

          {/* Quick Add Form */}
          <form onSubmit={handleAddStation} className="p-4 rounded-xl border border-slate-700/60 bg-black/10 space-y-3">
            <span className="text-xs font-bold text-slate-200 block">Quick Register Station</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  Target County
                </label>
                <select
                  value={selectedCounty}
                  onChange={(e) => setSelectedCounty(e.target.value)}
                  className={`w-full px-3 py-2 text-xs rounded-xl border font-bold focus:outline-hidden ${
                    isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                  }`}
                >
                  {countyData.map((c) => (
                    <option key={c.county} value={c.county}>
                      {c.county} ({c.pickupStations.length} depots)
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                  New Station / Depot Name
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="e.g. Nakuru Gate 3 Sports Hub Depot..."
                    value={newStationName}
                    onChange={(e) => setNewStationName(e.target.value)}
                    className={`flex-1 px-3 py-2 text-xs rounded-xl border focus:outline-hidden ${
                      isDark ? 'bg-[#182b42] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  />
                  <button
                    type="submit"
                    disabled={!newStationName.trim()}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase cursor-pointer disabled:opacity-50 transition-all shrink-0"
                  >
                    Add Depot
                  </button>
                </div>
              </div>
            </div>

            {stationSuccess && (
              <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs text-emerald-400 font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{stationSuccess}</span>
              </div>
            )}
          </form>

          {/* Current County Stations List */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">
              Active County Stations Directory
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {countyData.map((county) => (
                <div
                  key={county.county}
                  className={`p-3.5 rounded-xl border ${
                    isDark ? 'bg-[#182b42] border-slate-700/80' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-700/50">
                    <span className="font-bold text-slate-100 text-xs">{county.county} County</span>
                    <span className="text-[10px] font-mono text-blue-400 bg-blue-500/15 px-1.5 py-0.5 rounded">
                      {county.pickupStations.length} depots
                    </span>
                  </div>
                  <div className="mt-2 space-y-1">
                    {county.pickupStations.map((station, sIdx) => (
                      <div key={sIdx} className="text-[11px] text-slate-300 flex items-center gap-1.5 truncate">
                        <MapPin className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{station}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBSECTION D: ADMINISTRATOR PROFILE & CREDENTIALS */}
      {activeSubTab === 'profile' && (
        <div className="animate-spring-in">
          <AdminProfileTab
            profile={adminProfile}
            onUpdateProfile={onUpdateAdminProfile}
            onShowToast={onShowToast}
            theme={theme}
          />
        </div>
      )}

      {/* SUBSECTION E: APPEARANCE */}
      {activeSubTab === 'appearance' && (
        <div className={`p-5 sm:p-6 rounded-2xl border shadow-xs animate-spring-in space-y-4 ${
          isDark ? 'bg-[#122336] border-slate-800' : 'bg-white border-slate-200'
        }`}>
          <div className="pb-4 border-b border-slate-800">
            <h2 className="text-base font-black uppercase tracking-wider text-slate-100">
              Theme & Visual Appearance
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Manage interface theme and appearance while preserving the established Sports House navy-blue brand aesthetic.
            </p>
          </div>

          <div className={`p-4 rounded-xl border flex items-center justify-between ${
            isDark ? 'bg-[#182b42] border-slate-700/60' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-amber-300">
                {isDark ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-400" />}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-200 block">
                  Current Mode: {isDark ? 'Navy Blue Dark Mode (Default)' : 'High Contrast Light Mode'}
                </span>
                <span className="text-[11px] text-slate-400">
                  {isDark 
                    ? 'Official Sports House deep navy (#0a1420) theme with optimal low-light legibility.' 
                    : 'Clean light background with dark typography for brightly lit workspaces.'}
                </span>
              </div>
            </div>

            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all cursor-pointer"
              >
                Switch to {isDark ? 'Light Mode' : 'Dark Mode'}
              </button>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
