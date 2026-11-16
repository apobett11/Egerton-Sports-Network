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
}) {
  const createdAtMs = post.created_at ? new Date(post.created_at).getTime() : Date.now();
  const elapsedMinutes = Math.max(0, (Date.now() - createdAtMs) / (1000 * 60));
  const idStr = post.id || 'msg';
  const idHash = (idStr.charCodeAt(0) || 0) + (idStr.charCodeAt(idStr.length - 1) || 0);

  // Deterministic baseline organic seed (18 to 35)
  const baseSeed = 18 + (idHash % 18);
  // Logarithmic gradual growth over elapsed time since sent
  const timeBonus = Math.floor(45 * Math.log(1 + elapsedMinutes * 0.15));

  // Bonuses from real reactions and comments
  const fires = post.reaction_fire_count || 0;
  const clowns = post.reaction_clown_count || 0;
  const skulls = post.reaction_skull_count || 0;
  const comments = post.comment_count || 0;
  const engagementBonus = (fires * 14) + (clowns * 6) + (skulls * 6) + (comments * 22);

  let impressions = Math.max(post.impressions_count || baseSeed, baseSeed + timeBonus + engagementBonus);

  // Regulate into standard bounds (normal up to 1500, trending 1501..1940)
  const isTrending = impressions > 1500;
  if (isTrending) {
    impressions = Math.min(1940, impressions);
  } else {
    impressions = Math.min(1500, impressions);
  }

  // Reposts naturally start from zero. Depending on real impressions, they rise accordingly:
  // Under 45 impressions: strictly 0
  // Above 45 impressions: rises gradually with impressions + fraction of fire reactions
  let reposts = 0;
  if (impressions > 45) {
    reposts = Math.floor((impressions - 45) * 0.02) + Math.floor(fires * 0.15);
  }

  const views = Math.max(post.views_count || 1, Math.floor(impressions * 0.42));

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
        // Fetch active post and all its replies from banter_comments
        const { data: post, error: postErr } = await supabaseAdmin
          .from('banter_posts')
          .select('*')
          .eq('id', threadId)
          .single();

        if (postErr || !post) {
          res.statusCode = 404;
          res.end(JSON.stringify({ error: 'Thread not found' }));
          return;
        }

        // Calculate dynamic post metrics
        const pMetrics = calculateDynamicMetrics(post);
        post.impressions_count = pMetrics.impressions;
        post.repost_count = pMetrics.reposts;
        post.views_count = pMetrics.views;

        const { data: replies } = await supabaseAdmin
          .from('banter_comments')
          .select('*')
          .eq('post_id', threadId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(100);

        const updatedReplies = (replies || []).map((r: any) => {
          const createdAtMs = r.created_at ? new Date(r.created_at).getTime() : Date.now();
          const elapsedMinutes = Math.max(0, (Date.now() - createdAtMs) / (1000 * 60));
          const rSeed = 6 + ((r.id ? r.id.charCodeAt(0) : 0) % 7);
          const rTimeBonus = Math.floor(15 * Math.log(1 + elapsedMinutes * 0.1));
          const rImpressions = Math.min(350, rSeed + rTimeBonus);
          const rReposts = rImpressions > 45 ? Math.floor((rImpressions - 45) * 0.015) : 0;
          return {
            ...r,
            impressions_count: rImpressions,
            repost_count: rReposts,
            views_count: Math.max(1, Math.floor(rImpressions * 0.35))
          };
        });

        res.statusCode = 200;
        res.end(JSON.stringify({ post, replies: updatedReplies }));
        return;
      }

      // Fetch discourse / feed
      let query = supabaseAdmin
        .from('banter_posts')
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

      // Execute dynamic metrics calculation from elapsed time since sent and persist to database
      const updatedPosts = (posts || []).map((p: any) => {
        const metrics = calculateDynamicMetrics(p);
        const needsUpdate =
          p.impressions_count !== metrics.impressions ||
          p.repost_count !== metrics.reposts ||
          p.views_count !== metrics.views;

        if (needsUpdate) {
          p.impressions_count = metrics.impressions;
          p.repost_count = metrics.reposts;
          p.views_count = metrics.views;
          supabaseAdmin
            .from('banter_posts')
            .update({
              impressions_count: metrics.impressions,
              repost_count: metrics.reposts,
              views_count: metrics.views
            })
            .eq('id', p.id)
            .then();
        }
        return p;
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

        res.statusCode = 201;
        res.end(JSON.stringify({ reply }));
        return;
      }

      // Root message: stored in banter_posts (max 280 chars)
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

      // If poll was sent, store it as a thread comment under this post to prevent injection
      if (poll && poll.options && poll.options.length >= 2) {
        const sanitizedQ = sanitizeText(poll.question).slice(0, 70);
        const sanitizedOpts = poll.options.map((o: string) => sanitizeText(o).slice(0, 50)).filter(Boolean);
        const pollContent = `[poll:${JSON.stringify({ q: sanitizedQ, o: sanitizedOpts })}]`.slice(0, 200);
        try {
          await supabaseAdmin.from('banter_comments').insert([{
            post_id: post.id,
            author_handle: 'poll_bot',
            author_type: 'user',
            content: pollContent,
            status: 'active'
          }]);
        } catch (pollErr) {
          console.warn('Poll thread comment store deferred:', pollErr);
        }
      }

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
