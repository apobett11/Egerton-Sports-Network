import React, { useState, useEffect } from 'react';
import { Shirt, ChevronLeft, ChevronRight, Upload, X, Camera, Check } from 'lucide-react';
import { initialKits } from '../../mockData';
import type { UserRole } from '../../types';

interface KitsSectionProps {
  currentRole?: UserRole;
}

export const KitsSection: React.FC<KitsSectionProps> = ({ currentRole = 'COACH' }) => {
  const isCoach = currentRole === 'COACH';
  const [activeKitIndex, setActiveKitIndex] = useState<number>(1); // Home Kit centered (index 1)
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [customKitImages, setCustomKitImages] = useState<Record<string, string>>({});
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Load custom kit images from localStorage cache / database fallback
  useEffect(() => {
    try {
      const saved = localStorage.getItem('egerton_team_kits_config');
      if (saved) {
        setCustomKitImages(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Failed to load custom kit images', e);
    }
  }, []);

  const handleImageUpload = (kitId: string, file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const updated = { ...customKitImages, [kitId]: dataUrl };
      setCustomKitImages(updated);
      try {
        localStorage.setItem('egerton_team_kits_config', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to persist kit image to storage', e);
      }
      setToastMsg(`Uploaded new photo for ${kitId.toUpperCase()} kit`);
      setTimeout(() => setToastMsg(null), 3000);
    };
    reader.readAsDataURL(file);
  };

  return (
    <section className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl p-5 md:p-8 shadow-xl space-y-5 relative">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="absolute top-4 right-4 z-50 bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-xl flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* HEADER SECTION WITH KITS H2 AND COACH UPLOAD BUTTON */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#2A2A2A] pb-4">
        <div>
          <h2 className="text-lg md:text-2xl font-black text-white uppercase tracking-tight flex items-center gap-2">
            <Shirt className="w-6 h-6 text-emerald-400" />
            <span>Kits</span>
          </h2>
          <p className="text-xs text-gray-400">Egerton FC Official 2026/2027 Season Uniform Collection</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Coach Upload Kit Photos Trigger Button */}
          {isCoach && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer min-h-[44px]"
            >
              <Upload className="w-4 h-4" />
              <span>Upload Kit Photos</span>
            </button>
          )}

          <div className="flex items-center gap-1">
            <button
              onClick={() => setActiveKitIndex(prev => Math.max(0, prev - 1))}
              disabled={activeKitIndex === 0}
              className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => setActiveKitIndex(prev => Math.min(initialKits.length - 1, prev + 1))}
              disabled={activeKitIndex === initialKits.length - 1}
              className="p-2 rounded-lg bg-[#111111] border border-[#2A2A2A] text-gray-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Smooth Horizontal Carousel Container */}
      <div className="overflow-x-auto no-scrollbar py-4 px-2">
        <div className="flex items-center justify-center gap-4 md:gap-8 min-w-[600px] max-w-4xl mx-auto">
          {initialKits.map((kit, idx) => {
            const isCentered = idx === activeKitIndex;
            const customImg = customKitImages[kit.id];

            return (
              <div
                key={kit.id}
                onClick={() => {
                  setActiveKitIndex(idx);
                }}
                className={`transition-all duration-300 flex flex-col items-center cursor-pointer rounded-2xl p-4 border select-none relative group ${
                  isCentered
                    ? 'w-56 md:w-64 bg-[#141414] border-emerald-500/80 shadow-2xl scale-105 z-20'
                    : 'w-44 md:w-48 bg-[#111111]/70 border-[#2A2A2A] opacity-60 scale-90 hover:opacity-80'
                }`}
              >
                {/* Kit Badge */}
                <span
                  className={`text-[10px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full mb-3 border ${
                    kit.id === 'home'
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      : kit.id === 'away'
                      ? 'bg-slate-200/20 text-slate-200 border-slate-300/30'
                      : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  }`}
                >
                  {kit.id === 'home' ? 'Home Kit' : kit.id === 'away' ? 'Away Kit' : 'Third Kit'}
                </span>

                {/* Jersey Container: Custom Photo or SVG Fallback */}
                <div className="w-36 h-40 md:w-44 md:h-48 relative my-2 rounded-xl overflow-hidden flex items-center justify-center bg-[#181818] border border-[#2A2A2A]">
                  {customImg ? (
                    <img
                      src={customImg}
                      alt={kit.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  ) : (
                    <svg viewBox="0 0 200 220" className="w-full h-full filter drop-shadow-md">
                      <path
                        d="M 50 40 L 75 10 L 125 10 L 150 40 L 190 70 L 165 110 L 145 95 L 145 210 L 55 210 L 55 95 L 35 110 L 10 70 Z"
                        fill={kit.primaryBg}
                        stroke={kit.accentColor}
                        strokeWidth="3"
                      />
                      {kit.stripeColor && (
                        <path
                          d="M 80 40 L 80 210 M 100 35 L 100 210 M 120 40 L 120 210"
                          stroke={kit.stripeColor}
                          strokeWidth="10"
                        />
                      )}
                      <path
                        d="M 75 10 Q 100 30 125 10 Q 100 45 75 10 Z"
                        fill={kit.collarColor}
                        stroke={kit.accentColor}
                        strokeWidth="2"
                      />
                      <text
                        x="100"
                        y="140"
                        fill={kit.accentColor}
                        fontSize="32"
                        fontWeight="bold"
                        textAnchor="middle"
                      >
                        10
                      </text>
                    </svg>
                  )}

                  {/* Coach Hover Upload Badge */}
                  {isCoach && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowUploadModal(true);
                      }}
                      className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 text-white cursor-pointer"
                      title="Upload photo for this kit"
                    >
                      <Camera className="w-6 h-6 text-emerald-400" />
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-700/80 px-2 py-0.5 rounded">
                        Edit Photo
                      </span>
                    </button>
                  )}
                </div>

                <h3 className="text-xs md:text-sm font-extrabold text-white mt-2 text-center uppercase tracking-wide">
                  {kit.name}
                </h3>
                <p className="text-[10px] text-gray-400 text-center mt-1 line-clamp-2 px-1">
                  {kit.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* COACH POPUP MODAL FOR UPLOADING KIT PHOTOS (LISTING HOME, AWAY, THIRD VERTICALLY AS WORDS) */}
      {showUploadModal && isCoach && (
        <div className="fixed inset-0 z-[200] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1F1F1F] border border-[#2A2A2A] rounded-2xl w-full max-w-lg p-5 md:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-4">
              <div className="flex items-center gap-2.5">
                <Shirt className="w-6 h-6 text-emerald-400 shrink-0" />
                <div>
                  <h3 className="text-base md:text-lg font-black text-white uppercase tracking-tight">
                    Upload Kit Photos
                  </h3>
                  <p className="text-xs text-gray-400">Coach Control: Upload kit jersey photos</p>
                </div>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-2 rounded-xl bg-[#111111] text-gray-400 hover:text-white border border-[#2A2A2A] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Vertical List of the Three Kits as Words */}
            <div className="space-y-4">
              {[
                { id: 'home', title: 'Home Kit', color: 'amber' },
                { id: 'away', title: 'Away Kit', color: 'slate' },
                { id: 'third', title: 'Third Kit', color: 'emerald' },
              ].map(kitItem => {
                const existingImg = customKitImages[kitItem.id];
                return (
                  <div
                    key={kitItem.id}
                    className="bg-[#111111] border border-[#2A2A2A] rounded-xl p-4 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Image Preview Thumbnail */}
                      <div className="w-12 h-12 rounded-lg bg-[#1F1F1F] border border-[#2A2A2A] overflow-hidden shrink-0 flex items-center justify-center">
                        {existingImg ? (
                          <img src={existingImg} alt={kitItem.title} className="w-full h-full object-cover" />
                        ) : (
                          <Shirt className="w-6 h-6 text-gray-500" />
                        )}
                      </div>

                      {/* Kit Title as Words */}
                      <div className="min-w-0">
                        <h4 className="text-sm font-extrabold text-white uppercase tracking-wide">
                          {kitItem.title}
                        </h4>
                        <span className="text-[10px] text-gray-400">
                          {existingImg ? 'Custom photo uploaded' : 'Default graphic active'}
                        </span>
                      </div>
                    </div>

                    {/* Upload Button for each kit */}
                    <div>
                      <label className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm min-h-[40px]">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={e => {
                            if (e.target.files && e.target.files[0]) {
                              handleImageUpload(kitItem.id, e.target.files[0]);
                            }
                          }}
                        />
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-[#2A2A2A] pt-4 flex justify-end">
              <button
                onClick={() => setShowUploadModal(false)}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-md min-h-[44px]"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default KitsSection;
