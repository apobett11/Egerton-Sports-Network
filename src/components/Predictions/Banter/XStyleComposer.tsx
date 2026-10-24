import React, { useState, useRef, useEffect } from 'react';
import {
  Image as ImageIcon,
  BarChart2,
  Sparkles,
  X,
  AlertCircle,
  Plus,
  Trash2,
  Film,
  Send,
  User,
  AtSign,
  Shield
} from 'lucide-react';
import { validateVideoFile } from '../../../services/predictions/banterService';
import { supabase } from '../../../lib/predictions/banterSupabase';
import { EPL_TEAMS } from '../../../lib/predictions/eplTeams';
import type { BanterMediaType, AuthorType } from '../../../types/predictions';

interface XStyleComposerProps {
  onPostCreated: (
    content: string,
    mediaUrls?: string[],
    mediaType?: BanterMediaType,
    poll?: { question: string; options: string[] },
    taggedTeam?: { id: string; name: string } | null
  ) => Promise<void>;
  contextMatchName?: string | null;
  authorHandle?: string;
  placeholder?: string;
  parentId?: string | null;
  isReply?: boolean;
  activeTool?: 'text' | 'media' | 'poll' | null;
  onClearActiveTool?: () => void;
  autoFocus?: boolean;
  authorType?: AuthorType;
  authorBadge?: string;
}

const MAX_CHARS = 280;

