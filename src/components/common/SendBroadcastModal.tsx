import React, { useState } from 'react';
import { X, Send, Image, Radio, Sparkles, ExternalLink, ShieldCheck, Loader2, Clock, Calendar } from 'lucide-react';
import { BroadcastService, getToday820PMString } from '../../services/broadcastService';

interface SendBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

const CATEGORIES = [
  { id: 'DERBY', label: 'Derby Match Alert', icon: '⚽' },
  { id: 'MATCH_ALERT', label: 'Match Alert', icon: '🚨' },
  { id: 'POTW', label: 'Player of the Week', icon: '⭐' },
  { id: 'BREAKING', label: 'Breaking News', icon: '⚡' },
  { id: 'GENERAL', label: 'General Notice', icon: '📢' },
];

export const SendBroadcastModal: React.FC<SendBroadcastModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<string>('GENERAL');
  const [message, setMessage] = useState<string>('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [actionUrl, setActionUrl] = useState<string>('#/banter');
  const [scheduledFor, setScheduledFor] = useState<string>(() => getToday820PMString());
  const [isScheduled, setIsScheduled] = useState<boolean>(false);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const toLocalInputFormat = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      if (isNaN(d.getTime())) return '';
      const pad = (n: number) => String(n).padStart(2, '0');
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    } catch {
      return '';
    }
  };

  const handleApplyDerbyPreset = () => {
    setTitle('Matchday Announcement ⚽');
    setCategory('DERBY');
    setMessage('Upcoming matchday fixtures are live. Predict who you think will win the match!');
    setImageUrl('');
    setActionUrl('#/predictions');
    setScheduledFor(getToday820PMString());
    setIsScheduled(false);
  };

  const handleClear = () => {
    setTitle('');
    setMessage('');
    setImageUrl('');
    setActionUrl('#/banter');
    setIsScheduled(false);
    setErrorMsg(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMsg('Notification headline is required.');
      return;
    }
    if (!message.trim()) {
      setErrorMsg('Message body is required.');
      return;
    }

    setIsSending(true);
    setErrorMsg(null);

    try {
      const scheduledPayload = isScheduled && scheduledFor ? scheduledFor : undefined;
      const res = await BroadcastService.sendBroadcast({
        title: title.trim(),
        message: message.trim(),
        image_url: imageUrl.trim() || undefined,
        category,
        action_url: actionUrl.trim() || '#/banter',
        scheduled_for: scheduledPayload,
      });

      if (res.success) {
        if (onSuccess) {
          onSuccess(
            isScheduled
              ? 'Mass broadcast scheduled for today at 8:20 PM!'
              : 'Rich Dropdown Broadcast alert dispatched!'
          );
        }
        onClose();
      } else {
        setErrorMsg(res.error || 'Failed to dispatch broadcast');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error dispatching broadcast notification');
    } finally {
      setIsSending(false);
    }
  };

  const formattedPreviewMessage = message
    ? message.replace(/\\n|\/n/g, '\n')
    : 'Notification message preview will appear here...';

  return (
    <div
      className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl bg-[#121316] border border-purple-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-auto max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-purple-950/40 via-[#181920] to-[#121316] border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                <span>EgerScore Dispatcher • In-App Rich Alert</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  STRING STORAGE
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                Drops down a branded native notification banner across phones and computers
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Preset Action Bar */}
        <div className="px-5 py-2.5 bg-purple-950/20 border-b border-zinc-800/80 flex items-center justify-between flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-zinc-300 font-semibold">Quick Presets:</span>
            <button
              type="button"
              onClick={handleApplyDerbyPreset}
              className="px-2.5 py-1 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 font-bold text-[11px] transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>🔥 Official Derby Saturday Banner</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleClear}
            className="text-zinc-400 hover:text-zinc-200 text-[11px] underline cursor-pointer"
          >
            Clear Form
          </button>
        </div>

        {/* Modal Body: Split Form + Live Mobile Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-y-auto">
          {/* Form Composer (7 cols) */}
          <form onSubmit={handleSubmit} className="lg:col-span-7 p-5 sm:p-6 space-y-4 border-b lg:border-b-0 lg:border-r border-zinc-800">
            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Category Select */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                Category Pill
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all text-left flex items-center gap-2 cursor-pointer ${
                      category === cat.id
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30 border border-purple-400'
                        : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Headline Title */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Headline Title
                </label>
                <span className={`text-[10px] font-mono ${title.length > 55 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {title.length}/60
                </span>
              </div>
              <input
                type="text"
                value={title}
                maxLength={60}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Egerton Derby Satoo! ⚽🔥🔥"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 focus:outline-hidden text-sm text-white placeholder-zinc-500 transition-colors"
                required
              />
            </div>

            {/* Message Body */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  Notification Message Body
                </label>
                <span className={`text-[10px] font-mono ${message.length > 185 ? 'text-amber-400' : 'text-zinc-500'}`}>
                  {message.length}/200
                </span>
              </div>
              <textarea
                value={message}
                maxLength={200}
                rows={3}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="e.g. kuma derby ya Egerton Premier Leage satoo⚽🔥🔥&#10;you can now predict who you think will win teh match😎."
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 focus:outline-hidden text-xs text-white placeholder-zinc-500 transition-colors resize-none leading-relaxed"
                required
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Line breaks will render cleanly in the mobile dropdown banner.
              </span>
            </div>

            {/* Image URL */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <Image className="w-3.5 h-3.5 text-purple-400" />
                  <span>Rich Media Image URL (Match poster / graphic)</span>
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="e.g. /derby-notification.png or public Supabase URL"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 focus:outline-hidden text-xs text-white placeholder-zinc-500 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl('/derby-notification.png')}
                  className="px-2.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-[11px] font-semibold border border-zinc-700 transition-colors cursor-pointer shrink-0"
                  title="Use Screenshot Asset"
                >
                  Use Derby Screenshot
                </button>
              </div>
            </div>

            {/* Destination Link */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <ExternalLink className="w-3.5 h-3.5 text-purple-400" />
                  <span>Action Navigation Link</span>
                </label>
              </div>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="e.g. #/banter or #/predictions or #/table"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-900/90 border border-zinc-800 focus:border-purple-500 focus:outline-hidden text-xs text-white placeholder-zinc-500 transition-colors font-mono"
              />
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[10px] text-zinc-500">Suggested:</span>
                <button
                  type="button"
                  onClick={() => setActionUrl('#/banter')}
                  className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                >
                  #/banter (Banter Page)
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => setActionUrl('#/predictions')}
                  className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                >
                  #/predictions (Picks Slip)
                </button>
                <span className="text-zinc-700">•</span>
                <button
                  type="button"
                  onClick={() => setActionUrl('#/table')}
                  className="text-[10px] text-purple-400 hover:underline cursor-pointer"
                >
                  #/table (Standings)
                </button>
              </div>
            </div>

            {/* Scheduled Send Delivery Control (Mass notification at set time e.g. 8:20 PM) */}
            <div className="p-3.5 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-purple-400" />
                  <span>Dispatch Schedule (Mass Notification)</span>
                </label>
                <div className="flex items-center gap-1.5 text-[10px]">
                  <button
                    type="button"
                    onClick={() => {
                      setIsScheduled(false);
                      setScheduledFor('');
                    }}
                    className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      !isScheduled
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    ⚡ Immediate
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsScheduled(true);
                      setScheduledFor(getToday820PMString());
                    }}
                    className={`px-2 py-1 rounded-md font-bold transition-all cursor-pointer ${
                      isScheduled
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    ⏰ Scheduled
                  </button>
                </div>
              </div>

              {isScheduled && (
                <div className="space-y-2 pt-1 border-t border-purple-500/20">
                  <div className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={toLocalInputFormat(scheduledFor)}
                      onChange={(e) => {
                        const d = new Date(e.target.value);
                        if (!isNaN(d.getTime())) {
                          setScheduledFor(d.toISOString());
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-purple-500/30 focus:border-purple-400 focus:outline-hidden text-xs text-white transition-colors font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setScheduledFor(getToday820PMString())}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 text-[11px] font-bold border border-purple-500/40 transition-colors cursor-pointer shrink-0"
                      title="Set to exactly 8:20 PM today"
                    >
                      Today 8:20 PM
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
                    <Calendar className="w-3 h-3 text-purple-400 shrink-0" />
                    <span>
                      Will be delivered to all connected devices at{' '}
                      <strong className="text-purple-300">
                        {new Date(scheduledFor || getToday820PMString()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </strong>
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:brightness-110 active:scale-[0.99] text-white font-black text-sm tracking-wide shadow-lg shadow-purple-900/40 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
              >
                {isSending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    <span>{isScheduled ? 'Scheduling Mass Broadcast...' : 'Broadcasting to Connected Devices...'}</span>
                  </>
                ) : isScheduled ? (
                  <>
                    <Clock className="w-4 h-4 text-amber-300" />
                    <span>Schedule Mass Broadcast for 8:20 PM</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch Real-Time Rich Broadcast Alert</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Live Mobile Screen Mock Preview (5 cols) */}
          <div className="lg:col-span-5 p-5 sm:p-6 bg-[#090a0d] flex flex-col items-center justify-center space-y-4">
            <div className="w-full flex items-center justify-between text-xs text-zinc-400 font-bold uppercase tracking-wider">
              <span>Live Phone Mock Preview</span>
              <span className="text-purple-400 text-[10px]">What users will see</span>
            </div>

            {/* Phone Screen Frame */}
            <div className="w-full max-w-sm rounded-3xl border-2 border-zinc-700 bg-zinc-950 p-3 shadow-2xl relative overflow-hidden min-h-[380px] flex flex-col justify-start">
              {/* Phone Dynamic Island Mock Header */}
              <div className="w-full flex justify-between items-center px-3 py-1 mb-3 text-[10px] text-zinc-400 font-mono">
                <span>9:41</span>
                <div className="w-20 h-3.5 bg-black rounded-full border border-zinc-800" />
                <span>5G 100%</span>
              </div>

              {/* In-App Dropdown Card Preview */}
              <div className="w-full bg-zinc-950/95 border border-purple-500/40 backdrop-blur-xl rounded-2xl shadow-2xl p-3.5 text-left relative overflow-hidden group">
                {/* Top Bar */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-6 h-6 object-contain rounded-md bg-purple-600/20 p-0.5 border border-purple-500/30 flex items-center justify-center shrink-0">
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                        <path d="M12 2L4 5.5V11.5C4 16.8 7.4 21.2 12 22.5C16.6 21.2 20 16.8 20 11.5V5.5L12 2Z" fill="#ff0046" />
                        <path d="M12 4L5.5 6.8V11.5C5.5 15.8 8.3 19.4 12 20.6C15.7 19.4 18.5 15.8 18.5 11.5V6.8L12 4Z" fill="#0e1e2d" opacity="0.3" />
                        <path d="M8.5 7.5H15.5V9.3H11V11.2H14.5V13H11V15.2H15.5V17H8.5V7.5Z" fill="#ffffff" />
                      </svg>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 truncate">
                      <span className="text-[11px] font-black text-white tracking-tight flex items-center gap-1">
                        egerscore.com
                        <ShieldCheck className="w-3 h-3 text-purple-400 fill-purple-400/20" />
                      </span>
                      <span className="text-zinc-600 text-xs">•</span>
                      <span className="text-[9.5px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-500/15 px-1.5 py-0.5 rounded-full border border-purple-500/30 truncate">
                        {category}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] text-zinc-400 font-medium">Just now</span>
                    <span className="p-1 text-zinc-400 hover:text-white rounded-lg">
                      <X className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>

                {/* Message Headline & Text */}
                <div className="mt-2">
                  <h4 className="text-xs font-black text-white leading-tight">
                    {title || 'Headline Title...'}
                  </h4>
                  <p className="text-[11px] text-zinc-300 leading-normal mt-1 whitespace-pre-line">
                    {formattedPreviewMessage}
                  </p>
                </div>

                {/* Image Container */}
                {imageUrl && (
                  <div className="w-full h-32 max-h-36 rounded-xl mt-2 overflow-hidden border border-zinc-800 bg-zinc-900 relative">
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as any).src = '/derby-notification.png';
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[8.5px] font-black text-purple-300 uppercase tracking-wider flex items-center gap-1">
                      {isScheduled ? (
                        <>
                          <Clock className="w-2.5 h-2.5 text-amber-400" />
                          <span>SCHEDULED: 8:20 PM</span>
                        </>
                      ) : (
                        <>
                          <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" />
                          <span>LIVE DERBY ALERT</span>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* Reactions & Action Prompt */}
                <div className="mt-2.5 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-1">
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">🔥 0</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">⚽ 0</span>
                    <span className="px-1.5 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-[10px] text-zinc-300">🏆 0</span>
                  </div>

                  <div className="text-purple-400 font-bold flex items-center gap-1">
                    <span>View Details →</span>
                  </div>
                </div>

                {/* Progress Bar line */}
                <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-400" />
              </div>

              {/* Faux Background UI in Mock Screen */}
              <div className="flex-1 mt-4 space-y-2 opacity-20 pointer-events-none">
                <div className="h-10 bg-zinc-800 rounded-xl w-full" />
                <div className="h-16 bg-zinc-800 rounded-xl w-full" />
                <div className="h-16 bg-zinc-800 rounded-xl w-full" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
