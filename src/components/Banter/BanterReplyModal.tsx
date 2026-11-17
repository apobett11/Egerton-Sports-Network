import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Film, BarChart2 } from 'lucide-react';
import { banterService } from '../../services/predictions/banterService';
import { anonymousIdentityService } from '../../services/predictions/anonymousIdentityService';
import { getActiveSessionProfile } from '../../utils/sessionIdentity';
import { getAuthorIdentityMeta } from '../../lib/predictions/footballAvatars';
import { formatRelativeTime } from '../../lib/predictions/utils';
import { compressAndStripImage } from '../../lib/predictions/mediaOptimizer';
import type { BanterPost, BanterMediaType } from '../../types/predictions';

interface BanterReplyModalProps {
  post: BanterPost;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const MAX_CHARS = 280;

export const BanterReplyModal: React.FC<BanterReplyModalProps> = ({
  post,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOption1, setPollOption1] = useState('');
  const [pollOption2, setPollOption2] = useState('');
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<BanterMediaType>('NONE');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const session = getActiveSessionProfile();
  const parentMeta = getAuthorIdentityMeta(post);
  const myMeta = getAuthorIdentityMeta({
    authorHandle: session?.authorHandle || 'You',
    authorName: session?.authorName || 'You',
    authorAvatar: session?.avatarColor
  });

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      setContent('');
      setShowPoll(false);
      setMediaPreview(null);
      setMediaType('NONE');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (type === 'image') {
      try {
        const optimized = await compressAndStripImage(file, 1080, 0.82);
        setMediaPreview(optimized.dataUrl);
        setMediaType('IMAGE');
        return;
      } catch {
        // fallback
      }
    }

    const reader = new FileReader();
    reader.onload = () => {
      setMediaPreview(reader.result as string);
      setMediaType(type === 'video' ? 'VIDEO' : 'IMAGE');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !mediaPreview && !pollOption1) return;

    const trimmed = content.trim();
    const mediaUrls = mediaPreview ? [mediaPreview] : undefined;
    const pollData = showPoll && pollOption1 && pollOption2
      ? { question: pollQuestion.trim() || trimmed.slice(0, 50) || 'Quick Poll', options: [pollOption1.trim(), pollOption2.trim()] }
      : undefined;

    // Instant UI feedback for parent post
    if (onSuccess) onSuccess();
    onClose();

    // Background asynchronous promise
    Promise.resolve().then(() => {
      return banterService.createPost(trimmed, post.matchId, post.matchContext, mediaUrls?.[0], {
        parentId: post.id,
        mediaUrls,
        mediaType,
        poll: pollData,
        authorDeviceId: session?.deviceId || anonymousIdentityService.getIdentity().deviceId,
        uid: session?.uid,
        authorName: session?.authorName,
        authorHandle: session?.authorHandle,
        authorAvatar: session?.avatarColor
      });
    }).catch(console.warn);
  };

  const parentMediaUrl = post.mediaUrls?.[0] || post.imageUrl;
  const charsRemaining = MAX_CHARS - content.length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center bg-black/80 backdrop-blur-xs transition-opacity p-0 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-xl bg-zinc-950 border border-zinc-800 rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden transition-all animate-in fade-in zoom-in-95 duration-150 my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header bar with Close Button */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800/80 bg-zinc-900/60 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-zinc-400">Reply</span>
          <div className="w-7" />
        </div>

        {/* Scrollable Thread Content: Parent Post connected directly to Reply Composer */}
        <div className="p-4 overflow-y-auto flex-1">
          {/* Thread Connector Grid: Left column has avatars and vertical connecting line */}
          <div className="flex gap-3">
            {/* Left Column: Avatars & Thread Line */}
            <div className="flex flex-col items-center shrink-0 w-10">
              <img
                src={parentMeta.avatarUrl}
                alt={parentMeta.displayName}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10 shrink-0"
              />
              {/* Continuous vertical line attaching replied message to reply input (Twitter/X style) */}
              <div className="w-0.5 grow bg-zinc-700/80 my-1 rounded-full min-h-[32px]" />
              <img
                src={myMeta.avatarUrl}
                alt={myMeta.displayName}
                className="h-10 w-10 rounded-full object-cover ring-1 ring-white/10 shrink-0"
              />
            </div>

