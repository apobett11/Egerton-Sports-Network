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
  AtSign,
  Shield
} from 'lucide-react';
import { validateVideoFile } from '../../../services/predictions/banterService';
import { supabase } from '../../../lib/predictions/banterSupabase';
import { EPL_TEAMS } from '../../../lib/predictions/eplTeams';
import { useBanterSession } from '../../../hooks/useBanterSession';
import { getAuthorIdentityMeta } from '../../../lib/predictions/footballAvatars';
import type { BanterMediaType, AuthorType } from '../../../types/predictions';

const TODAY_MATCHES_LIST = [
  'Santos FC vs BCOM FC',
  'Blue Blazers vs Mighty Blacks',
  'Celtics FC vs Five Stars FC',
  'Giants FC vs Legends FC',
  'Med FC vs Rising Stars',
  'Super Eagles vs Wazito FC',
  'Young Legends vs Rangers FC',
  'Tatton FC vs Aged FC',
  'Ajax FC vs Talanta FC',
  'Law FC vs Fass Elites',
];

const EPL_TEAMS_LIST = [
  'Engineering FC',
  'Santos FC',
  'BCOM FC',
  'Blue Blazers',
  'Mighty Blacks',
  'Celtics FC',
  'Five Stars FC',
  'Giants FC',
  'Legends FC',
  'Med FC',
  'Rising Stars',
  'Super Eagles',
  'Wazito FC',
];

const CHAMPIONSHIP_TEAMS_LIST = [
  'Aged FC',
  'Ajax FC',
  'Tatton FC',
  'Talanta FC',
  'Rangers FC',
  'Law FC',
  'Fass Elites',
  'Emsa FC',
  'Young Legends',
  'Young Stars',
  'Education Stars',
  'Health Sciences FC',
  'Nakuru Town Campus FC',
  'Veterinary Academy FC',
];

const COACHES_LIST = [
  { name: 'Coach Odhiambo', team: 'Super Eagles (EPL)' },
  { name: 'Coach Kamau', team: 'Santos FC (EPL)' },
  { name: 'Prof. J. Mwangi', team: 'Engineering Strikers (EPL)' },
  { name: 'Coach Peter Maina', team: 'Njoro Spurs (EPL)' },
  { name: 'Coach Mark Ruto', team: 'Science Lions (EPL)' },
  { name: 'Coach Alex Omondi', team: 'Tatton United (EPL)' },
  { name: 'Coach Eric Kiprop', team: 'Vet Med Warriors (EPL)' },
  { name: 'Coach David Kamau', team: 'Agriculture FC (EPL)' },
  { name: 'Coach Josephat Langat', team: 'Education Stars (Championship)' },
  { name: 'Coach Beatrice Korir', team: 'Health Sciences FC (Championship)' },
  { name: 'Coach Simon Ouma', team: 'Nakuru Town Campus FC (Championship)' },
  { name: 'Coach Faith Chepkoech', team: 'Veterinary Academy FC (Championship)' },
];

