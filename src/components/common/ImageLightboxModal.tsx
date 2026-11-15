import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, ZoomIn, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  altText?: string;
  onClose: () => void;
}

export const ImageLightboxModal: React.FC<ImageLightboxModalProps> = ({
  isOpen,
  imageUrl,
  altText = 'Full preview',
  onClose
}) => {
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const content = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Preview"
      data-testid="image-lightbox-modal"
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      className="fixed inset-0 z-[9999] bg-black/92 backdrop-blur-sm flex flex-col items-center justify-between p-3 sm:p-6 animate-fadeIn cursor-zoom-out"
    >
      {/* Top Controls Bar */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-4xl flex items-center justify-between py-2 text-white/90 z-10 cursor-default"
      >
        <div className="flex items-center gap-2">
          <ZoomIn className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
            Image Preview
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={imageUrl}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={(e) => e.stopPropagation()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
            title="Download or view full source"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Save</span>
          </a>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            aria-label="Close image"
            data-testid="lightbox-close-btn"
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Center Image Container */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex-1 flex items-center justify-center w-full max-w-4xl overflow-hidden cursor-default my-auto"
      >
        <img
          src={imageUrl}
          alt={altText || 'Full preview'}
          data-testid="lightbox-image"
          className="max-w-full max-h-[82vh] object-contain rounded-xl shadow-2xl border border-white/10 select-none animate-in zoom-in-95 duration-150"
        />
      </div>

      {/* Bottom Hint */}
      <div
        onClick={(e) => e.stopPropagation()}
        className="text-[11px] font-mono text-zinc-500 py-2 cursor-default"
      >
        Click anywhere outside or press ESC to close
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(content, document.body);
  }

  return content;
};