            {/* Right Column: Parent post details and seamlessly attached Reply Input */}
            <div className="flex-1 min-w-0 flex flex-col justify-between">
              {/* Parent Message Section */}
              <div className="pb-3">
                <div className="flex items-center gap-1.5 flex-wrap text-xs">
                  <span className="font-bold text-white truncate max-w-[150px] sm:max-w-[200px]">
                    {parentMeta.displayName}
                  </span>
                  {parentMeta.isCoach && (
                    <span className="text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 py-0.2 rounded font-bold">
                      COACH
                    </span>
                  )}
                  {parentMeta.isJournalist && (
                    <span className="text-[9px] bg-sky-500/20 text-sky-400 border border-sky-500/30 px-1 py-0.2 rounded font-bold">
                      PRESS
                    </span>
                  )}
                  <span className="text-zinc-500 font-mono text-[11px]">
                    @{post.authorHandle.replace(/[^a-z0-9_]/gi, '')}
                  </span>
                  <span className="text-zinc-600">·</span>
                  <span className="text-zinc-500 text-[11px]">
                    {formatRelativeTime(post.createdAt)}
                  </span>
                </div>

                {/* Full parent content - fully visible so one knows what message they are replying to */}
                <div className="mt-1 text-sm text-zinc-200 whitespace-pre-wrap break-words leading-relaxed select-text">
                  {post.content}
                </div>

                {/* Parent Media Attachment (if present) */}
                {parentMediaUrl && (
                  <div className="mt-2.5 rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-36 max-w-xs">
                    <img
                      src={parentMediaUrl}
                      alt="Replied media"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                {/* Parent Poll Summary (if present) */}
                {post.poll && (
                  <div className="mt-2 p-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-xs text-zinc-300">
                    <span className="font-semibold text-sky-400">📊 {post.poll.question}</span>
                  </div>
                )}

                {/* Replying to indicator */}
                <div className="mt-2 text-xs text-zinc-500">
                  Replying to{' '}
                  <span className="text-[#1d9bf0] font-medium">
                    @{post.authorHandle.replace(/[^a-z0-9_]/gi, '')}
                  </span>
                </div>
              </div>

              {/* Reply Composer Input Form */}
              <form onSubmit={handleSubmit} className="pt-2 flex flex-col gap-2">
                <textarea
                  ref={inputRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="Post your reply"
                  rows={3}
                  className="w-full bg-transparent border-0 focus:ring-0 p-0 text-sm text-white placeholder-zinc-500 focus:outline-none resize-none leading-relaxed font-sans"
                />

                {/* Media Preview */}
                {mediaPreview && (
                  <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-40 flex items-center justify-center my-1">
                    {mediaType === 'VIDEO' ? (
                      <video src={mediaPreview} controls className="w-full h-full object-contain" />
                    ) : (
                      <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
                    )}
                    <button
                      type="button"
                      onClick={() => { setMediaPreview(null); setMediaType('NONE'); }}
                      className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Optional Poll attachment fields */}
                {showPoll && (
                  <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-2.5 space-y-2 my-1">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Ask a question (optional)..."
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={pollOption1}
                      onChange={(e) => setPollOption1(e.target.value)}
                      placeholder="Option 1"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                    />
                    <input
                      type="text"
                      value={pollOption2}
                      onChange={(e) => setPollOption2(e.target.value)}
                      placeholder="Option 2"
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                )}

                {/* Action Toolbar */}
                <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60 mt-1">
                  <div className="flex items-center gap-1 text-sky-400">
                    {/* Image Attach */}
                    <label
                      className="p-1.5 rounded-full hover:bg-sky-500/10 cursor-pointer transition"
                      title="Attach Image"
                    >
                      <ImageIcon className="h-4 w-4" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'image')}
                      />
                    </label>

                    {/* Video Attach */}
                    <label
                      className="p-1.5 rounded-full hover:bg-sky-500/10 cursor-pointer transition"
                      title="Attach Video"
                    >
                      <Film className="h-4 w-4" />
                      <input
                        type="file"
                        accept="video/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'video')}
                      />
                    </label>

                    {/* Poll Attach */}
                    <button
                      type="button"
                      onClick={() => setShowPoll(!showPoll)}
                      className={`p-1.5 rounded-full transition cursor-pointer ${
                        showPoll ? 'text-sky-300 bg-sky-500/20' : 'hover:bg-sky-500/10'
                      }`}
                      title="Attach Poll"
                    >
                      <BarChart2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    {content.length > 0 && (
                      <span className={`text-[11px] font-mono ${charsRemaining < 20 ? 'text-rose-400' : 'text-zinc-500'}`}>
                        {charsRemaining}
                      </span>
                    )}

                    {/* Send Reply Button */}
                    <button
                      type="submit"
                      disabled={!content.trim() && !mediaPreview && !pollOption1}
                      className="px-4 py-1.5 rounded-full bg-sky-500 hover:bg-sky-400 disabled:opacity-40 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <span>Reply</span>
                      <Send className="h-3 w-3" />
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