interface XStyleComposerProps {
  onPostCreated?: (
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
  rootPostId?: string | null;
  isReply?: boolean;
  activeTool?: 'text' | 'media' | 'poll' | null;
  onClearActiveTool?: () => void;
  autoFocus?: boolean;
  authorType?: AuthorType;
  authorBadge?: string;
  onPostSuccess?: (data: any) => void;
}

const MAX_CHARS = 280;

export const XStyleComposer: React.FC<XStyleComposerProps> = ({
  onPostCreated,
  contextMatchName,
  authorHandle = 'Fanatic',
  placeholder = "What's happening?!",
  parentId = null,
  rootPostId = null,
  isReply = false,
  activeTool = null,
  onClearActiveTool,
  autoFocus = false,
  authorType = 'user',
  authorBadge,
  onPostSuccess
}) => {
  const { profile } = useBanterSession();
  const [isExpanded, setIsExpanded] = useState(Boolean(isReply || autoFocus));
  const [content, setContent] = useState('');
  const [mediaPreviews, setMediaPreviews] = useState<Array<{ url: string; type: 'image' | 'video'; duration?: number }>>([]);
  const [showPollBuilder, setShowPollBuilder] = useState(false);
  const [pollQuestion, setPollQuestion] = useState('');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tagging dropdown & categories: Match, EPL Team, Championship Team, Coach
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [selectedTagCategory, setSelectedTagCategory] = useState<'match' | 'epl' | 'championship' | 'coach'>('match');
  const [taggedMatch, setTaggedMatch] = useState<string | null>(null);
  const [taggedCoach, setTaggedCoach] = useState<string | null>(null);

  // Team tagging state
  const [availableTeams, setAvailableTeams] = useState<Array<{ id: string; name: string; shortName?: string }>>([]);
  const [selectedTeam, setSelectedTeam] = useState<{ id: string; name: string } | null>(null);
  const [showTeamDropdown, setShowTeamDropdown] = useState(false);
  const [teamFilterQuery, setTeamFilterQuery] = useState('');

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const composerContainerRef = useRef<HTMLDivElement | null>(null);

  // Collapse back to one strip when clicking outside with empty composer
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (composerContainerRef.current && !composerContainerRef.current.contains(e.target as Node)) {
        setShowTagMenu(false);
        setShowTeamDropdown(false);
        if (!isReply && !content.trim() && mediaPreviews.length === 0 && !showPollBuilder && !selectedTeam && !taggedMatch && !taggedCoach) {
          setIsExpanded(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isReply, content, mediaPreviews, showPollBuilder, selectedTeam, taggedMatch, taggedCoach]);

  const authorMeta = getAuthorIdentityMeta({
    authorType,
    authorHandle: profile?.authorHandle || authorHandle,
    authorName: profile?.authorName,
    authorBadge,
    authorAvatar: profile?.avatarColor
  });

  const handleSelectMatchTag = (matchName: string) => {
    setTaggedMatch(matchName);
    setShowTagMenu(false);
    const tagText = `@${matchName}`;
    setContent(prev => prev.includes(tagText) ? prev : `${prev ? prev + ' ' : ''}${tagText} `.slice(0, MAX_CHARS));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSelectTeamTag = (teamName: string) => {
    const teamObj = { id: teamName.toLowerCase().replace(/\s+/g, '-'), name: teamName };
    setSelectedTeam(teamObj);
    setShowTagMenu(false);
    const tagText = `@${teamName}`;
    setContent(prev => prev.includes(tagText) ? prev : `${prev ? prev + ' ' : ''}${tagText} `.slice(0, MAX_CHARS));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  const handleSelectCoachTag = (coach: { name: string; team: string }) => {
    setTaggedCoach(coach.name);
    setShowTagMenu(false);
    const tagText = `@${coach.name}`;
    setContent(prev => prev.includes(tagText) ? prev : `${prev ? prev + ' ' : ''}${tagText} `.slice(0, MAX_CHARS));
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

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
    if (!canSubmit || isSubmitting) return;

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

      // Fast, session-verified post submission (Zero per-action verification overhead)
      const contentToSubmit = content;
      const pollToSubmit = pollData;
      const teamToSubmit = finalTeam;

      // Reset immediately for instant optimistic responsiveness (< 16ms)
      setContent('');
      setMediaPreviews([]);
      setShowPollBuilder(false);
      setPollQuestion('');
      setPollOptions(['', '']);
      setSelectedTeam(null);
      setShowTeamDropdown(false);
      setIsExpanded(true);

      // Notify parent immediately for optimistic UI paint
      if (onPostCreated) {
        await onPostCreated(contentToSubmit, mediaUrls, mediaType, pollToSubmit, teamToSubmit);
      }

      if (!onPostCreated && profile) {
        const payload: Record<string, any> = {
          root_id: rootPostId || parentId || null,
          parent_id: parentId || null,
          uid: profile.uid,                         // Session UID
          author_device_id: profile.deviceId,       // Permanent hardware device ID
          author_name: profile.authorName,
          author_handle: profile.authorHandle,
          author_avatar: profile.avatarColor,
          content: contentToSubmit.trim(),
          media_type: mediaType,
        };

        if (mediaUrls.length > 0) {
          payload.media_urls = mediaUrls;
        }
        if (teamToSubmit?.id) {
          payload.tagged_team_id = teamToSubmit.id;
          payload.tagged_team_name = teamToSubmit.name;
        }

        void supabase
          .from('banter_posts')
          .insert([payload])
          .select()
          .single()
          .then(
            ({ data }) => {
              if (data && onPostSuccess) onPostSuccess(data);
            },
            () => {}
          );
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
      className={`bg-black transition-colors ${
        isReply
          ? 'rounded-2xl border border-zinc-800/90 p-3.5 sm:p-4 my-2 shadow-lg'
          : 'border-b border-zinc-800/80 p-3.5 sm:p-4'
      } ${!isExpanded && !isReply ? 'cursor-pointer hover:bg-white/[0.015]' : ''}`}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >

      {/* Compact Pill (Unexpanded State) */}
      {!isExpanded ? (
        <div className="flex items-center gap-3 h-12 px-2">
          <img
            src={authorMeta.avatarUrl}
            alt={authorMeta.displayName}
            className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm border border-white/10"
          />
          <span className="text-zinc-500 text-sm font-medium flex-1 select-none truncate">
            {placeholder}
          </span>
          <div className="flex items-center gap-2 text-sky-500 shrink-0">
            <button
              type="button"
              aria-label="Upload Media"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                fileInputRef.current?.click();
              }}
              className="p-1.5 rounded-full hover:bg-sky-500/10 text-sky-400 transition-colors"
              title="Add Media"
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
              className="p-1.5 rounded-full hover:bg-sky-500/10 text-sky-400 transition-colors"
              title="Create Poll"
            >
              <BarChart2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              aria-label="Tag Selector"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
                setShowTagMenu(true);
              }}
              className="p-1.5 rounded-full hover:bg-emerald-500/10 text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
              title="Tag: Match, EPL Team, Championship Team, Coach"
            >
              <AtSign className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-bold">Tag</span>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsExpanded(true);
              }}
              className="px-4 py-1.5 rounded-full bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white font-bold text-xs transition-colors shadow-xs cursor-pointer"
            >
              Post
            </button>
          </div>
        </div>
      ) : (
        /* Expanded Inline Composer */
        <div className="space-y-3">
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
            <img
              src={authorMeta.avatarUrl}
              alt={authorMeta.displayName}
              className="h-9 w-9 shrink-0 rounded-full object-cover shadow-sm border border-white/10"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between pb-1.5 text-xs">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-bold text-white text-xs">{profile?.authorName || authorHandle}</span>
                  <span className="text-[11px] text-zinc-500 font-mono">@{profile?.authorHandle || authorHandle}</span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-500/15 px-1.5 py-0.2 text-[9px] font-black uppercase text-emerald-400 border border-emerald-500/30">
                    <Shield className="h-2.5 w-2.5" />
                    <span>Verified Session</span>
                  </span>
                </div>
              </div>

              {/* Tagged Badges (Team, Match, Coach) */}
              {(selectedTeam || taggedMatch || taggedCoach) && (
                <div className="my-1.5 flex flex-wrap items-center gap-1.5">
                  {selectedTeam && (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs">
                      <Shield className="h-3 w-3" />
                      <span className="font-semibold">@{selectedTeam.name}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedTeam(null)}
                        className="p-0.5 hover:text-rose-400 text-zinc-400 rounded-full cursor-pointer ml-0.5"
                        title="Remove tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {taggedMatch && (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs">
                      <span>⚽ {taggedMatch}</span>
                      <button
                        type="button"
                        onClick={() => setTaggedMatch(null)}
                        className="p-0.5 hover:text-rose-400 text-zinc-400 rounded-full cursor-pointer ml-0.5"
                        title="Remove match tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}

                  {taggedCoach && (
                    <div className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs">
                      <span>👔 @{taggedCoach}</span>
                      <button
                        type="button"
                        onClick={() => setTaggedCoach(null)}
                        className="p-0.5 hover:text-rose-400 text-zinc-400 rounded-full cursor-pointer ml-0.5"
                        title="Remove coach tag"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              )}

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

              {/* 4-Category Tag Selector Dropdown: match, EPL team, Championship team, coach */}
              {showTagMenu && (
                <div className="my-2 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 shadow-2xl z-30 animate-fadeIn space-y-2.5">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <AtSign className="h-4 w-4" /> Tag Selection
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowTagMenu(false)}
                      className="p-1 rounded-full text-zinc-500 hover:text-white transition cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {/* 4 Category Tabs */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 p-1 bg-zinc-900 rounded-xl">
                    {[
                      { id: 'match', label: 'Match' },
                      { id: 'epl', label: 'EPL Team' },
                      { id: 'championship', label: 'Championship' },
                      { id: 'coach', label: 'Coach' }
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => setSelectedTagCategory(cat.id as any)}
                        className={`py-1 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer text-center ${
                          selectedTagCategory === cat.id
                            ? 'bg-emerald-500 text-black shadow-xs'
                            : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Category Options List */}
                  <div className="max-h-48 overflow-y-auto space-y-1 pr-1 text-xs">
                    {selectedTagCategory === 'match' && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 px-1">Today's Matches</p>
                        {TODAY_MATCHES_LIST.map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => handleSelectMatchTag(m)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 hover:text-white flex items-center justify-between group cursor-pointer transition"
                          >
                            <span className="font-semibold">{m}</span>
                            <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 font-mono">Tag</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedTagCategory === 'epl' && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 px-1">Active EPL Teams</p>
                        {EPL_TEAMS_LIST.map((teamName) => (
                          <button
                            key={teamName}
                            type="button"
                            onClick={() => handleSelectTeamTag(teamName)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 hover:text-white flex items-center justify-between group cursor-pointer transition"
                          >
                            <span className="font-semibold">{teamName}</span>
                            <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 font-mono">@{teamName}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedTagCategory === 'championship' && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 px-1">Active Championship Teams</p>
                        {CHAMPIONSHIP_TEAMS_LIST.map((teamName) => (
                          <button
                            key={teamName}
                            type="button"
                            onClick={() => handleSelectTeamTag(teamName)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 hover:text-white flex items-center justify-between group cursor-pointer transition"
                          >
                            <span className="font-semibold">{teamName}</span>
                            <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 font-mono">@{teamName}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {selectedTagCategory === 'coach' && (
                      <div className="space-y-1">
                        <p className="text-[10px] uppercase font-bold text-zinc-500 px-1">Active League Coaches</p>
                        {COACHES_LIST.map((coach) => (
                          <button
                            key={coach.name}
                            type="button"
                            onClick={() => handleSelectCoachTag(coach)}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-zinc-800/80 text-zinc-200 hover:text-white flex items-center justify-between group cursor-pointer transition"
                          >
                            <div>
                              <span className="font-semibold text-zinc-100">{coach.name}</span>
                              <span className="text-[10px] text-zinc-500 ml-2">({coach.team})</span>
                            </div>
                            <span className="text-[10px] text-zinc-500 group-hover:text-emerald-400 font-mono">@{coach.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Autocomplete Dropdown for @team */}
              {showTeamDropdown && (
                <div className="my-2 rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-2xl z-30 max-h-56 overflow-y-auto">
                  <div className="flex items-center justify-between px-2 py-1 text-[11px] font-bold text-zinc-400 border-b border-zinc-800/80 mb-1">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <AtSign className="h-3.5 w-3.5" /> Select Team to Tag
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
                    placeholder="Question"
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

              {/* Category Tag Selector Button */}
              <button
                type="button"
                aria-label="Tag Selector"
                onClick={() => setShowTagMenu(prev => !prev)}
                className={`p-2 rounded-full transition-colors flex items-center gap-1 cursor-pointer ${
                  showTagMenu ? 'bg-emerald-500/20 text-emerald-300' : 'hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300'
                }`}
                title="Tag: Match, EPL Team, Championship Team, Coach"
              >
                <AtSign className="h-5 w-5" />
                <span className="hidden sm:inline text-[11px] font-bold">Tag</span>
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
                className={`px-5 py-1.5 rounded-full font-bold text-sm transition-all duration-150 ${
                  canSubmit
                    ? 'bg-[#1d9bf0] hover:bg-[#1a8cd8] text-white cursor-pointer shadow-xs active:scale-95'
                    : 'bg-[#1d9bf0]/50 text-white/50 cursor-not-allowed'
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

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={handleMediaSelect}
      />
    </div>
  );
};
