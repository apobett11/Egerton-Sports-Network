import React, { useState, useRef } from 'react';
import { Shirt, Upload, Check, Camera, Image, Layers, Sparkles, X } from 'lucide-react';
import { initialKits } from '../../mockData';
import type { UserRole, KitConfig } from '../../types';
import { uploadKitImageToStorage, saveTeamKitsConfig } from '../../lib/supabaseClient';

interface KitsSectionProps {
  currentRole?: UserRole;
  teamId?: string;
  onShowToast?: (msg: string) => void;
}

export const KitsSection: React.FC<KitsSectionProps> = ({
  currentRole = 'COACH',
  teamId = 'de307384-d113-4956-a5cc-96c20579e0fa',
  onShowToast,
}) => {
  const isCoach = currentRole === 'COACH';
  const [kits, setKits] = useState<KitConfig[]>(initialKits as KitConfig[]);
  const [selectedKitToUpload, setSelectedKitToUpload] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [showBatchModal, setShowBatchModal] = useState<boolean>(false);
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
    <div className="space-y-6 max-w-7xl mx-auto w-full select-none pb-12">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* 1. INTEGRATED SECTION HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-[#2A3441] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              <Shirt className="w-6 h-6 text-rose-400" />
              <span>Official Team Uniforms & Kits</span>
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
              Season 2026/27
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Egerton FC uniform designs, collar configurations, and matchday kit assignments.
          </p>
        </div>

        {/* Coach Multi-Kit Batch Upgrade Button */}
        {isCoach && (
          <button
            onClick={() => setShowBatchModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-rose-950/40 flex items-center justify-center gap-2 shrink-0 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Manage & Upload Kit Photos</span>
          </button>
        )}
      </div>

      {/* 2. COMPACT & HIGH-END KITS CARDS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kits.map((kit) => (
          <div
            key={kit.id}
            className="bg-[#161B22] border border-[#2A3441] hover:border-rose-500/50 rounded-3xl p-4 shadow-xl transition-all space-y-3 relative overflow-hidden group"
          >
            {/* Visual Color Bar */}
            <div
              style={{ backgroundColor: kit.primaryBg }}
              className="h-1.5 w-full rounded-full opacity-90 shadow-xs"
            />

            {/* Kit Image Display (Compact) */}
            <div className="relative w-full aspect-square rounded-2xl overflow-hidden bg-[#0D1117] border border-[#2A3441] flex items-center justify-center group-hover:border-rose-400/50 transition-all">
              {kit.imageUrl ? (
                <img
                  src={kit.imageUrl}
                  alt={kit.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <Shirt className="w-12 h-12 stroke-1" />
                  <span className="text-[10px] font-bold">No Photo Uploaded</span>
                </div>
              )}

              {/* Individual Coach Upload Trigger Overlay */}
              {isCoach && (
                <button
                  onClick={() => handleTriggerUpload(kit.id)}
                  disabled={isUploading}
                  className="absolute bottom-2.5 right-2.5 p-2 rounded-xl bg-slate-900/90 hover:bg-rose-600 text-white border border-slate-700 hover:border-rose-500 shadow-xl transition-all cursor-pointer disabled:opacity-50"
                  title="Update this kit photo"
                >
                  <Camera className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Details */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-xs md:text-sm text-white truncate">{kit.name}</h3>
                <span className="text-[10px] font-mono font-black text-rose-400 uppercase">
                  {kit.id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 leading-snug line-clamp-2">{kit.description}</p>
            </div>

            {/* Color Swatches */}
            <div className="flex items-center justify-between pt-2 border-t border-[#2A3441] text-[10px] text-slate-400 font-bold">
              <span>Colorway:</span>
              <div className="flex items-center gap-1.5">
                <span
                  style={{ backgroundColor: kit.primaryBg }}
                  className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-xs"
                  title={`Primary: ${kit.primaryBg}`}
                />
                {kit.stripeColor && (
                  <span
                    style={{ backgroundColor: kit.stripeColor }}
                    className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-xs"
                    title={`Stripe: ${kit.stripeColor}`}
                  />
                )}
                <span
                  style={{ backgroundColor: kit.accentColor }}
                  className="w-3.5 h-3.5 rounded-full border border-slate-600 shadow-xs"
                  title={`Accent: ${kit.accentColor}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. COACH BATCH UPLOAD MODAL */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-[#161B22] border border-[#2A3441] rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#2A3441] pb-3">
              <div className="flex items-center gap-2">
                <Shirt className="w-5 h-5 text-rose-400" />
                <h3 className="font-black text-base text-white">Coach Uniform Management</h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Select any kit below to upload high-resolution uniform photos. Writes directly to the Supabase database.
            </p>

            <div className="grid grid-cols-2 gap-3">
              {kits.map((k) => (
                <button
                  key={k.id}
                  onClick={() => {
                    setShowBatchModal(false);
                    handleTriggerUpload(k.id);
                  }}
                  className="p-3 rounded-2xl bg-[#0D1117] border border-[#2A3441] hover:border-rose-500/50 flex items-center gap-3 transition-all cursor-pointer text-left"
                >
                  <div
                    style={{ backgroundColor: k.primaryBg }}
                    className="w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-slate-950 font-black text-xs shadow-xs"
                  >
                    👕
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-xs text-white uppercase truncate">{k.id} Kit</div>
                    <div className="text-[10px] text-slate-400 truncate">Upload photo</div>
                  </div>
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#2A3441] flex justify-end">
              <button
                onClick={() => setShowBatchModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-bold text-xs hover:bg-slate-700 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
