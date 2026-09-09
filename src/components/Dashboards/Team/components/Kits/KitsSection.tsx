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
    <section className="w-full bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm overflow-hidden shadow-xs select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* HEADER BANNER */}
      <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-[#ff0046]" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
            Official Team Kits & Uniforms
          </h3>
          <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#ff0046]/15 text-[#ff0046]">
            {kits.length} Kits Registered
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-700 dark:hover:text-white cursor-pointer"
            aria-label={isExpanded ? 'Collapse kits' : 'Expand kits'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* KITS GRID */}
      {isExpanded && (
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="bg-[#f8f9fa] dark:bg-[#112236] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-sm p-3 space-y-2 shadow-xs"
            >
              {/* Top Accent Strip */}
              <div
                style={{ backgroundColor: kit.primaryBg || '#ff0046' }}
                className="h-1 w-full rounded-full"
              />

              {/* Kit Image Thumbnail */}
              <div className="relative w-full aspect-video rounded-sm overflow-hidden bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-center">
                {kit.imageUrl ? (
                  <img src={kit.imageUrl} alt={kit.name} className="w-full h-full object-cover" />
                ) : (
                  <Shirt className="w-6 h-6 text-slate-300 dark:text-slate-600" />
                )}

                <button
                  type="button"
                  onClick={() => handleTriggerUpload(kit.id)}
                  disabled={isUploading}
                  className="absolute bottom-1 right-1 p-1 rounded-sm bg-[#0e1e2d] text-white border border-[#1a2e45] hover:bg-[#ff0046] transition-colors cursor-pointer"
                  title="Upload kit image"
                >
                  <Upload className="w-3 h-3" />
                </button>
              </div>

              {/* Kit Details */}
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                    {kit.name}
                  </h4>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold uppercase">
                    {kit.id.toUpperCase()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleTriggerUpload(kit.id)}
                  disabled={isUploading}
                  className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-[#152a40] text-white hover:bg-[#1c3857] transition-colors cursor-pointer"
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
