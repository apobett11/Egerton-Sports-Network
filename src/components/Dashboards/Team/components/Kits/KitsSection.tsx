import React, { useState, useRef } from 'react';
import { Shirt, Upload, Camera, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  currentRole = 'COACH',
  teamId = 'de307384-d113-4956-a5cc-96c20579e0fa',
  onShowToast,
  compact = true,
}) => {
  const [kits, setKits] = useState<KitConfig[]>(initialKits as KitConfig[]);
  const [selectedKitToUpload, setSelectedKitToUpload] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
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
        if (onShowToast) onShowToast(`Updated ${selectedKitToUpload.toUpperCase()} kit photo in database!`);
      } catch (err: any) {
        console.error('Kit upload error:', err);
        if (onShowToast) onShowToast(`Upload note: saved locally (${err.message})`);
      } finally {
        setIsUploading(false);
        setSelectedKitToUpload(null);
      }
    }
  };

  return (
    <section className="bg-[#161B22] border border-[#2A3441] rounded-3xl p-4 md:p-5 shadow-xl space-y-3 select-none">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* COMPACT HEADER */}
      <div className="flex items-center justify-between border-b border-[#2A3441] pb-2.5">
        <div className="flex items-center gap-2">
          <Shirt className="w-4 h-4 text-rose-400" />
          <h3 className="font-black text-xs md:text-sm text-white tracking-tight">
            Official Team Kits & Uniforms
          </h3>
          <span className="px-2 py-0.5 rounded-md text-[9px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
            {kits.length} Kits
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-3 py-1 bg-[#0D1117] hover:bg-slate-800 text-rose-300 hover:text-white text-[11px] font-extrabold rounded-xl transition-all border border-[#2A3441] flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Upload className="w-3.5 h-3.5 text-rose-400" />
            <span>Upload Kit Photos</span>
          </button>

          <button
            onClick={() => setIsExpanded((prev) => !prev)}
            className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* COMPACT KITS GRID */}
      {isExpanded && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
          {kits.map((kit) => (
            <div
              key={kit.id}
              className="bg-[#0D1117] border border-[#2A3441] hover:border-rose-500/40 rounded-2xl p-3 shadow-md space-y-2 relative group overflow-hidden"
            >
              {/* Top color bar */}
              <div style={{ backgroundColor: kit.primaryBg }} className="h-1 w-full rounded-full opacity-80" />

              {/* Kit Photo Thumbnail */}
              <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center">
                {kit.imageUrl ? (
                  <img src={kit.imageUrl} alt={kit.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <Shirt className="w-6 h-6 text-slate-600" />
                )}

                <button
                  onClick={() => handleTriggerUpload(kit.id)}
                  disabled={isUploading}
                  className="absolute bottom-1.5 right-1.5 p-1.5 rounded-lg bg-black/80 hover:bg-rose-600 text-white border border-slate-700 transition-all cursor-pointer"
                  title="Update photo"
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>

              {/* Label & Details */}
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-white truncate uppercase font-black text-[10px]">{kit.id} Kit</span>
                <div className="flex items-center gap-1">
                  <span style={{ backgroundColor: kit.primaryBg }} className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  {kit.stripeColor && (
                    <span style={{ backgroundColor: kit.stripeColor }} className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                  )}
                  <span style={{ backgroundColor: kit.accentColor }} className="w-2.5 h-2.5 rounded-full border border-slate-600" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* BATCH UPLOAD MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#161B22] border border-[#2A3441] rounded-3xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A3441] pb-2">
              <div className="flex items-center gap-2">
                <Shirt className="w-4 h-4 text-rose-400" />
                <h3 className="font-black text-sm text-white">Uniform Photo Uploader</h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select a kit to replace its official photo in the Supabase database.
            </p>

            <div className="grid grid-cols-2 gap-2.5">
              {kits.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setShowBatchModal(false);
                    handleTriggerUpload(k.id);
                  }}
                  className="p-2.5 rounded-xl bg-[#0D1117] border border-[#2A3441] hover:border-rose-500/50 flex items-center gap-2.5 transition-all cursor-pointer text-left"
                >
                  <div
                    style={{ backgroundColor: k.primaryBg }}
                    className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-slate-950 font-black text-[10px]"
                  >
                    👕
                  </div>
                  <div className="min-w-0">
                    <div className="font-black text-[11px] text-white uppercase truncate">{k.id} Kit</div>
                    <div className="text-[9px] text-slate-400 truncate">Upload photo</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#2A3441] flex justify-end">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
