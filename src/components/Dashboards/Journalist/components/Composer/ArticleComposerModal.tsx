import React, { useState } from 'react';
import { X, Send, Save, Upload, CheckCircle2 } from 'lucide-react';
import {
  ArticleCategory,
  ARTICLE_CATEGORY_LABELS,
} from '../../JournalistTypes';
import { validateMediaFile } from '../../../../../lib/storageUtils';

interface ArticleComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  composeType: ArticleCategory;
  setComposeType: (type: ArticleCategory) => void;
  composeHeadline: string;
  setComposeHeadline: (headline: string) => void;
  composeBody: string;
  setComposeBody: (body: string) => void;
  composeImageUrl: string;
  setComposeImageUrl: (url: string) => void;
  editingArticleId: string | null;
  isSavingArticle: boolean;
  handleSaveArticle: (isDraft: boolean, imageFile?: File | null) => void;
  cardBg: string;
}

export const ArticleComposerModal: React.FC<ArticleComposerModalProps> = ({
  isOpen,
  onClose,
  composeType,
  setComposeType,
  composeHeadline,
  setComposeHeadline,
  composeBody,
  setComposeBody,
  composeImageUrl,
  setComposeImageUrl: _setComposeImageUrl,
  editingArticleId,
  isSavingArticle,
  handleSaveArticle,
  cardBg,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileValidationError, setFileValidationError] = useState<string | null>(null);

  if (!isOpen) return null;

  const MAX_HEADLINE_LENGTH = 140;
  const headlineLength = composeHeadline.length;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileValidationError(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const validation = validateMediaFile(file);
      if (!validation.valid) {
        setFileValidationError(validation.error || 'Invalid image file.');
        setSelectedFile(null);
        setFilePreview(null);
        return;
      }

      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
    }
  };

  const handleFormSubmit = (isDraft: boolean) => {
    setFileValidationError(null);
    handleSaveArticle(isDraft, selectedFile);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="compose-modal-title"
    >
      <div className="w-full max-w-2xl bg-[#0e1e2d] border border-[#1a2e45] rounded-xl shadow-2xl p-5 md:p-6 space-y-4 max-h-[92vh] overflow-y-auto">
        {/* MODAL HEADER */}
        <div className="flex items-center justify-between border-b border-[#1a2e45] pb-3">
          <div>
            <h3 id="compose-modal-title" className="font-black text-base uppercase tracking-tight text-white leading-none">
              {editingArticleId ? 'Edit News Article' : 'Compose News Article'}
            </h3>
            <p className="text-[11px] text-slate-400 font-medium pt-1">
              Publish news stories, press releases, and editorial articles to the campus newsroom.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close compose modal"
            className="p-1.5 text-slate-400 hover:text-white rounded-sm hover:bg-[#152a40] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* FORM CONTENT */}
        <form onSubmit={(e) => e.preventDefault()} className="space-y-4 text-xs font-semibold">
          {/* ARTICLE TYPE DROPDOWN */}
          <div>
            <label htmlFor="article-type-select" className="block text-slate-400 uppercase font-black text-[10px] tracking-wider mb-1">
              Article Type
            </label>
            <select
              id="article-type-select"
              value={composeType}
              onChange={(e) => setComposeType(e.target.value as ArticleCategory)}
              disabled={isSavingArticle}
              className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none text-white font-bold text-xs disabled:opacity-50 transition-colors"
            >
              {(Object.keys(ARTICLE_CATEGORY_LABELS) as ArticleCategory[]).map((cat) => (
                <option key={cat} value={cat} className="bg-[#0e1e2d] text-white">
                  {ARTICLE_CATEGORY_LABELS[cat]}
                </option>
              ))}
            </select>
          </div>

          {/* HEADLINE WITH LIVE CHARACTER COUNTER */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="article-headline-input" className="block text-slate-400 uppercase font-black text-[10px] tracking-wider">
                Headline <span className="text-rose-500">*</span>
              </label>
              <span className={`text-[10px] font-bold tracking-wider ${
                headlineLength > MAX_HEADLINE_LENGTH ? 'text-rose-500' : 'text-slate-400'
              }`}>
                {headlineLength} / {MAX_HEADLINE_LENGTH}
              </span>
            </div>
            <input
              id="article-headline-input"
              type="text"
              maxLength={MAX_HEADLINE_LENGTH}
              value={composeHeadline}
              onChange={(e) => setComposeHeadline(e.target.value)}
              disabled={isSavingArticle}
              placeholder="Enter article headline..."
              className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none text-white placeholder-slate-400 font-bold text-xs disabled:opacity-50 transition-colors"
            />
          </div>

          {/* FEATURED IMAGE UPLOAD (OPTIONAL) */}
          <div className="space-y-1.5">
            <label htmlFor="article-file-upload" className="block text-slate-400 uppercase font-black text-[10px] tracking-wider">
              Featured Image (Optional)
            </label>

            <div className="p-4 rounded-sm border border-dashed border-[#223b56] hover:border-[#ff0046] bg-[#102237] text-slate-300 text-center space-y-2 transition-colors">
              <input
                id="article-file-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                disabled={isSavingArticle}
                className="hidden"
              />

              <label
                htmlFor="article-file-upload"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white font-bold text-xs uppercase tracking-wider border border-white/10 cursor-pointer transition-colors"
              >
                <Upload className="w-4 h-4" />
                <span>{selectedFile ? 'Change Image File' : 'Choose Image File'}</span>
              </label>

              {(filePreview || composeImageUrl) && (
                <div className="flex items-center justify-center gap-3 pt-2">
                  <img
                    src={filePreview || composeImageUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-sm object-cover border border-[#1a2e45] shadow-xs"
                  />
                  <div className="text-left text-xs font-semibold">
                    <p className="text-[#ff0046] flex items-center gap-1 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Image Selected
                    </p>
                    <p className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                      {selectedFile?.name || composeImageUrl.split('/').pop()}
                    </p>
                  </div>
                </div>
              )}

              {!selectedFile && !composeImageUrl && (
                <p className="text-[11px] text-slate-400 font-medium">
                  Optional. Select JPG, PNG, or WEBP to upload to Supabase Storage.
                </p>
              )}
            </div>

            {fileValidationError && (
              <p className="text-xs text-rose-500 font-bold px-1">{fileValidationError}</p>
            )}
          </div>

          {/* ARTICLE BODY */}
          <div>
            <label htmlFor="article-body-input" className="block text-slate-400 uppercase font-black text-[10px] tracking-wider mb-1">
              Article Body <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="article-body-input"
              rows={8}
              value={composeBody}
              onChange={(e) => setComposeBody(e.target.value)}
              disabled={isSavingArticle}
              placeholder="Message here..."
              className="w-full p-2.5 rounded-sm bg-[#15273b] border border-[#223b56] focus:border-[#ff0046] focus:outline-none text-white placeholder-slate-400 font-bold text-xs leading-relaxed resize-y disabled:opacity-50 transition-colors"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1a2e45]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSavingArticle}
              className="px-4 py-2 rounded-sm bg-[#14263b] hover:bg-[#1c3857] text-slate-300 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={() => handleFormSubmit(true)}
              disabled={isSavingArticle}
              className="px-4 py-2 rounded-sm bg-[#152a40] hover:bg-[#1c3857] text-white border border-white/10 font-bold uppercase text-xs tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingArticle ? 'Saving...' : 'Save as Working Draft'}
            </button>

            <button
              type="button"
              onClick={() => handleFormSubmit(false)}
              disabled={isSavingArticle}
              className="px-5 py-2 rounded-sm bg-[#ff0046] hover:bg-[#e0003e] text-white font-black uppercase text-xs tracking-wider shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              {isSavingArticle ? 'Publishing...' : 'Publish Article'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
