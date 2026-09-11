import React, { useRef, useState } from 'react';
import { Manager } from './types';
import { User, Phone, Mail, Award, Upload, X, ShieldCheck } from 'lucide-react';

interface ManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  manager: Manager;
  onUploadCoachPhoto?: (file: File) => Promise<void> | void;
  onUpdateManager?: (updated: Partial<Manager>) => void;
  isCoach?: boolean;
  onPermissionDenied?: (msg: string) => void;
}

export const ManagerModal: React.FC<ManagerModalProps> = ({
  isOpen,
  onClose,
  manager,
  onUploadCoachPhoto,
  onUpdateManager,
  isCoach = true,
  onPermissionDenied,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [phone, setPhone] = useState(manager.phone || '');
  const [email, setEmail] = useState(manager.email || '');
  const [name, setName] = useState(manager.name || 'Head Coach');
  const [title, setTitle] = useState(manager.title || 'Head Coach');
  const [isEditing, setIsEditing] = useState(false);
  const [coachImgError, setCoachImgError] = useState(false);

  React.useEffect(() => {
    setName(manager.name || 'Head Coach');
    setPhone(manager.phone || '');
    setEmail(manager.email || '');
    setTitle(manager.title || 'Head Coach');
    setCoachImgError(false);
  }, [manager]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isCoach) {
      if (onPermissionDenied) {
        onPermissionDenied('Permission Denied: Only Head Coach can update coach image.');
      }
      return;
    }
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        if (onUploadCoachPhoto) {
          await onUploadCoachPhoto(file);
        } else {
          const localUrl = URL.createObjectURL(file);
          if (onUpdateManager) {
            onUpdateManager({ photoUrl: localUrl });
          }
        }
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSaveDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateManager) {
      onUpdateManager({ name, phone, email, title });
    }
    setIsEditing(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 select-none animate-in fade-in duration-100">
      {/* Hidden File Input for Coach Photo Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-[500px] bg-[#0F172A] rounded-[24px] overflow-hidden shadow-2xl text-slate-100 border border-[#2A3B5C] flex flex-col animate-in zoom-in-95 duration-150">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#1E293B]">
          <h2 className="text-[18px] font-black tracking-tight text-white font-sans flex items-center gap-2">
            <User className="w-5 h-5 text-blue-400" />
            <span>Head Coach Profile</span>
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#1E293B] hover:bg-[#334155] text-slate-300 hover:text-white flex items-center justify-center transition-colors shadow-sm focus:outline-none active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>

        {/* Modal Body: Purely Coach Details (Nothing about match) */}
        <div className="p-6 space-y-5">
          {/* Avatar & Upload Option */}
          <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
            <div className="relative group w-24 h-24 rounded-2xl bg-[#1E293B] border-2 border-blue-500 shadow-md overflow-hidden flex items-end justify-center p-0.5 shrink-0">
              {manager.photoUrl && !coachImgError ? (
                <img
                  src={manager.photoUrl}
                  alt={manager.name}
                  className="w-full h-full object-contain object-bottom scale-110 pointer-events-none"
                  onError={() => setCoachImgError(true)}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-blue-300">
                  <User className="w-12 h-12" />
                </div>
              )}
              {isCoach && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  title="Upload new coach photo"
                  className="absolute inset-0 bg-black/75 rounded-2xl flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-[10px] font-bold gap-1"
                >
                  <Upload className="w-4 h-4 text-amber-400" />
                  <span>{isUploading ? 'Uploading...' : 'Change Photo'}</span>
                </button>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-1">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <h3 className="font-black text-lg text-white truncate">{name}</h3>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Head Coach
                </span>
              </div>
              <p className="text-xs text-blue-400 font-semibold">{title}</p>
              <div className="flex items-center gap-2 text-xs text-slate-400 justify-center sm:justify-start">
                <ShieldCheck className="w-3.5 h-3.5 text-[#00b04f]" />
                <span className="text-[11px]">Official Club Representative</span>
              </div>
            </div>
          </div>

          {/* Details Card or Form */}
          {isEditing ? (
            <form onSubmit={handleSaveDetails} className="space-y-3 text-xs bg-[#1E293B]/60 p-4 rounded-xl border border-[#334155]">
              <div>
                <label className="block text-slate-300 font-bold mb-1">Coach Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white font-bold text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Phone Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">Official Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">License & Designation</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0F172A] border border-[#334155] rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Save Details
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2.5 bg-[#1E293B]/50 p-4 rounded-xl border border-[#334155]">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                  <Phone className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-medium block">Phone Contact</span>
                  <span className="font-mono font-bold text-white text-xs">{phone}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs pt-2 border-t border-[#1E293B]">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center shrink-0">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-medium block">Official Email</span>
                  <span className="font-bold text-white text-xs truncate block">{email}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs pt-2 border-t border-[#1E293B]">
                <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 font-medium block">Coaching Qualifications</span>
                  <span className="font-bold text-amber-300 text-xs">{title}</span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2 border-t border-[#1E293B]">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold border border-blue-500 text-blue-400 hover:bg-blue-500 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload New Photo</span>
            </button>

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold cursor-pointer transition-colors"
              >
                Edit Info
              </button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ManagerModal;
