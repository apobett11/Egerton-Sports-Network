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
        <div className="p-5 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Summary of How It Works */}
          <div className="space-y-3 bg-[#132437]/80 rounded-xl p-4 border border-[#1d3856]">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-300">
              <Gamepad2 className="w-4 h-4 text-emerald-400" />
              <span>How This Feature Will Work</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Every <strong className="text-white">Thursday evening</strong>, all EPL fixtures for the upcoming weekend unlock for fans. Before kickoff, test your football intuition by picking either a <strong className="text-emerald-400">Home Win</strong>, <strong className="text-amber-400">Draw</strong>, or <strong className="text-sky-400">Away Win</strong> for each match.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1 text-[11px] text-slate-300">
              <div className="flex items-start gap-1.5 bg-[#0e1c2b] p-2.5 rounded-lg border border-white/5">
                <Calendar className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Open Thursday to kickoff on your device</span>
              </div>
              <div className="flex items-start gap-1.5 bg-[#0e1c2b] p-2.5 rounded-lg border border-white/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>Private score tally after the final whistle</span>
              </div>
            </div>
          </div>

          {/* Psychological Well-being & Fun Notice (NB) */}
          <div className="rounded-xl p-4 bg-gradient-to-r from-emerald-950/40 via-[#102a24]/40 to-teal-950/40 border border-emerald-500/30 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-black text-emerald-300 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Important: A Fun & Purely Personal Experience</span>
            </div>
            <p className="text-xs text-emerald-100/90 leading-relaxed">
              To protect the mental peace and psychology of our fans, this game is crafted <strong className="text-emerald-200 font-bold">purely for fun and personal enjoyment</strong>.
            </p>
            <ul className="text-[11px] text-emerald-200/80 space-y-1.5 pl-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span><strong className="text-white">Zero Money:</strong> Absolutely no money, tokens, currency, or gambling involved.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span><strong className="text-white">100% Private:</strong> Your picks are strictly personal to your device and never shared with other fans, public leaderboards, or admins.</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span><strong className="text-white">Stress-Free:</strong> Enjoy testing how well you know your team without social pressure.</span>
              </li>
            </ul>
          </div>

          {/* Determinant Yes/No Poll Section */}
          <div className="pt-2 border-t border-[#1a334f] space-y-3">
            <div className="text-center space-y-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-black text-slate-200">
                <HeartHandshake className="w-4 h-4 text-amber-400" />
                <span>Community Voice: Should We Launch This?</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Do you think this fan prediction game would be a great addition to the app? (1 vote per device)
              </p>
            </div>

            {loadingStatus ? (
              <div className="py-4 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                <span>Checking device vote status...</span>
              </div>
            ) : deviceStatus.hasVoted ? (
              <div className="bg-[#122438] border border-emerald-500/30 rounded-xl p-4 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">
                  Your feedback has been recorded on this device:
                </div>
                <div className="inline-block px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {deviceStatus.vote === 'yes' ? '👍 Yes, Great Idea' : '👎 No, Prefer Not'}
                </div>
                <p className="text-[10px] text-slate-400 pt-1">
                  Thank you for helping shape Egerton Sports Network!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-2 w-full py-2 px-4 rounded-xl bg-[#1b3450] hover:bg-[#234368] text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Return to Fixtures
                </button>
              </div>
            ) : isSubmitting ? (
              <div className="bg-[#122438] border border-emerald-500/40 rounded-xl p-5 text-center space-y-2 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto animate-bounce" />
                <div className="text-xs font-black text-white">
                  Thank you! Recorded: {justVotedChoice === 'yes' ? 'Yes, Great Idea' : 'No, Prefer Not'}
                </div>
                <p className="text-[11px] text-slate-300">
                  Returning to fixtures...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => handleVote('yes')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/40 transition-transform active:scale-95 cursor-pointer border border-emerald-400/30"
                >
                  <ThumbsUp className="w-4 h-4" />
                  <span>Yes, Great Idea!</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVote('no')}
                  className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#172a3e] hover:bg-[#1f3752] text-slate-200 font-bold text-xs transition-colors active:scale-95 cursor-pointer border border-white/10"
                >
                  <ThumbsDown className="w-4 h-4 text-slate-400" />
                  <span>No, Prefer Not</span>
                </button>
              </div>
            )}
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
