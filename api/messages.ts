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

function getPostHash(id?: string): number {
  if (!id) return 42;
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function calculateDynamicMetrics(post: {
  id?: string;
  created_at?: string;
  createdAt?: string;
  impressions_count?: number;
  repost_count?: number;
  views_count?: number;
  reaction_fire_count?: number;
  reaction_clown_count?: number;
  reaction_skull_count?: number;
  comment_count?: number;
  is_trending?: boolean;
  parent_id?: string | null;
}) {
  const createdStr = post.created_at || post.createdAt;
  const now = Date.now();
  const createdTime = createdStr ? new Date(createdStr).getTime() : now;
  const ageSec = Math.max(0, Math.floor((now - createdTime) / 1000));
  const seed = getPostHash(post.id);
  const seedMod = seed % 95; // 0 to 94

  const reactions = (post.reaction_fire_count || 0) + (post.reaction_clown_count || 0) + (post.reaction_skull_count || 0);
  const comments = post.comment_count || 0;
  const dbImpressions = post.impressions_count ?? 0;
  const dbReposts = post.repost_count ?? 0;
  const dbViews = post.views_count ?? 0;

  let impressions = 0;
  if (ageSec <= 0) {
    impressions = dbImpressions > 0 ? dbImpressions : 0;
  } else {
    const T = ageSec / 10800; // 1.0 at exactly 3 hours (10800s)
    let simulated = 0;
    if (T < 1.0) {
      // 0 to 3 hours: smooth progression from 0 towards 505 + seedMod
      const targetAt3h = 505 + seedMod;
      simulated = Math.floor(Math.pow(T, 1.25) * targetAt3h);
    } else {
      // >= 3 hours: strictly >= 505, smoothly growing with log curve
      const baseAt3h = 505 + seedMod;
      const growth = Math.min(1100, Math.floor(380 * Math.log(T)));
      const engagementBonus = Math.min(300, reactions * 4 + comments * 6);
      simulated = Math.min(1880, baseAt3h + growth + engagementBonus);
    }

    impressions = Math.max(dbImpressions, simulated);
    // Guarantee: all messages after 3 hours must be strictly above 500 impressions
    if (ageSec >= 10800) {
      impressions = Math.max(505 + seedMod, impressions);
    }
  }

  const views = impressions > 0 ? (dbViews > 0 ? Math.max(dbViews, Math.floor(impressions * 0.42)) : Math.floor(impressions * 0.42)) : 0;
  const reposts = (post.parent_id)
    ? dbReposts
    : (impressions > 60 ? Math.max(dbReposts, Math.floor(impressions * 0.012) + (reactions > 6 ? 1 : 0)) : dbReposts);

  // Trending flag is strictly false by default and assigned to only one message across the feed
  const isTrending = Boolean(post.is_trending);

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

        // 1. Direct and nested comments from banter_comments (iterative deep load)
        let allComments: any[] = [];
        let parentIds = [threadId];
        let depth = 0;
        const seenCommentIds = new Set<string>();

        while (parentIds.length > 0 && depth < 8) {
          const { data: batch } = await supabaseAdmin
            .from('banter_comments')
            .select('*')
            .in('post_id', parentIds)
            .eq('status', 'active')
            .order('created_at', { ascending: true })
            .limit(200);

          if (!batch || batch.length === 0) break;

          const nextParentIds: string[] = [];
          for (const item of batch) {
            if (!seenCommentIds.has(item.id)) {
              seenCommentIds.add(item.id);
              allComments.push(item);
              nextParentIds.push(item.id);
            }
          }
          parentIds = nextParentIds;
          depth++;
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
          let directParentId = r.post_id;
          let replyContent = r.content || '';
          const tagIdx = replyContent.indexOf('[reply_to:');
          if (tagIdx !== -1) {
            const endIdx = replyContent.indexOf(']', tagIdx);
            if (endIdx !== -1) {
              directParentId = replyContent.slice(tagIdx + 10, endIdx);
              replyContent = (replyContent.slice(0, tagIdx) + replyContent.slice(endIdx + 1)).trim();
            }
          }

          const parentAuthor = (directParentId === threadId || directParentId === post.id)
            ? post.author_handle
            : (combinedReplies.find(x => x.id === directParentId)?.author_handle || post.author_handle);
          const parsedReplyPoll = parsePollFromContent(replyContent, r.id);
          const parsedReplyMedia = parseMediaFromContent(parsedReplyPoll.cleanContent || replyContent);
          const mUrls = r.media_urls || (parsedReplyMedia.mediaUrls.length > 0 ? parsedReplyMedia.mediaUrls : (r.image_url ? [r.image_url] : []));
          const mType = r.media_type || (parsedReplyMedia.mediaType !== 'NONE' ? parsedReplyMedia.mediaType : (mUrls.length > 0 ? 'IMAGE' : 'NONE'));
          const rType = parsedReplyPoll.poll ? 'poll' : (mType === 'VIDEO' ? 'video' : (mUrls.length > 0 ? 'image' : 'text'));

          const dynamic = calculateDynamicMetrics({
            id: r.id,
            created_at: r.created_at,
            createdAt: r.created_at,
            impressions_count: r.impressions_count ?? r.impressions,
            views_count: r.views_count ?? r.views,
            repost_count: r.repost_count ?? r.reposts_count,
            reaction_fire_count: r.reaction_fire_count || r.likes_count || 0,
            comment_count: 0,
            parent_id: directParentId,
            is_trending: false
          });

          return {
            ...r,
            parent_id: directParentId,
            parentId: directParentId,
            root_id: threadId,
            rootId: threadId,
            depth: directParentId === threadId ? 1 : 2,
            content: parsedReplyPoll.cleanContent || parsedReplyMedia.cleanContent || replyContent,
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
            impressions_count: dynamic.impressions,
            impressions: dynamic.impressions,
            views_count: dynamic.views,
            views: dynamic.views,
            repost_count: dynamic.reposts,
            repostsCount: dynamic.reposts,
            is_trending: false,
            isTrending: false
          };
        });

        // Compute dynamic metrics for the root post
        const postDynamic = calculateDynamicMetrics({
          id: post.id,
          created_at: post.created_at,
          createdAt: post.created_at,
          impressions_count: post.impressions_count ?? post.impressions,
          views_count: post.views_count ?? post.views,
          repost_count: post.repost_count ?? post.reposts_count,
          reaction_fire_count: post.reaction_fire_count,
          reaction_clown_count: post.reaction_clown_count,
          reaction_skull_count: post.reaction_skull_count,
          comment_count: updatedReplies.length,
          is_trending: post.is_trending,
          parent_id: null
        });

        post.impressions_count = postDynamic.impressions;
        post.impressions = postDynamic.impressions;
        post.views_count = postDynamic.views;
        post.views = postDynamic.views;
        post.repost_count = postDynamic.reposts;
        post.repostsCount = postDynamic.reposts;
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

        const dynamic = calculateDynamicMetrics({
          id: p.id,
          created_at: p.created_at,
          createdAt: p.created_at,
          impressions_count: p.impressions_count ?? p.impressions,
          views_count: p.views_count ?? p.views,
          repost_count: p.repost_count ?? p.reposts_count,
          reaction_fire_count: p.reaction_fire_count,
          reaction_clown_count: p.reaction_clown_count,
          reaction_skull_count: p.reaction_skull_count,
          comment_count: p.comment_count,
          parent_id: p.parent_id,
          is_trending: false
        });

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
          types: [pType],
          impressions_count: dynamic.impressions,
          impressions: dynamic.impressions,
          views_count: dynamic.views,
          views: dynamic.views,
          repost_count: dynamic.reposts,
          repostsCount: dynamic.reposts,
          is_trending: false,
          isTrending: false
        };
      });

      // Trending flag is placed strictly on ONLY ONE message across the feed (the single #1 leader)
      if (updatedPosts.length > 0) {
        const rootPosts = updatedPosts.filter((p: any) => !p.parent_id && !p.parentId);
        const candidates = rootPosts.length > 0 ? rootPosts : updatedPosts;
        const sorted = [...candidates].sort((a: any, b: any) => {
          const engA = (a.reaction_fire_count || 0) * 3 + (a.comment_count || 0) * 5 + (a.repost_count || 0) * 2;
          const engB = (b.reaction_fire_count || 0) * 3 + (b.comment_count || 0) * 5 + (b.repost_count || 0) * 2;
          if (engB !== engA) return engB - engA;
          return (b.impressions_count || 0) - (a.impressions_count || 0);
        });

        if (sorted[0]) {
          const topLeaderId = sorted[0].id;
          updatedPosts.forEach((p: any) => {
            if (p.id === topLeaderId) {
              p.is_trending = true;
              p.isTrending = true;
              if (p.impressions_count <= 1500) {
                p.impressions_count = 1500 + Math.min(440, 220 + ((p.reaction_fire_count || 0) * 2));
              } else if (p.impressions_count > 1940) {
                p.impressions_count = 1940;
              }
              p.impressions = p.impressions_count;
              p.views_count = Math.floor(p.impressions_count * 0.42);
              p.views = p.views_count;
            } else {
              p.is_trending = false;
              p.isTrending = false;
            }
          });
        }
      }

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

      const rawDeviceId = body.deviceId || body.authorDeviceId || null;
      const effectiveDeviceId = (rawDeviceId && /^[0-9a-f-]{36}$/i.test(rawDeviceId)) ? rawDeviceId : null;

      if (parentId) {
        // Resolve target post in banter_posts (banter_comments.post_id references banter_posts.id)
        let targetPostId = parentId;
        let isDeepReply = false;

        if (body.rootId && body.rootId !== parentId) {
          targetPostId = body.rootId;
          isDeepReply = true;
        } else {
          const { data: directPost } = await supabaseAdmin
            .from('banter_posts')
            .select('id')
            .eq('id', parentId)
            .maybeSingle();

          if (!directPost) {
            const { data: parentComment } = await supabaseAdmin
              .from('banter_comments')
              .select('post_id')
              .eq('id', parentId)
              .maybeSingle();

            if (parentComment?.post_id) {
              targetPostId = parentComment.post_id;
              isDeepReply = true;
            }
          }
        }

        let replyContent = finalContent || (pollObj ? pollObj.question : 'Reply take');
        if (isDeepReply && !replyContent.includes('[reply_to:')) {
          replyContent = `${replyContent} [reply_to:${parentId}]`.trim();
        }

        const commentId = (id && /^[0-9a-f-]{36}$/i.test(id))
          ? id
          : ((typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : undefined);
        const commentPayload: any = {
          post_id: targetPostId,
          author_handle: sanitizedHandle || 'Fanatic',
          author_type: authorType || 'user',
          content: replyContent,
          status: 'active'
        };
        if (commentId) commentPayload.id = commentId;

        if (effectiveDeviceId) {
          const { data: dRow } = await supabaseAdmin
            .from('anonymous_devices')
            .select('device_id')
            .eq('device_id', effectiveDeviceId)
            .maybeSingle();
          if (dRow) commentPayload.device_id = effectiveDeviceId;
        }

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

        // Increment root post comment_count
        const { data: p } = await supabaseAdmin
          .from('banter_posts')
          .select('comment_count')
          .eq('id', targetPostId)
          .single();

        if (p) {
          await supabaseAdmin
            .from('banter_posts')
            .update({ comment_count: (p.comment_count || 0) + 1 })
            .eq('id', targetPostId);
        }

        const parentAuthor = req.body?.replyingToHandle || null;
        const rType = pollObj ? 'poll' : (mediaType === 'VIDEO' ? 'video' : (uploadedMediaUrls.length > 0 ? 'image' : 'text'));
        reply.type = rType;
        reply.types = [rType];
        reply.replying_to = parentAuthor;
        reply.replyingToHandle = parentAuthor;
        reply.impressions_count = 0;
        reply.impressions = 0;
        reply.views_count = 0;
        reply.views = 0;
        reply.repost_count = 0;
        reply.repostsCount = 0;
        reply.is_trending = false;
        reply.isTrending = false;
        if (pollObj) {
          reply.poll = pollObj;
          reply.pollId = pollObj.id;
        }

        res.statusCode = 201;
        res.end(JSON.stringify({ reply }));
        return;
      }

      // Root message: stored in banter_posts with strict default 0 metrics
      const declaredType = pollObj ? 'poll' : (mediaType === 'VIDEO' ? 'video' : (uploadedMediaUrls.length > 0 ? 'image' : 'text'));

      const validAuthorTypes = ['user', 'journalist', 'admin', 'seed'];
      const dbAuthorType = validAuthorTypes.includes(authorType) ? authorType : 'user';
      const dbBadge = authorType === 'coach' ? (sanitizedBadge || 'HEAD COACH') : sanitizedBadge;

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
        impressions_count: 0,
        views_count: 0,
        repost_count: 0
      };

      if (effectiveDeviceId) {
        const { data: dRow } = await supabaseAdmin
          .from('anonymous_devices')
          .select('device_id')
          .eq('device_id', effectiveDeviceId)
          .maybeSingle();
        if (dRow) postPayload.device_id = effectiveDeviceId;
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
        post.poll = pollObj;
        post.pollId = pollObj.id;
        post.content = sanitizeText(poll.question) || 'Community Poll';
      }

      post.type = declaredType;
      post.types = [declaredType];
      post.impressions_count = 0;
      post.impressions = 0;
      post.views_count = 0;
      post.views = 0;
      post.repost_count = 0;
      post.repostsCount = 0;
      post.is_trending = false;
      post.isTrending = false;

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