export const XStyleComposer: React.FC<XStyleComposerProps> = ({
  onPostCreated,
  contextMatchName,
  authorHandle = 'Fanatic',
  placeholder = "What's happening?!",
  parentId = null,
  isReply = false,
  activeTool = null,
  onClearActiveTool,
  autoFocus = false,
  authorType = 'user',
  authorBadge
}) => {
  const [isExpanded, setIsExpanded] = useState(isReply || autoFocus);
  const [content, setContent] = useState('');
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ url: string; type: 'image' | 'video'; duration?: number }>>([]);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Team tagging state
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string; shortName?: string }>>([]);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [teamFilterQuery, setTeamFilterQuery] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerContainerRef = useRef<HTMLDivElement | null>(null);

  // Load campus teams for autocomplete (Supabase -> EPL_TEAMS fallback)
  useEffect(() => {
    let isMounted = true;
    async function loadTeams() {
      try {
        const { data, error } = await supabase.from('teams').select('id, name, short_name');
        if (!error && data && data.length > 0 && isMounted) {
          setAvailableTeams(
            data.map((t: any) => ({
              id: t.id,
              name: t.name,
              shortName: t.short_name || t.name.slice(0, 3).toUpperCase()
            }))
          );
          return;
        }
      } catch {
        // offline fallback
      }
      if (isMounted) {
        setAvailableTeams(EPL_TEAMS);
      }
    }
    loadTeams();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle external trigger for active tools (from Mobile FAB)
  useEffect(() => {
    if (activeTool === 'text') {
      setIsExpanded(true);
      setTimeout(() => textareaRef.current?.focus(), 100);
    } else if (activeTool === 'media') {
      setIsExpanded(true);
      fileInputRef.current?.click();
    } else if (activeTool === 'poll') {
      setIsExpanded(true);
      setShowPollBuilder(true);
    }
    if (activeTool && onClearActiveTool) {
      onClearActiveTool();
    }
  }, [activeTool, onClearActiveTool]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.max(64, textareaRef.current.scrollHeight)}px`;
    }
  }, [content, isExpanded]);

  const remainingChars = MAX_CHARS - content.length;
  const isOverLimit = remainingChars < 0;
  const hasValidPoll = showPollBuilder && pollOptions.filter(o => o.trim().length > 0).length >= 2;
  const canSubmit =
    (content.trim().length > 0 || mediaPreviews.length > 0 || hasValidPoll) &&
    !isOverLimit &&
    !isSubmitting;

  // Media selection & 15-second HTML5 Video Duration Guard
  const handleMediaSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setErrorMsg(null);

    const newPreviews: Array<{ url: string; type: 'image' | 'video'; duration?: number }> = [];

    for (const file of files) {
      if (file.type.startsWith('video/')) {
        const validation = await validateVideoFile(file);
        if (!validation.valid) {
          setErrorMsg(validation.error || 'Video exceeds 15-second limit.');
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
        }

        const previewUrl = URL.createObjectURL(file);
        newPreviews.push({ url: previewUrl, type: 'video', duration: validation.duration });
      } else if (file.type.startsWith('image/')) {
        if (file.size > 5 * 1024 * 1024) {
          setErrorMsg('Image size must be under 5MB.');
          return;
        }
        const previewUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        newPreviews.push({ url: previewUrl, type: 'image' });
      }
    }

    if (newPreviews.some(p => p.type === 'video')) {
      setMediaPreviews(newPreviews.filter(p => p.type === 'video').slice(0, 1));
    } else {
      setMediaPreviews(prev => [...prev, ...newPreviews.filter(p => p.type === 'image')].slice(0, 2));
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeMedia = (index: number) => {
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
  };

  // Poll option management
  const addPollOption = () => {
    if (pollOptions.length < 4) {
      setPollOptions(prev => [...prev, '']);
    }
  };

  const updatePollOption = (index: number, val: string) => {
    setPollOptions(prev => {
      const next = [...prev];
      next[index] = val;
      return next;
    });
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Quick sport tag injection
  const injectTag = (tag: string) => {
    setContent(prev => {
      if (prev.includes(tag)) return prev;
      const next = `${prev ? prev + ' ' : ''}${tag} `;
      return next.slice(0, MAX_CHARS);
    });
    setIsExpanded(true);
    textareaRef.current?.focus();
  };

  // Content change listener for @ team autocomplete
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    let val = e.target.value;
    if (val.length > MAX_CHARS) {
      val = val.slice(0, MAX_CHARS);
    }
    setContent(val);
    if (errorMsg) setErrorMsg(null);

    const cursorPos = e.target.selectionStart ?? val.length;
    const textBeforeCursor = val.slice(0, cursorPos);
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_\s]*)$/);

    if (match) {
      const query = match[1];
      if (!query.includes('\n') && query.length < 25) {
        setTeamFilterQuery(query.toLowerCase());
        setShowTeamDropdown(true);
        return;
      }
    }
    setShowTeamDropdown(false);
  };

  // Dedicated "Send to Team" action button
  const handleSendToTeamClick = () => {
    setIsExpanded(true);
    setShowTeamDropdown(true);
    setTeamFilterQuery('');

    if (!content.endsWith('@') && !content.endsWith('@ ')) {
      const next = content ? `${content} @` : '@';
      setContent(next.slice(0, MAX_CHARS));
    }
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  // Selecting team from autocomplete dropdown
  const handleSelectTeam = (team: { id: string; name: string }) => {
    setSelectedTeam(team);
    setShowTeamDropdown(false);

    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const textBefore = content.slice(0, cursorPos);
    const textAfter = content.slice(cursorPos);
    const atIndex = textBefore.lastIndexOf('@');

    let newContent = '';
    if (atIndex !== -1) {
      newContent = `${textBefore.slice(0, atIndex)}@${team.name} ${textAfter}`;
    } else {
      newContent = `${content} @${team.name} `;
    }

    setContent(newContent.slice(0, MAX_CHARS));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const filteredTeams = availableTeams.filter(team => {
    if (!teamFilterQuery) return true;
    return (
      team.name.toLowerCase().includes(teamFilterQuery) ||
      (team.shortName && team.shortName.toLowerCase().includes(teamFilterQuery))
    );
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      let mediaType: BanterMediaType = 'NONE';
      const mediaUrls = mediaPreviews.map(m => m.url);
      if (mediaPreviews.length === 1) {
        mediaType = mediaPreviews[0].type === 'video' ? 'VIDEO' : 'IMAGE';
      } else if (mediaPreviews.length >= 2) {
        mediaType = 'DUAL_IMAGE';
      }

      let pollData = undefined;
      if (showPollBuilder && hasValidPoll) {
        pollData = {
          question: pollQuestion.trim() || content.trim().slice(0, 60) || 'Matchday Poll',
          options: pollOptions.filter(o => o.trim().length > 0)
        };
      }

      // Check if team was tagged explicitly or via text mention
      let finalTeam = selectedTeam;
      if (!finalTeam && content.includes('@')) {
        const lower = content.toLowerCase();
        for (const team of availableTeams) {
          if (
            lower.includes(`@${team.name.toLowerCase()}`) ||
            (team.shortName && lower.includes(`@${team.shortName.toLowerCase()}`))
          ) {
            finalTeam = { id: team.id, name: team.name };
            break;
          }
        }
      }

      await onPostCreated(content, mediaUrls, mediaType, pollData, finalTeam);

      // Reset
      setContent('');
      setMediaPreviews([]);
      setShowPollBuilder(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setSelectedTeam(null);
      setShowTeamDropdown(false);
      if (!isReply) {
        setIsExpanded(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to submit post.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calculate SVG circle progress for character counter
  const charProgressPct = Math.min(100, (content.length / MAX_CHARS) * 100);
  const circleRadius = 9;
  const circumference = 2 * Math.PI * circleRadius;
  const strokeDashoffset = circumference - (charProgressPct / 100) * circumference;

  return (
    <div
      ref={composerContainerRef}
      className={`border border-zinc-800 bg-[#000000] rounded-2xl transition-all duration-200 overflow-hidden relative ${
        isExpanded ? 'p-3.5 sm:p-4 shadow-xl' : 'p-2 cursor-pointer hover:border-zinc-700'
      }`}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaSelect}
      />

      {/* Compact Pill (Unexpanded State) */}
      {!isExpanded ? (
        <div className="flex items-center gap-3 h-11 px-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-slate-300">
            <User className="h-4 w-4" />
          </div>
          <span className="text-zinc-500 text-sm font-medium flex-1 select-none">
            {placeholder}
          </span>
          <div className="flex items-center gap-2 text-sky-500">
            <button
              type="button"
              aria-label="Upload Media"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                fileInputRef.current?.click();
              }}
              className="p-1.5 rounded-full hover:bg-sky-500/10 transition-colors"
            >
              <ImageIcon className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Create Poll"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setShowPollBuilder(true);
              }}
              className="p-1.5 rounded-full hover:bg-sky-500/10 transition-colors"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Send to Team"
              onClick={(e) => {
                e.stopPropagation();
                handleSendToTeamClick();
              }}
              className="p-1.5 rounded-full hover:bg-emerald-500/10 text-emerald-400 transition-colors"
              title="Tag a Team"
            >
              <AtSign className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="px-3.5 py-1 rounded-full bg-sky-500 hover:bg-sky-400 text-white font-black text-xs transition-colors"
            >
              Post
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Inline Composer */
        <div className="space-y-3">
          {contextMatchName && (
            <div className="flex items-center gap-1.5 pb-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold text-sky-400 border border-sky-500/20">
                <span>#{contextMatchName.replace(/\s+/g, '')}</span>
              </span>
            </div>
          )}

          {/* Coach / Journalist Badge Indicator */}
          {authorType === 'coach' && (
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[10px] font-black uppercase text-emerald-400 border border-emerald-500/40">
                <Shield className="h-3 w-3" />
                <span>{authorBadge || 'VERIFIED COACH REPLY'}</span>
              </span>
            </div>
          )}

          <div className="flex gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-slate-300">
              <User className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={handleContentChange}
                maxLength={MAX_CHARS}
                placeholder={placeholder}
                rows={3}
                autoFocus={autoFocus || isReply}
                className="w-full bg-transparent text-white placeholder-zinc-500 text-base md:text-lg resize-none outline-none focus:ring-0 leading-relaxed font-sans"
              />

              {/* Tagged Team Active Badge */}
              {selectedTeam && (
                <div className="my-1.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs w-fit">
                  <Shield className="h-3.5 w-3.5" />
                  <span className="font-semibold">Tagged Team: @{selectedTeam.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(null)}
                    className="p-0.5 hover:text-rose-400 text-zinc-400 rounded-full cursor-pointer"
                    title="Remove tag"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Autocomplete Dropdown for @team */}
              {showTeamDropdown && (
                <div className="my-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-30 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-zinc-400 border-b border-zinc-800/80 mb-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <AtSign className="h-3.5 w-3.5" /> Tag Campus Team
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTeamDropdown(false)}
                      className="text-zinc-500 hover:text-zinc-300 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                  {filteredTeams.length === 0 ? (
                    <div className="px-3 py-2 text-xs text-zinc-500">
                      No campus teams matching "{teamFilterQuery}"
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredTeams.map((team) => (
                        <button
                          key={team.id}
                          type="button"
                          onClick={() => handleSelectTeam(team)}
                          className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left text-xs hover:bg-zinc-800/80 text-zinc-200 hover:text-white transition-colors group cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400 font-bold text-[10px] border border-emerald-500/30">
                              {team.shortName || team.name.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="font-semibold text-zinc-200 group-hover:text-emerald-300">
                              {team.name}
                            </span>
                          </div>
                          <span className="text-[10px] font-mono text-zinc-500 bg-zinc-900 px-1.5 py-0.5 rounded">
                            @{team.shortName || team.name.replace(/\s+/g, '')}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Inline Error Message */}
              {errorMsg && (
                <div className="my-2 flex items-center gap-2 rounded-xl bg-rose-500/15 border border-rose-500/30 p-2.5 text-xs text-rose-300">
                  <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Media Attachment Previews */}
              {mediaPreviews.length > 0 && (
                <div className="my-3">
                  {mediaPreviews.length === 1 ? (
                    <div className="relative rounded-2xl overflow-hidden border border-zinc-800 bg-zinc-950 aspect-video max-h-72 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => removeMedia(0)}
                        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-black/75 hover:bg-black text-white transition-colors cursor-pointer"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      {mediaPreviews[0].type === 'video' ? (
                        <div className="relative w-full h-full">
                          <video
                            src={mediaPreviews[0].url}
                            controls
                            className="w-full h-full object-contain"
                          />
                          <span className="absolute bottom-2 left-2 rounded-md bg-black/80 px-2 py-0.5 text-[10px] font-mono text-zinc-300 flex items-center gap-1">
                            <Film className="h-3 w-3 text-sky-400" />
                            <span>≤ 15s Clip</span>
                          </span>
                        </div>
                      ) : (
                        <img
                          src={mediaPreviews[0].url}
                          alt="Attachment preview"
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 rounded-2xl overflow-hidden border border-zinc-800">
                      {mediaPreviews.map((media, idx) => (
                        <div key={idx} className="relative aspect-square bg-zinc-950 overflow-hidden">
                          <button
                            type="button"
                            onClick={() => removeMedia(idx)}
                            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-black/75 hover:bg-black text-white transition-colors cursor-pointer"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                          <img
                            src={media.url}
                            alt={`Dual attachment ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Dynamic Poll Builder */}
              {showPollBuilder && (
                <div className="my-3 p-3.5 rounded-2xl border border-zinc-800 bg-zinc-950/80 space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                      <BarChart2 className="h-3.5 w-3.5" /> Interactive Poll
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowPollBuilder(false)}
                      className="text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={pollQuestion}
                    onChange={(e) => setPollQuestion(e.target.value)}
                    placeholder="Ask a question..."
                    className="w-full px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                  />

                  <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                    {pollOptions.map((opt, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => updatePollOption(idx, e.target.value)}
                          placeholder={`Option ${idx + 1}`}
                          className="flex-1 px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-500"
                        />
                        {pollOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => removePollOption(idx)}
                            className="p-1 text-zinc-500 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {pollOptions.length < 4 && (
                    <button
                      type="button"
                      onClick={addPollOption}
                      className="text-xs font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 pt-1"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add option (up to 4)
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick Sport Tags */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto no-scrollbar">
            {['#Derby', '#POTW', '#EPL', '#Matchday'].map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => injectTag(tag)}
                className="shrink-0 px-2.5 py-0.5 rounded-full bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] font-semibold text-zinc-400 hover:text-sky-400 transition-colors"
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Action Toolbar Below Textarea */}
          <div className="pt-2 border-t border-zinc-900 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sky-500">
              <button
                type="button"
                aria-label="Upload Media"
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full hover:bg-sky-500/10 text-sky-400 hover:text-sky-300 transition-colors"
                title="Add photos or ≤15s video"
              >
                <ImageIcon className="h-5 w-5" />
              </button>

              <button
                type="button"
                aria-label="Create Poll"
                onClick={() => setShowPollBuilder(prev => !prev)}
                className={`p-2 rounded-full transition-colors ${
                  showPollBuilder ? 'bg-sky-500/20 text-sky-300' : 'hover:bg-sky-500/10 text-sky-400 hover:text-sky-300'
                }`}
                title="Create Poll"
              >
                <BarChart2 className="h-5 w-5" />
              </button>

              {/* Dedicated "Send to Team" Button */}
              <button
                type="button"
                aria-label="Send to Team"
                onClick={handleSendToTeamClick}
                className="p-2 rounded-full hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1"
                title="Send to Team (@team)"
              >
                <AtSign className="h-5 w-5" />
                <span className="hidden sm:inline text-[11px] font-bold">Send to Team</span>
              </button>

              <button
                type="button"
                aria-label="Highlight Spark"
                onClick={() => injectTag('#POTW')}
                className="p-2 rounded-full hover:bg-sky-500/10 text-sky-400 hover:text-sky-300 transition-colors"
                title="Add #POTW"
              >
                <Sparkles className="h-5 w-5" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              {/* Circular Character Countdown */}
              {content.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <div className="relative flex items-center justify-center w-6 h-6">
                    <svg className="w-6 h-6 transform -rotate-90">
                      <circle
                        cx="12"
                        cy="12"
                        r={circleRadius}
                        className="text-zinc-800 stroke-current"
                        strokeWidth="2"
                        fill="transparent"
                      />
                      <circle
                        cx="12"
                        cy="12"
                        r={circleRadius}
                        className={`${
                          isOverLimit
                            ? 'text-rose-500'
                            : remainingChars <= 20
                            ? 'text-amber-400'
                            : 'text-sky-500'
                        } stroke-current transition-all duration-150`}
                        strokeWidth="2"
                        strokeDasharray={circumference}
                        strokeDashoffset={strokeDashoffset}
                        strokeLinecap="round"
                        fill="transparent"
                      />
                    </svg>
                  </div>
                  {remainingChars <= 20 && (
                    <span
                      className={`text-[10px] font-mono font-bold ${
                        isOverLimit ? 'text-rose-500' : 'text-amber-400'
                      }`}
                    >
                      {remainingChars}
                    </span>
                  )}
                </div>
              )}

              {/* Active Post / Reply Button */}
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => handleSubmit()}
                className={`px-5 py-2 rounded-full font-black text-xs uppercase tracking-wider transition-all duration-150 shadow-md ${
                  canSubmit
                    ? 'bg-sky-500 hover:bg-sky-400 text-white cursor-pointer active:scale-95'
                    : 'bg-sky-500/40 text-white/50 cursor-not-allowed'
                }`}
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Posting...</span>
                ) : isReply ? (
                  'Reply'
                ) : (
                  'Post'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
