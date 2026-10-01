import React, { useState, useRef } from 'react';
import { Send, AlertCircle, Hash, User, Image as ImageIcon, X } from 'lucide-react';

interface BanterComposerProps {
  onPostCreated: (content: string, imageUrl?: string | null) => Promise<void>;
  contextMatchName?: string | null;
  authorHandle?: string;
}

const MAX_BANTER_CHARS = 240; // Reasonable paragraph or two

export const BanterComposer: React.FC<BanterComposerProps> = ({
  onPostCreated,
  contextMatchName,
  authorHandle = 'Anonymous Pundit',
}) => {
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const remainingChars = MAX_BANTER_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const isValid = (content.trim().length > 0 || imagePreview !== null) && !isOverLimit;

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 3 * 1024 * 1024) {
      setErrorMsg('Image size should be less than 3MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      setImagePreview(uploadEvent.target?.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await onPostCreated(content, imagePreview);
      setContent('');
      setImagePreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit banter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-700/80 bg-[#0e1c2b] p-3.5 tactical-card-shadow transition-all hover:border-slate-600/80"
    >
      <div className="flex gap-2.5">
        {/* User Avatar */}
        <div className="flex-shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#1d9bf0]/20 via-[#152a40] to-[#ff0046]/20 border border-slate-700 text-white font-bold text-xs shadow-sm">
            <User className="h-4 w-4 text-slate-300" />
          </div>
        </div>

        {/* Text Input Area */}
        <div className="flex-1">
          {contextMatchName && (
            <div className="mb-1 flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-[#1d9bf0]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#1d9bf0] border border-[#1d9bf0]/30">
                <Hash className="h-3 w-3" />
                <span>{contextMatchName}</span>
              </span>
            </div>
          )}

          <textarea
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder={
              contextMatchName
                ? `One line on ${contextMatchName}`
                : "What's happening?"
            }
            rows={2}
            className="w-full resize-none bg-transparent text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none leading-relaxed"
          />

          {/* Image Preview if selected */}
          {imagePreview && (
            <div className="relative mt-2 inline-block rounded-lg overflow-hidden border border-slate-700 max-h-48">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="max-h-44 w-auto object-cover rounded-md"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1.5 right-1.5 p-1 rounded-full bg-black/75 hover:bg-black text-white cursor-pointer"
                title="Remove image"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {errorMsg && (
            <div className="mt-1 flex items-center gap-1 text-xs text-[#ff0046]">
              <AlertCircle className="h-3 w-3" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Bottom Bar: Attach Picture, Character count & Twitter-Style Post Button */}
          <div className="mt-2.5 flex items-center justify-between border-t border-slate-800/80 pt-2 text-xs">
            <div className="flex items-center gap-2">
              {/* Picture Upload Trigger */}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageSelect}
                className="hidden"
                id="banter-image-upload"
              />
              <label
                htmlFor="banter-image-upload"
                className="p-1.5 rounded-full hover:bg-[#1d9bf0]/15 text-slate-400 hover:text-[#1d9bf0] cursor-pointer transition-colors flex items-center gap-1"
                title="Add picture to banter"
              >
                <ImageIcon className="h-4 w-4" />
                <span className="text-[10px] hidden sm:inline-block">Add photo</span>
              </label>

              <span
                className={`font-mono text-[10px] font-bold ${
                  isOverLimit
                    ? 'text-[#ff0046]'
                    : remainingChars < 25
                    ? 'text-amber-400'
                    : 'text-slate-500'
                }`}
              >
                {remainingChars}
              </span>
            </div>

            <button
              type="submit"
              disabled={!isValid || isSubmitting}
              className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-wider transition-all cursor-pointer shadow-md flex items-center gap-1.5 ${
                isValid && !isSubmitting
                  ? 'bg-[#1d9bf0] text-white hover:bg-[#1a8cd8]'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <span>{isSubmitting ? 'Posting…' : 'Post'}</span>
              <Send className="h-3 w-3" />
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
