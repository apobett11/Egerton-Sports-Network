import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  Gamepad2,
  Calendar,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
  HeartHandshake,
} from 'lucide-react';
import { FeaturePollService, type DevicePollStatus } from '../../services/featurePollService';

interface MatchPredictionNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  deviceId: string;
}

export const MatchPredictionNoticeModal: React.FC<MatchPredictionNoticeModalProps> = ({
  isOpen,
  onClose,
  deviceId,
}) => {
  const [deviceStatus, setDeviceStatus] = useState<DevicePollStatus>({
    hasVoted: false,
    vote: null,
  });
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [justVotedChoice, setJustVotedChoice] = useState<'yes' | 'no' | null>(null);

  useEffect(() => {
    if (!isOpen || !deviceId) return;
    let isMounted = true;

    const checkVote = async () => {
      setLoadingStatus(true);
      try {
        const res = await FeaturePollService.checkDeviceVote(deviceId);
        if (isMounted) {
          setDeviceStatus(res);
        }
      } catch (e) {
        console.warn('Error checking device vote status:', e);
      } finally {
        if (isMounted) setLoadingStatus(false);
      }
    };

    checkVote();

    return () => {
      isMounted = false;
    };
  }, [isOpen, deviceId]);

  if (!isOpen) return null;

  const handleVote = async (choice: 'yes' | 'no') => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setJustVotedChoice(choice);

    try {
      await FeaturePollService.submitVote(deviceId, choice);
      setDeviceStatus({ hasVoted: true, vote: choice });

      // After brief friendly feedback, smoothly close and return to guest homepage
      setTimeout(() => {
        setIsSubmitting(false);
        onClose();
      }, 750);
    } catch (err) {
      console.warn('Vote submission error:', err);
      setIsSubmitting(false);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg bg-[#0e1c2b] text-white border border-[#1e3857] rounded-2xl shadow-2xl overflow-hidden my-auto select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Banner */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-br from-[#13283f] via-[#0e1c2b] to-[#0a1522] border-b border-[#1b3450]">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5 mb-2">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                Feature Preview & Fan Poll
              </span>
              <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-1">
                Weekend Match Predictor Challenge
              </h3>
            </div>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* 1. HOW IT WILL WORK (Concise, engaging, linear visual steps) */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              <span>How It Works</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* Step 1 */}
              <div className="p-3 rounded-xl bg-[#132437] border border-[#1e3a5a] flex sm:flex-col items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-black shrink-0">
                  1
                </span>
                <div>
                  <h4 className="text-xs font-black text-white">Thursday Unlock</h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    EPL weekend fixtures open every Thursday evening for all fans.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-xl bg-[#132437] border border-[#1e3a5a] flex sm:flex-col items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black shrink-0">
                  2
                </span>
                <div>
                  <h4 className="text-xs font-black text-white">Guess Outcomes</h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    Pick <strong className="text-emerald-400 font-bold">Home</strong>, <strong className="text-amber-400 font-bold">Draw</strong>, or <strong className="text-sky-400 font-bold">Away</strong> before kickoff.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-xl bg-[#132437] border border-[#1e3a5a] flex sm:flex-col items-start gap-2.5">
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-sky-500/20 text-sky-400 text-xs font-black shrink-0">
                  3
                </span>
                <div>
                  <h4 className="text-xs font-black text-white">Check Your Score</h4>
                  <p className="text-[11px] text-slate-300 leading-snug mt-0.5">
                    See how many you got right at full-time right on your device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. THE COMMUNITY POLL (Right below How It Works) */}
          <div className="p-4 rounded-xl bg-[#112236] border border-amber-500/30 space-y-3">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                <span>Community Voice: Should We Launch This?</span>
              </div>
              <p className="text-[11px] text-slate-300">
                Help decide whether we add this game to Egerton Sports Network (1 vote per device):
              </p>
            </div>

            {loadingStatus ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Checking device status...</span>
              </div>
            ) : deviceStatus.hasVoted ? (
              <div className="bg-[#0e1c2b] border border-emerald-500/30 rounded-xl p-3.5 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-white">
                  Your feedback has been recorded:
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {deviceStatus.vote === 'yes' ? '👍 Yes, Great Idea!' : '👎 No, Prefer Not'}
                </div>
                <p className="text-[10px] text-slate-400">
                  Thank you for helping shape the platform!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 w-full py-2 px-4 rounded-xl bg-[#1b3450] hover:bg-[#234368] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Return to Fixtures
                </button>
              </div>
            ) : isSubmitting ? (
              <div className="bg-[#0e1c2b] border border-emerald-500/40 rounded-xl p-4 text-center space-y-2 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-xs font-black text-white">
                  Thank you! Recorded: {justVotedChoice === 'yes' ? 'Yes, Great Idea!' : 'No, Prefer Not'}
                </div>
                <p className="text-[11px] text-slate-300">
                  Returning to fixtures...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleVote('yes')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/40 transition-transform active:scale-95 cursor-pointer border border-emerald-400/30"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Yes, Great Idea!</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVote('no')}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#172a3e] hover:bg-[#1f3752] text-slate-200 font-bold text-xs transition-colors active:scale-95 cursor-pointer border border-white/10"
                >
                  <ThumbsDown className="w-4 h-4 text-slate-400" />
                  <span>No, Prefer Not</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. THE NB (BELOW THE POLL: Linear, reassuring psychological safety note) */}
          <div className="rounded-xl p-3.5 bg-gradient-to-r from-emerald-950/30 via-[#102a24]/30 to-teal-950/30 border border-emerald-500/25 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-300 uppercase tracking-wider">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>NB: Important Guidelines & Mental Peace</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-emerald-100/90 pt-0.5">
              <div className="flex items-center gap-1.5 bg-[#0a1827]/60 p-2 rounded-lg border border-emerald-500/15">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong className="text-white">Purely for Fun:</strong> Casual game to test team knowledge.</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0a1827]/60 p-2 rounded-lg border border-emerald-500/15">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong className="text-white">Zero Money:</strong> Absolutely no money, tokens, or gambling.</span>
              </div>
              <div className="flex items-center gap-1.5 bg-[#0a1827]/60 p-2 rounded-lg border border-emerald-500/15">
                <span className="text-emerald-400 font-bold">•</span>
                <span><strong className="text-white">100% Private:</strong> Scores stay on your device only.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="px-6 py-3 bg-[#0a1522] border-t border-[#172c44] flex items-center justify-between text-[10px] text-slate-500">
          <span>Anonymous Device ID Indexed</span>
          <span>ESN Community Determinant</span>
        </div>
      </div>
    </div>
  );
};
