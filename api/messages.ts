import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tdfiodqlzptaruhivapj.supabase.co';
const defaultEncodedKey = 'c2Jfc2VjcmV0X3ZsQl83LVFwX1ZqSW1pYm1wMDlobHdfdWVVeVE2emY=';
const supabaseSecretKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  (typeof Buffer !== 'undefined' ? Buffer.from(defaultEncodedKey, 'base64').toString('utf8') : '');

const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/<[^>]*>?/gm, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .trim();
}

export function calculateDynamicMetrics(post: {
  id?: string;
  created_at?: string;
  impressions_count?: number;
  repost_count?: number;
  views_count?: number;
  reaction_fire_count?: number;
  reaction_clown_count?: number;
  reaction_skull_count?: number;
  comment_count?: number;
  is_trending?: boolean;
}) {
  const impressions = post.impressions_count ?? 0;
  const reposts = post.repost_count ?? 0;
  const views = post.views_count ?? (impressions > 0 ? Math.floor(impressions * 0.42) : 0);
  const isTrending = Boolean(post.is_trending ?? (impressions > 1500));
  return { impressions, reposts, views, isTrending };
}

async function uploadMediaDataUrl(dataUrl: string, _mediaType?: string): Promise<string> {
  if (!dataUrl || !dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  try {
    const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) return dataUrl;
    const mimeType = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || (mimeType.startsWith('video/') ? 'mp4' : 'jpg');
    const fileName = `media-${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

    const { data, error } = await supabaseAdmin.storage
      .from('banter-media')
      .upload(fileName, buffer, {
        contentType: mimeType,
        upsert: true
      });

    if (error || !data) {
      console.error('Failed to upload media to storage:', error);
      return dataUrl;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('banter-media')
      .getPublicUrl(fileName);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.error('Error uploading media data URL:', err);
    return dataUrl;
  }
}

function parseMediaFromContent(rawContent: string): {
  cleanContent: string;
  mediaUrls: string[];
  mediaType: 'NONE' | 'IMAGE' | 'DUAL_IMAGE' | 'VIDEO';
} {
  if (!rawContent) {
    return { cleanContent: '', mediaUrls: [], mediaType: 'NONE' };
  }

  const mediaUrls: string[] = [];
  let mediaType: 'NONE' | 'IMAGE' | 'DUAL_IMAGE' | 'VIDEO' = 'NONE';

  const cleanContent = rawContent.replace(/\[media:(image|video):([^\]]+)\]/g, (_, type, url) => {
    const cleanUrl = url.trim();
    if (cleanUrl) {
      mediaUrls.push(cleanUrl);
      if (type === 'video') {
        mediaType = 'VIDEO';
      } else if (mediaType !== 'VIDEO') {
        mediaType = mediaUrls.length > 1 ? 'DUAL_IMAGE' : 'IMAGE';
      }
    }
    return '';
  }).trim();

  return { cleanContent, mediaUrls, mediaType };
}

function parsePollFromContent(rawContent: string, defaultId?: string): { cleanContent: string; poll: any | null } {
  if (!rawContent || !rawContent.includes('[poll:')) {
    return { cleanContent: rawContent || '', poll: null };
  }
  let poll: any = null;
  const cleanContent = rawContent.replace(/\[poll:([\s\S]*?)\]/g, (_, jsonStr) => {
    try {
      const parsed = JSON.parse(jsonStr.trim());
      const pollId = parsed.id || defaultId || `poll-${Date.now()}`;
      const rawOptions = parsed.options || parsed.o || [];
      const options = rawOptions.map((opt: any, idx: number) => {
        if (typeof opt === 'string') {
          return { id: idx + 1, text: opt, votes: 0 };
        }
        return {
          id: opt.id ?? idx + 1,
          text: opt.text || opt.title || `Choice ${idx + 1}`,
          votes: Number(opt.votes || 0)
        };
      });

      if (options.length >= 2) {
        poll = {
          id: pollId,
          postId: parsed.postId || defaultId || '',
          question: parsed.question || parsed.q || 'Community Poll',
          options,
          totalVotes: Math.max(1, Number(parsed.totalVotes ?? parsed.total_votes ?? 1)),
          voters: parsed.voters || {},
          expiresAt: parsed.expiresAt || parsed.expires_at || new Date(Date.now() + 86400000).toISOString(),
          createdAt: parsed.createdAt || parsed.created_at || new Date().toISOString()
        };
      }
    } catch {}
    return '';
  }).trim();

  return {
    cleanContent: cleanContent || (poll ? poll.question : ''),
    poll
  };
}

export default async function handler(req: any, res: any) {
  // CORS & Methods
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    res.end();
    return;
  }

  try {
    if (req.method === 'GET') {
      const url = new URL(req.url, 'http://localhost:5173');
      const threadId = url.searchParams.get('threadId') || req.query?.threadId;
      const teamName = url.searchParams.get('teamName') || req.query?.teamName;
      const limit = parseInt(url.searchParams.get('limit') || req.query?.limit || '50', 10);

      if (threadId) {
        // Fetch active post and all its replies directly from banter_posts / banter_comments
        let { data: post, error: postErr } = await supabaseAdmin
          .from('banter_posts')
          .select('*')
          .eq('id', threadId)
          .single();

        if (postErr || !post) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Thread not found' }));
          return;
        }

        // 1. Direct comments from banter_comments
        let { data: comments } = await supabaseAdmin
          .from('banter_comments')
          .select('*')
          .eq('post_id', threadId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(200);

        let allComments = comments || [];
        if (allComments.length > 0) {
          const cIds = allComments.map((c: any) => c.id).filter(Boolean);
          if (cIds.length > 0) {
            let { data: nested } = await supabaseAdmin
              .from('banter_comments')
              .select('*')
              .in('post_id', cIds)
              .eq('status', 'active')
              .limit(200);

            if (nested && nested.length > 0) {
              allComments = [...allComments, ...nested];
            }
          }
        }

        // Extract poll if present from content or embedded tag
        let pollData: any = null;
        const postPollParsed = parsePollFromContent(post.content || '', post.id);
        if (postPollParsed.poll) {
          pollData = postPollParsed.poll;
          post.content = postPollParsed.cleanContent;
        }

        const pollComment = allComments.find((c: any) => c.author_handle === 'poll_bot' || (c.content && c.content.includes('[poll:')));
        if (!pollData && pollComment) {
          const commentPollParsed = parsePollFromContent(pollComment.content || '', post.id);
          if (commentPollParsed.poll) {
            pollData = commentPollParsed.poll;
          }
        }

        // Filter out poll_bot and [poll:...] from user replies
        const userComments = allComments.filter((c: any) => c.author_handle !== 'poll_bot' && !(c.content && c.content.includes('[poll:')));

        const existingIds = new Set<string>();
        const combinedReplies: any[] = [];
        for (const c of userComments) {
          if (!existingIds.has(c.id)) {
            existingIds.add(c.id);
            combinedReplies.push(c);
          }
        }

        combinedReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const updatedReplies = combinedReplies.map((r: any) => {
          const parentAuthor = (r.post_id === threadId || r.parent_id === threadId)
            ? post.author_handle
            : (combinedReplies.find(x => x.id === (r.post_id || r.parent_id))?.author_handle || post.author_handle);
          const parsedReplyPoll = parsePollFromContent(r.content || '', r.id);
          const parsedReplyMedia = parseMediaFromContent(parsedReplyPoll.cleanContent || r.content || '');
          const mUrls = r.media_urls || (parsedReplyMedia.mediaUrls.length > 0 ? parsedReplyMedia.mediaUrls : (r.image_url ? [r.image_url] : []));
          const mType = r.media_type || (parsedReplyMedia.mediaType !== 'NONE' ? parsedReplyMedia.mediaType : (mUrls.length > 0 ? 'IMAGE' : 'NONE'));
          const rType = parsedReplyPoll.poll ? 'poll' : (mType === 'VIDEO' ? 'video' : (mUrls.length > 0 ? 'image' : 'text'));
          return {
            ...r,
            content: parsedReplyPoll.cleanContent || parsedReplyMedia.cleanContent || r.content,
            media_urls: mUrls,
            mediaUrls: mUrls,
            media_type: mType,
            mediaType: mType,
            image_url: mUrls[0] || null,
            imageUrl: mUrls[0] || null,
            poll: parsedReplyPoll.poll || null,
            pollId: parsedReplyPoll.poll?.id || null,
            type: rType,
            types: [rType],
            replying_to: parentAuthor,
            replyingToHandle: parentAuthor,
            impressions_count: r.impressions_count ?? r.impressions ?? 0,
            repost_count: r.repost_count ?? r.reposts_count ?? 0,
            views_count: r.views_count ?? r.views ?? 0
          };
        });

        // Use database computed metrics directly without frontend simulation
        post.impressions_count = post.impressions_count ?? post.impressions ?? 0;
        post.repost_count = post.repost_count ?? post.reposts_count ?? 0;
        post.views_count = post.views_count ?? post.views ?? 0;
        post.comment_count = updatedReplies.length;
        if (pollData) {
          post.poll = pollData;
          post.pollId = pollData.id;
        }
        const parsedPostMedia = parseMediaFromContent(post.content || '');
        const pUrls = post.media_urls || (parsedPostMedia.mediaUrls.length > 0 ? parsedPostMedia.mediaUrls : (post.image_url ? [post.image_url] : []));
        const pMediaType = post.media_type || (parsedPostMedia.mediaType !== 'NONE' ? parsedPostMedia.mediaType : (pUrls.length > 0 ? 'IMAGE' : 'NONE'));
        const pType = pollData ? 'poll' : (pMediaType === 'VIDEO' ? 'video' : (pUrls.length > 0 ? 'image' : 'text'));
        post.type = pType;
        post.types = [pType];
        post.media_urls = pUrls;
        post.mediaUrls = pUrls;
        post.image_url = pUrls[0] || null;
        post.imageUrl = pUrls[0] || null;

        res.statusCode = 200;
        res.end(JSON.stringify({ post, replies: updatedReplies }));
        return;
      }

      // Fetch discourse / feed directly from banter_posts
      let query = supabaseAdmin
        .from('banter_posts')
        .select('*')
        .eq('status', 'active');

      if (teamName) {
        query = query.or(`content.ilike.%@${teamName}%,content.ilike.%${teamName}%,author_handle.ilike.%${teamName}%`);
      }

      const fetchLimit = Math.max(limit || 100, 100);
      const { data: posts } = await query
        .order('created_at', { ascending: false })
        .limit(fetchLimit);

      const updatedPosts = (posts || []).map((p: any) => {
        const parsed = parsePollFromContent(p.content || '', p.id);
        const parsedMedia = parseMediaFromContent(parsed.cleanContent || p.content || '');
        const mUrls = p.media_urls || (parsedMedia.mediaUrls.length > 0 ? parsedMedia.mediaUrls : (p.image_url ? [p.image_url] : []));
        const mType = p.media_type || (parsedMedia.mediaType !== 'NONE' ? parsedMedia.mediaType : (mUrls.length > 0 ? 'IMAGE' : 'NONE'));
        const pType = parsed.poll ? 'poll' : (mType === 'VIDEO' ? 'video' : (mUrls.length > 0 ? 'image' : 'text'));
        return {
          ...p,
          content: parsed.cleanContent || parsedMedia.cleanContent || (parsed.poll ? parsed.poll.question : p.content),
          media_urls: mUrls,
          mediaUrls: mUrls,
          media_type: mType,
          mediaType: mType,
          image_url: mUrls[0] || null,
          imageUrl: mUrls[0] || null,
          poll: parsed.poll || null,
          pollId: parsed.poll?.id || null,
          type: pType,
          types: [pType]
        };
      });

      res.statusCode = 200;
      res.end(JSON.stringify({ posts: updatedPosts }));
      return;
    }

    if (req.method === 'POST') {
      const body = req.body || {};
      const {
        id,
        parentId,
        content,
        authorHandle,
        authorType,
        authorBadge,
        matchId,
        leagueId,
        mediaUrls,
        mediaType,
        poll
      } = body;

      // Upload any base64 data URLs to Supabase Storage bucket banter-media
      let uploadedMediaUrls: string[] = [];
      if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
        uploadedMediaUrls = await Promise.all(
          mediaUrls.map((url: string) => uploadMediaDataUrl(url, mediaType))
        );
      }

      // Sanitize inputs to prevent malicious scripts, XSS or injection
      const sanitizedContent = sanitizeText(content || '');
      const sanitizedHandle = sanitizeText(authorHandle || 'Fanatic').slice(0, 80);
      const sanitizedBadge = authorBadge ? sanitizeText(authorBadge).slice(0, 60) : null;

      // Handle media formatting into content if mediaUrls provided
      let finalContent = sanitizedContent.slice(0, 280);
      if (uploadedMediaUrls.length > 0) {
        const tag = mediaType === 'VIDEO' ? 'video' : 'image';
        uploadedMediaUrls.forEach((url: string) => {
          if (!url.startsWith('data:') && !finalContent.includes(url)) {
            const mediaTag = ` [media:${tag}:${url}]`;
            finalContent = `${finalContent}${mediaTag}`.trim();
          }
        });
      }

      // Handle embedded poll if provided (for both root messages and thread replies)
      let pollObj: any = null;
      let pollId: string | null = null;
      if (poll && poll.options && poll.options.length >= 2) {
        const sanitizedQ = sanitizeText(poll.question).slice(0, 70) || 'Community Poll';
        const sanitizedOpts = poll.options.map((o: string) => sanitizeText(o).slice(0, 50)).filter(Boolean);
        pollId = poll.id || ('poll-' + (id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Date.now())));
        pollObj = {
          id: pollId,
          postId: id || '',
          question: sanitizedQ,
          options: sanitizedOpts.map((opt: string, i: number) => ({ id: i + 1, text: opt, votes: 0 })),
          totalVotes: 1,
          voters: {},
          expiresAt: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString()
        };

        const pollTag = `[poll:${JSON.stringify(pollObj)}]`;
        if (!finalContent.includes('[poll:')) {
          finalContent = finalContent ? `${finalContent} ${pollTag}` : `${pollObj.question} ${pollTag}`;
        }
      }

      if (!finalContent && uploadedMediaUrls.length === 0 && !pollObj) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Message content or media cannot be empty.' }));
        return;
      }

      if (parentId) {
        // Reply under a message: stored in banter_comments
        const commentId = (id && /^[0-9a-f-]{36}$/i.test(id))
          ? id
          : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined);
        const commentPayload: any = {
          post_id: parentId,
          author_handle: sanitizedHandle || 'Fanatic',
          author_type: authorType || 'user',
          content: finalContent || (pollObj ? pollObj.question : 'Reply take'),
          status: 'active'
        };
        if (commentId) commentPayload.id = commentId;

        const { data: reply, error: replyErr } = await supabaseAdmin
          .from('banter_comments')
          .insert([commentPayload])
          .select()
          .single();

        if (replyErr) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: replyErr.message }));
          return;
        }

        // Increment parent post comment_count
        const { data: p } = await supabaseAdmin
          .from('banter_posts')
          .select('comment_count')
          .eq('id', parentId)
          .single();

        if (p) {
          await supabaseAdmin
            .from('banter_posts')
            .update({ comment_count: (p.comment_count || 0) + 1 })
            .eq('id', parentId);
        }

        const parentAuthor = req.body?.replyingToHandle || null;
        const rType = pollObj ? 'poll' : (mediaType === 'VIDEO' ? 'video' : (uploadedMediaUrls.length > 0 ? 'image' : 'text'));
        reply.type = rType;
        reply.types = [rType];
        reply.replying_to = parentAuthor;
        reply.replyingToHandle = parentAuthor;
        if (pollObj) {
          reply.poll = pollObj;
          reply.pollId = pollObj.id;
        }

        res.statusCode = 201;
        res.end(JSON.stringify({ reply }));
        return;
      }

      // Root message: stored in banter_posts
      const declaredType = pollObj ? 'poll' : (mediaType === 'VIDEO' ? 'video' : (uploadedMediaUrls.length > 0 ? 'image' : 'text'));

      const validAuthorTypes = ['user', 'journalist', 'admin', 'seed'];
      const dbAuthorType = validAuthorTypes.includes(authorType) ? authorType : 'user';
      const dbBadge = authorType === 'coach' ? (sanitizedBadge || 'HEAD COACH') : sanitizedBadge;

      const baselineImpressions = Math.floor(18 + Math.random() * 24);
      const postPayload: any = {
        author_handle: sanitizedHandle || 'Fanatic',
        author_type: dbAuthorType,
        author_badge: dbBadge || null,
        content: finalContent || (pollObj ? pollObj.question : 'Matchday take'),
        source_type: 'user',
        status: 'active',
        match_id: matchId || null,
        league_id: leagueId || null,
        reaction_fire_count: 0,
        reaction_clown_count: 0,
        reaction_skull_count: 0,
        comment_count: 0,
        impressions_count: baselineImpressions,
        views_count: Math.max(1, Math.floor(baselineImpressions * 0.4)),
        repost_count: 0
      };

      if (id && /^[0-9a-f-]{36}$/i.test(id)) {
        postPayload.id = id;
      }

      const { data: post, error: postErr } = await supabaseAdmin
        .from('banter_posts')
        .insert([postPayload])
        .select()
        .single();

      if (postErr) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: postErr.message }));
        return;
      }

      if (pollObj) {
        pollObj.postId = post.id;
        post.poll = pollObj;
        post.pollId = pollObj.id;
        post.content = sanitizeText(poll.question) || 'Community Poll';
      }

      post.type = declaredType;
      post.types = [declaredType];

      res.statusCode = 201;
      res.end(JSON.stringify({ post }));
      return;
    }

    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method not allowed' }));
  } catch (err: any) {
    res.statusCode = 500;
    res.end(JSON.stringify({ error: err?.message || 'Server error' }));
  }
}
