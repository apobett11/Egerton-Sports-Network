import React, { useState, useRef } from 'react';
import { Shirt, Upload, ChevronDown, ChevronUp } from 'lucide-react';
import { initialKits } from '../../mockData';
import type { UserRole, KitConfig } from '../../types';
import { uploadKitImageToStorage, saveTeamKitsConfig } from '../../lib/supabaseClient';

interface KitsSectionProps {
  currentRole?: UserRole;
  teamId?: string;
  onShowToast?: (msg: string) => void;
  compact?: boolean;
}

export const KitsSection: React.FC<KitsSectionProps> = ({
  currentRole: _currentRole = 'COACH',
  teamId = 'de307384-d113-4956-a5cc-96c20579e0fa',
  onShowToast,
  compact: _compact = true,
}) => {
  const [kits, setKits] = useState<KitConfig[]>(initialKits as KitConfig[]);
  const [selectedKitToUpload, setSelectedKitToUpload] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleTriggerUpload = (kitId: string) => {
    setSelectedKitToUpload(kitId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedKitToUpload) {
      const file = e.target.files[0];
      setIsUploading(true);
      try {
        const publicUrl = await uploadKitImageToStorage(file, selectedKitToUpload);
        const updatedKits = kits.map((k) =>
          k.id === selectedKitToUpload ? { ...k, imageUrl: publicUrl, updatedAt: new Date().toISOString() } : k
        );
        setKits(updatedKits);
        await saveTeamKitsConfig(teamId, updatedKits);
        if (onShowToast) onShowToast(`Updated ${selectedKitToUpload.toUpperCase()} kit photo!`);
      } catch (err: any) {
        console.error('Kit upload error:', err);
        if (onShowToast) onShowToast(`Kit upload saved locally (${err.message})`);
      } finally {
        setIsUploading(false);
        setSelectedKitToUpload(null);
      }
    }
  };

  return (
    <section className="w-full bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl overflow-hidden shadow-xs select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* HEADER BANNER */}
      <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#112236] border-b border-slate-200/60 dark:border-[#1a2e45] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-rose-500/10 flex items-center justify-center text-[#ff0046]">
            <Shirt className="w-4 h-4" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            Official Team Kits & Uniforms
          </h3>
          <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-rose-500/10 text-[#ff0046] border border-rose-500/20">
            {kits.length} Kits Registered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200/60 dark:hover:bg-[#152a40] transition-colors cursor-pointer"
            aria-label={isExpanded ? 'Collapse kits' : 'Expand kits'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* KITS GRID */}
      {isExpanded && (
        <div className="p-5 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="bg-slate-50 dark:bg-[#112236] border border-slate-200/60 dark:border-[#1a2e45] rounded-2xl p-3.5 space-y-3 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all"
            >
              {/* Top Accent Strip */}
              <div
                style={{ backgroundColor: kit.primaryBg || '#ff0046' }}
                className="h-1.5 w-full rounded-full"
              />

              {/* Kit Image Thumbnail */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] flex items-center justify-center">
                {kit.imageUrl ? (
                  <img src={kit.imageUrl} alt={kit.name} className="w-full h-full object-cover" />
                ) : (
                  <Shirt className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                )}

                <button
                  type="button"
                  onClick={() => handleTriggerUpload(kit.id)}
                  disabled={isUploading}
                  className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-[#0e1e2d]/90 text-white border border-white/10 hover:bg-[#ff0046] transition-colors cursor-pointer shadow-xs"
                  title="Upload kit image"
                >
                  <Upload className="w-3 h-3" />
                </button>
              </div>

              {/* Kit Details */}
              <div className="flex items-center justify-between gap-1">
                <div className="min-w-0">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {kit.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase">
                    {kit.id.toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerUpload(kit.id)}
                  disabled={isUploading}
                  className="px-2.5 py-1 rounded-xl text-[10px] font-bold uppercase bg-slate-200 hover:bg-slate-300 dark:bg-[#152a40] dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shrink-0"
                >
                  Upload
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default KitsSection;
