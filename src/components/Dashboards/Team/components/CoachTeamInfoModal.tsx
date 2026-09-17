import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Upload,
  Lock,
  Mail,
  KeyRound,
  Eye,
  EyeOff,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Users,
  Image as ImageIcon,
} from 'lucide-react';
import { updateCoachCredentialsAndLogo, uploadTeamCrest } from '../lib/supabaseClient';

interface CoachTeamInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  teamName: string;
  teamLogo?: string;
  coachEmail?: string;
  coachUserId?: string;
  rosterCount?: number;
  onSuccess?: (updated: { logoUrl?: string; email?: string }) => void;
  onShowToast: (msg: string) => void;
}

export const CoachTeamInfoModal: React.FC<CoachTeamInfoModalProps> = ({
  isOpen,
  onClose,
  teamId,
  teamName,
  teamLogo = '',
  coachEmail = '',
  coachUserId,
  rosterCount = 0,
  onSuccess,
  onShowToast,
}) => {
  const [logoUrl, setLogoUrl] = useState(teamLogo);
  const [email, setEmail] = useState(coachEmail);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>(teamLogo);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state whenever modal opens or props change
  useEffect(() => {
    if (isOpen) {
      setLogoUrl(teamLogo);
      setPreviewUrl(teamLogo);
      setEmail(coachEmail);
      setPassword('');
      setConfirmPassword('');
      setSelectedFile(null);
      setErrorMessage(null);
    }
  }, [isOpen, teamLogo, coachEmail]);

  if (!isOpen) return null;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setErrorMessage('Please select a valid image file (PNG, JPG, SVG, WEBP).');
        return;
      }
      setSelectedFile(file);
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    // Validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password) {
      if (password.length < 6) {
        setErrorMessage('Password must be at least 6 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('Passwords do not match.');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      let finalLogoUrl = logoUrl || teamLogo;

      // Upload file to Supabase storage if selected
      if (selectedFile) {
        try {
          finalLogoUrl = await uploadTeamCrest(teamId, selectedFile);
          setLogoUrl(finalLogoUrl);
          setPreviewUrl(finalLogoUrl);
        } catch (uploadErr: any) {
          console.warn('[CoachTeamInfoModal] Crest file upload error:', uploadErr);
        }
      }

      const res = await updateCoachCredentialsAndLogo({
        teamId,
        coachUserId,
        logoUrl: finalLogoUrl,
        email: email !== coachEmail ? email : undefined,
        password: password ? password : undefined,
      });

      if (!res.success && res.error) {
        setErrorMessage(res.error);
        setIsSubmitting(false);
        return;
      }

      onShowToast('Team logo and coach credentials updated successfully.');
      if (onSuccess) {
        onSuccess({
          logoUrl: finalLogoUrl,
          email: email || undefined,
        });
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name: string) => {
    return (
      name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 3)
        .toUpperCase() || 'EFC'
    );
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0e1c2b] border border-slate-200 dark:border-[#1a2e45] rounded-3xl shadow-2xl overflow-hidden animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Gradient Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#ff0046] via-purple-600 to-[#00b04f]" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#16273b] bg-slate-50/50 dark:bg-[#0b1623]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#ff0046]/10 text-[#ff0046] flex items-center justify-center font-bold shrink-0 border border-[#ff0046]/20 shadow-xs">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white tracking-tight">
                Team & Coach Identity
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Update club logo image and your coach credentials
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#152a40] transition-all cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Governance Notice Banner */}
        <div className="px-6 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs">
          <Lock className="w-3.5 h-3.5 shrink-0" />
          <span className="text-[11px] font-medium leading-tight">
            Team name and squad roster are locked by league governance and cannot be modified here.
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* CARD 1: TEAM DETAILS CARD (GOOGLE FORMS STYLE) */}
          <div className="bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-[#1a2e45] pb-2.5">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Team Details
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Step 1 of 2</span>
            </div>

            {/* Team Name (Locked) */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Team Name (Locked)</span>
              </label>
              <div className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] text-slate-900 dark:text-white font-bold text-xs flex items-center justify-between shadow-2xs">
                <span className="truncate">{teamName}</span>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-[#16273b] text-slate-500 dark:text-slate-400 uppercase border border-slate-200 dark:border-white/5">
                  Protected
                </span>
              </div>
            </div>

            {/* Team Crest Upload */}
            <div className="space-y-2 pt-1">
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
                Team Crest / Logo
              </label>

              <div className="flex items-center gap-4 bg-white dark:bg-[#0e1c2b] p-3 rounded-xl border border-slate-200/80 dark:border-[#1a2e45]">
                {/* Logo Preview */}
                <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-[#152a40] border border-slate-200 dark:border-white/10 flex items-center justify-center p-1 overflow-hidden shrink-0 shadow-2xs">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt={teamName}
                      className="w-full h-full object-contain rounded-lg"
                    />
                  ) : (
                    <span className="text-xs font-black text-slate-400 dark:text-slate-500">
                      {getInitials(teamName)}
                    </span>
                  )}
                </div>

                {/* Upload Action */}
                <div className="flex-1 space-y-1">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Logo Image</span>
                    </button>

                    {selectedFile && (
                      <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold truncate max-w-[160px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                        <span>{selectedFile.name}</span>
                      </span>
                    )}
                  </div>

                  <p className="text-[10px] text-slate-400">
                    PNG, JPG, SVG or WEBP. Uploaded image will be stored directly in the database.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CARD 2: COACH DETAILS CARD (GOOGLE FORMS STYLE) */}
          <div className="bg-slate-50 dark:bg-[#112236] border border-slate-200/80 dark:border-[#1a2e45] rounded-2xl p-5 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-[#1a2e45] pb-2.5">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                  Coach Details
                </h3>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Step 2 of 2</span>
            </div>

            {/* Coach Email */}
            <div>
              <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-slate-400" />
                <span>Coach Account Email</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="coach@egerton.ac.ke"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
              />
            </div>

            {/* Coach Password Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3 text-slate-400" />
                  <span>New Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] text-slate-900 dark:text-white text-xs pr-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1.5 flex items-center gap-1.5">
                  <KeyRound className="w-3 h-3 text-slate-400" />
                  <span>Confirm Password</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#0e1c2b] border border-slate-200/80 dark:border-[#1a2e45] text-slate-900 dark:text-white text-xs pr-9 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all shadow-2xs"
                  />
                </div>
              </div>
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            Only enter a password if you wish to change your coach login credentials.
          </p>

          {/* Form Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-[#16273b]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-[#152a40] dark:hover:bg-[#1c3857] text-slate-700 dark:text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2 rounded-xl bg-[#ff0046] hover:bg-[#e0003c] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CoachTeamInfoModal;
