import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  ThumbsUp,
  ThumbsDown,
  Loader2,
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
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#0e1c2b] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm shadow-2xl overflow-hidden my-auto select-none"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Accent Strip */}
        <div className="h-1 w-full bg-[#ff0046]" />

        {/* Header Bar */}
        <div className="px-4 py-3 sm:px-5 sm:py-3.5 bg-[#f8f9fa] dark:bg-[#112236] border-b border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-500/10 text-[#ff0046] border border-rose-500/20">
              COMMUNITY POLL
            </span>
            <h3 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900 dark:text-white">
              Weekend Match Predictor Challenge
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Linear Stacked Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
          {/* 1. HOW IT WORKS (Linear, clear, numbered steps) */}
          <div className="bg-white dark:bg-[#0c1825] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-3.5 space-y-2.5">
            <div className="flex items-center gap-2 border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-2">
              <span className="w-2 h-2 rounded-full bg-[#ff0046]" />
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                How It Works
              </h4>
            </div>

            <div className="space-y-2">
              {/* Step 1 */}
              <div className="flex items-start gap-2.5 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-[#152a42] text-slate-700 dark:text-slate-200 text-[11px] font-black shrink-0 border border-[#e6e8ec] dark:border-[#1a2e45]">
                  1
                </span>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">Thursday Unlock:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Upcoming weekend fixtures open every Thursday evening for all fans to participate.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex items-start gap-2.5 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-[#152a42] text-slate-700 dark:text-slate-200 text-[11px] font-black shrink-0 border border-[#e6e8ec] dark:border-[#1a2e45]">
                  2
                </span>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">Guess Outcomes:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    Select Home Win, Draw, or Away Win for each fixture before match kickoff.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex items-start gap-2.5 text-xs">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 dark:bg-[#152a42] text-slate-700 dark:text-slate-200 text-[11px] font-black shrink-0 border border-[#e6e8ec] dark:border-[#1a2e45]">
                  3
                </span>
                <div className="space-y-0.5">
                  <span className="font-bold text-slate-900 dark:text-white">Check Your Score:</span>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">
                    At full-time, see how many matches you guessed correctly directly on your device.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 2. THE COMMUNITY POLL (Linear card with clear question & choices) */}
          <div className="bg-[#f8f9fa] dark:bg-[#0c1825] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-3.5 space-y-3">
            <div className="flex items-center justify-between border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                COMMUNITY VOICE (1 VOTE PER DEVICE)
              </span>
              <span className="text-[10px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ACTIVE
              </span>
            </div>

            <p className="text-xs font-bold text-slate-900 dark:text-white leading-relaxed">
              Would you like this weekly match predictor challenge added to Egerton Sports Network?
            </p>

            {loadingStatus ? (
              <div className="py-3 flex items-center justify-center gap-2 text-xs text-slate-500">
                <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
                <span>Checking device vote status...</span>
              </div>
            ) : deviceStatus.hasVoted ? (
              <div className="bg-white dark:bg-[#102237] border border-emerald-500/30 rounded-none sm:rounded-sm p-3 text-center space-y-2">
                <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div className="text-xs font-bold text-slate-900 dark:text-white">
                  Your feedback has been recorded:
                </div>
                <div className="inline-block px-3 py-0.5 rounded text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                  {deviceStatus.vote === 'yes' ? '👍 Yes, Great Idea!' : '👎 No, Prefer Not'}
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400">
                  Thank you for helping shape the platform!
                </p>
                <button
                  type="button"
                  onClick={onClose}
                  className="mt-1 w-full py-1.5 px-3 rounded-none sm:rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-[#1b3450] dark:hover:bg-[#234368] text-slate-800 dark:text-white text-xs font-bold transition-colors cursor-pointer border border-[#e6e8ec] dark:border-[#1a2e45]"
                >
                  Return to Fixtures
                </button>
              </div>
            ) : isSubmitting ? (
              <div className="bg-white dark:bg-[#102237] border border-emerald-500/30 rounded-none sm:rounded-sm p-3.5 text-center space-y-1.5 animate-in zoom-in-95 duration-150">
                <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                <div className="text-xs font-black text-slate-900 dark:text-white">
                  Thank you! Recorded: {justVotedChoice === 'yes' ? 'Yes, Great Idea!' : 'No, Prefer Not'}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Returning to fixtures...
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => handleVote('yes')}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-none sm:rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors cursor-pointer active:scale-98 shadow-xs"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>Yes, Great Idea!</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleVote('no')}
                  className="flex items-center justify-center gap-2 py-2 px-3 rounded-none sm:rounded-sm bg-slate-100 hover:bg-slate-200 dark:bg-[#152a42] dark:hover:bg-[#1c3857] text-slate-800 dark:text-slate-200 font-bold text-xs transition-colors cursor-pointer active:scale-98 border border-[#e6e8ec] dark:border-[#1a2e45]"
                >
                  <ThumbsDown className="w-3.5 h-3.5 text-slate-400" />
                  <span>No, Prefer Not</span>
                </button>
              </div>
            )}
          </div>

          {/* 3. THE NB (BELOW THE POLL: Linear, reassuring note matching guest page) */}
          <div className="bg-white dark:bg-[#0c1825] border border-[#e6e8ec] dark:border-[#1a2e45] rounded-none sm:rounded-sm p-3.5 space-y-2">
            <div className="flex items-center gap-2 border-b border-[#e6e8ec] dark:border-[#1a2e45] pb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <h5 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">
                NB: Important Guidelines & Mental Peace
              </h5>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
              <div className="flex items-start gap-2">
                <span className="text-[#ff0046] font-black leading-none mt-1">•</span>
                <p>
                  <strong className="text-slate-900 dark:text-white">Purely for Fun:</strong> A casual activity for fans to test team knowledge.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#ff0046] font-black leading-none mt-1">•</span>
                <p>
                  <strong className="text-slate-900 dark:text-white">Zero Money:</strong> Absolutely no money, betting, tokens, or gambling.
                </p>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-[#ff0046] font-black leading-none mt-1">•</span>
                <p>
                  <strong className="text-slate-900 dark:text-white">100% Private:</strong> Predictions and personal scores remain on your device only.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Minimalist Footer Bar */}
        <div className="px-4 py-2.5 bg-[#f8f9fa] dark:bg-[#112236] border-t border-[#e6e8ec] dark:border-[#1a2e45] flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span>1 anonymous vote per device</span>
          <span>Egerton Sports Network</span>
        </div>
      </div>
    </div>
  );
};
