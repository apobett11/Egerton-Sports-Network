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
        // Fetch active post and all its replies from banter_comments and banter_posts
        const { data: post, error: postErr } = await supabaseAdmin
          .from('banter_posts_enriched')
          .select('*')
          .eq('id', threadId)
          .single();

        if (postErr || !post) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Thread not found' }));
          return;
        }

        // 1. Direct comments from banter_comments_enriched
        const { data: comments } = await supabaseAdmin
          .from('banter_comments_enriched')
          .select('*')
          .eq('post_id', threadId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(200);

        let allComments = comments || [];
        if (allComments.length > 0) {
          const cIds = allComments.map((c: any) => c.id).filter(Boolean);
          if (cIds.length > 0) {
            const { data: nested } = await supabaseAdmin
              .from('banter_comments_enriched')
              .select('*')
              .in('post_id', cIds)
              .eq('status', 'active')
              .limit(200);
            if (nested && nested.length > 0) {
              allComments = [...allComments, ...nested];
            }
          }
        }

        // 2. Replies from banter_posts_enriched
        const { data: postReplies } = await supabaseAdmin
          .from('banter_posts_enriched')
          .select('*')
          .or(`root_id.eq.${threadId},parent_id.eq.${threadId}`)
          .eq('status', 'active')
          .limit(200);

        // Extract poll if present
        let pollData: any = null;
        if (post.poll_id) {
          const { data: pollRow } = await supabaseAdmin
            .from('banter_polls')
            .select('*')
            .eq('id', post.poll_id)
            .maybeSingle();
          if (pollRow) pollData = pollRow;
        }
        const pollComment = allComments.find((c: any) => c.author_handle === 'poll_bot' || (c.content && c.content.startsWith('[poll:')));
        if (!pollData && pollComment) {
          const match = pollComment.content.match(/^\[poll:(.*)\]$/);
          if (match) {
            try {
              const parsed = JSON.parse(match[1]);
              pollData = {
                id: `poll-${post.id}`,
                postId: post.id,
                question: parsed.q || 'Community Poll',
                options: (parsed.o || []).map((o: string, i: number) => ({ id: i + 1, text: o, votes: 0 })),
                totalVotes: 0,
                voters: {}
              };
            } catch {}
          }
        }

        // Filter out poll_bot and [poll:...] from user replies
        const userComments = allComments.filter((c: any) => c.author_handle !== 'poll_bot' && !(c.content && c.content.startsWith('[poll:')));
        const userPostReplies = (postReplies || []).filter((p: any) => p.id !== threadId);

        const existingIds = new Set<string>();
        const combinedReplies: any[] = [];
        for (const c of userComments) {
          if (!existingIds.has(c.id)) {
            existingIds.add(c.id);
            combinedReplies.push(c);
          }
        }
        for (const pr of userPostReplies) {
          if (!existingIds.has(pr.id)) {
            existingIds.add(pr.id);
            combinedReplies.push(pr);
          }
        }

        combinedReplies.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

        const updatedReplies = combinedReplies.map((r: any) => {
          const parentAuthor = (r.post_id === threadId || r.parent_id === threadId)
            ? post.author_handle
            : (combinedReplies.find(x => x.id === (r.post_id || r.parent_id))?.author_handle || post.author_handle);
          const rType = r.media_type === 'VIDEO' ? 'video' : ((r.media_urls?.length || r.image_url) ? 'image' : 'text');
          return {
            ...r,
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
        const pType = pollData ? 'poll' : (post.media_type === 'VIDEO' ? 'video' : ((post.media_urls?.length || post.image_url) ? 'image' : 'text'));
        post.type = pType;
        post.types = [pType];

        res.statusCode = 200;
        res.end(JSON.stringify({ post, replies: updatedReplies }));
        return;
      }

      // Fetch discourse / feed from enriched database view (zero simulation math)
      let query = supabaseAdmin
        .from('banter_posts_enriched')
        .select('*')
        .eq('status', 'active');

      if (teamName) {
        query = query.or(`content.ilike.%@${teamName}%,content.ilike.%${teamName}%,author_handle.ilike.%${teamName}%`);
      }

      const { data: posts, error } = await query
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        res.statusCode = 500;
        res.end(JSON.stringify({ error: error.message }));
        return;
      }

      const updatedPosts = posts || [];

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
      let finalContent = sanitizedContent;
      if (uploadedMediaUrls.length > 0) {
        const tag = mediaType === 'VIDEO' ? 'video' : 'image';
        uploadedMediaUrls.forEach((url: string) => {
          if (!url.startsWith('data:') && !finalContent.includes(url)) {
            const mediaTag = ` [media:${tag}:${url}]`;
            if ((finalContent + mediaTag).length <= (parentId ? 200 : 280)) {
              finalContent = `${finalContent}${mediaTag}`.trim();
            }
          }
        });
      }

      if (!finalContent && uploadedMediaUrls.length === 0 && !poll) {
        res.statusCode = 400;
        res.end(JSON.stringify({ error: 'Message content or media cannot be empty.' }));
        return;
      }

      if (parentId) {
        // Reply under a message: stored in banter_comments (max 200 chars)
        const commentId = (id && /^[0-9a-f-]{36}$/i.test(id))
          ? id
          : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined);
        const commentPayload: any = {
          post_id: parentId,
          author_handle: sanitizedHandle || 'Fanatic',
          author_type: authorType || 'user',
          content: finalContent.slice(0, 200),
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
        const rType = mediaType === 'VIDEO' ? 'video' : (uploadedMediaUrls.length > 0 ? 'image' : 'text');
        reply.type = rType;
        reply.types = [rType];
        reply.replying_to = parentAuthor;
        reply.replyingToHandle = parentAuthor;

        res.statusCode = 201;
        res.end(JSON.stringify({ reply }));
        return;
      }

      // Root message: stored in banter_posts (max 280 chars)
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
          totalVotes: 0,
          voters: {},
          expiresAt: new Date(Date.now() + 86400000).toISOString()
        };
      }

      const declaredType = pollObj ? 'poll' : (mediaType === 'VIDEO' ? 'video' : (uploadedMediaUrls.length > 0 ? 'image' : 'text'));

      const validAuthorTypes = ['user', 'journalist', 'admin', 'seed'];
      const dbAuthorType = validAuthorTypes.includes(authorType) ? authorType : 'user';
      const dbBadge = authorType === 'coach' ? (sanitizedBadge || 'HEAD COACH') : sanitizedBadge;

      const baselineImpressions = Math.floor(18 + Math.random() * 24);
      const postPayload: any = {
        author_handle: sanitizedHandle || 'Fanatic',
        author_type: dbAuthorType,
        author_badge: dbBadge || null,
        content: (finalContent || 'Matchday take').slice(0, 280),
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

      if (pollId) {
        postPayload.poll_id = pollId;
      }

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
        try {
          await supabaseAdmin.from('banter_polls').upsert([{
            id: pollObj.id,
            post_id: post.id,
            question: pollObj.question,
            options: pollObj.options,
            total_votes: 0,
            voters: {},
            expires_at: pollObj.expiresAt
          }]);
        } catch (pollErr) {
          console.warn('Poll table store error:', pollErr);
        }
        post.poll = pollObj;
        post.pollId = pollObj.id;
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
