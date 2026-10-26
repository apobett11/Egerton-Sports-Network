import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Image as ImageIcon, Film, BarChart2, CheckCircle2 } from 'lucide-react';
import { banterService } from '../../services/predictions/banterService';
import { anonymousIdentityService } from '../../services/predictions/anonymousIdentityService';
import { getActiveSessionProfile } from '../../utils/sessionIdentity';
import type { BanterPost, BanterMediaType } from '../../types/predictions';

interface BanterReplyModalProps {
  post: BanterPost;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'video') => {
    const file = e.target.files?.[0];
    if (!file) return;

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
    const session = getActiveSessionProfile();
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs transition-opacity p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-lg bg-[#0e1c2b] border border-sky-500/50 rounded-t-3xl sm:rounded-2xl shadow-2xl sm:shadow-[0_0_35px_rgba(14,165,233,0.35)] overflow-hidden transition-transform animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-[#112236]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400">Replying to</span>
            <span className="text-xs font-bold text-sky-400">@{post.authorHandle}</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Replying context snippet */}
        <div className="px-4 pt-3 pb-1 text-xs text-zinc-400 border-l-2 border-zinc-700 ml-4 my-2 line-clamp-2">
          {post.content}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Post your reply..."
            rows={3}
            className="w-full bg-zinc-900/80 border border-zinc-800 focus:border-sky-500 rounded-xl p-3 text-sm text-white placeholder-zinc-500 focus:outline-none transition resize-none"
          />

          {/* Media Preview */}
          {mediaPreview && (
            <div className="relative rounded-xl overflow-hidden border border-zinc-800 bg-black aspect-video max-h-40 flex items-center justify-center">
              {mediaType === 'VIDEO' ? (
                <video src={mediaPreview} controls className="w-full h-full object-contain" />
              ) : (
                <img src={mediaPreview} alt="Preview" className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => { setMediaPreview(null); setMediaType('NONE'); }}
                className="absolute top-2 right-2 p-1 rounded-full bg-black/80 text-white hover:bg-black"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Optional Poll attachment fields */}
          {showPoll && (
            <div className="rounded-xl border border-sky-500/30 bg-sky-950/20 p-3 space-y-2">
              <input
                type="text"
                value={pollQuestion}
                onChange={(e) => setPollQuestion(e.target.value)}
                placeholder="Ask a question (optional)..."
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <input
                type="text"
                value={pollOption1}
                onChange={(e) => setPollOption1(e.target.value)}
                placeholder="Option 1"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
              <input
                type="text"
                value={pollOption2}
                onChange={(e) => setPollOption2(e.target.value)}
                placeholder="Option 2"
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none"
              />
            </div>
          )}

          {/* Action Toolbar */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              {/* Image Attach */}
              <label
                className="p-2 rounded-full text-sky-400 hover:bg-sky-500/10 cursor-pointer transition"
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
                className="p-2 rounded-full text-sky-400 hover:bg-sky-500/10 cursor-pointer transition"
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
                className={`p-2 rounded-full transition cursor-pointer ${
                  showPoll ? 'text-sky-300 bg-sky-500/20' : 'text-sky-400 hover:bg-sky-500/10'
                }`}
                title="Attach Poll"
              >
                <BarChart2 className="h-4 w-4" />
              </button>
            </div>

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
        </form>
      </div>
    </div>
  );
};
