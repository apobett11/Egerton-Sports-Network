import React, { useState } from 'react';
import { X, Save, User, Mail, Phone, Briefcase } from 'lucide-react';
import { AdminProfile } from '../../types';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: AdminProfile;
  onSaveProfile: (updated: AdminProfile) => void;
  theme?: 'dark' | 'light';
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSaveProfile,
  theme = 'dark',
}) => {
  const [fullName, setFullName] = useState(profile.fullName);
  const [email, setEmail] = useState(profile.email);
  const [phone, setPhone] = useState(profile.phone);
  const [role, setRole] = useState(profile.role);

  if (!isOpen) return null;

  const isDirty = 
    fullName.trim() !== profile.fullName ||
    email.trim() !== profile.email ||
    phone.trim() !== profile.phone ||
    role.trim() !== profile.role;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isDirty) return;
    onSaveProfile({
      ...profile,
      fullName: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      role: role.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3">
      <div 
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-md rounded-2xl border shadow-2xl overflow-hidden transition-colors ${
          theme === 'dark' ? 'bg-[#122336] border-slate-700 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Top Header with VISIBLE Close button and X in top right */}
        <div className={`px-5 py-3.5 border-b flex items-center justify-between gap-3 ${
          theme === 'dark' ? 'bg-[#182b42] border-slate-700' : 'bg-slate-50 border-slate-200'
        }`}>
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-100">
              Edit Personal Admin Information
            </h3>
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-600 shadow-md transition-colors cursor-pointer shrink-0"
            title="Close edit profile modal"
          >
            <span>Close</span>
            <X className="w-4 h-4 text-red-400 stroke-[2.5]" />
          </button>
        </div>

        {/* Edit Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Full Name
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Personal Admin Email (For Login)
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Personal Mobile Phone
            </label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
                }`}
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
              Operational Title / Role
            </label>
            <div className="relative">
              <Briefcase className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className={`w-full pl-9 pr-3 py-2 text-xs rounded-lg border focus:outline-hidden ${
                  theme === 'dark' 
                    ? 'bg-[#182b42] border-slate-700 text-white focus:border-blue-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-900 focus:border-[#0b1522]'
                }`}
              />
            </div>
          </div>

          {/* Action Buttons with Save Icon (Inactive until change is made) */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isDirty}
              className={`px-4 py-2 rounded-xl text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm transition-all ${
                isDirty 
                  ? 'bg-blue-600 hover:bg-blue-500 cursor-pointer active:scale-98' 
                  : 'bg-slate-700 opacity-50 cursor-not-allowed'
              }`}
              title={isDirty ? 'Save personal details' : 'Modify at least one field to save'}
            >
              <Save className="w-4 h-4" />
              <span>Save Personal Details</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
