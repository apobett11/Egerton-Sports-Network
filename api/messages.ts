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

        const { data: replies } = await supabaseAdmin
          .from('banter_comments')
          .select('*')
          .eq('post_id', threadId)
          .eq('status', 'active')
          .order('created_at', { ascending: true })
          .limit(100);

        res.statusCode = 200;
        res.end(JSON.stringify({ post, replies: replies || [] }));
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

      res.statusCode = 200;
      res.end(JSON.stringify({ posts: posts || [] }));
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
        mediaType
      } = body;

      // Upload any base64 data URLs to Supabase Storage bucket banter-media
      let uploadedMediaUrls: string[] = [];
      if (Array.isArray(mediaUrls) && mediaUrls.length > 0) {
        uploadedMediaUrls = await Promise.all(
          mediaUrls.map((url: string) => uploadMediaDataUrl(url, mediaType))
        );
      }

      // Handle media formatting into content if mediaUrls provided
      let finalContent = (content || '').trim();
      if (uploadedMediaUrls.length > 0) {
        const tag = mediaType === 'VIDEO' ? 'video' : 'image';
        uploadedMediaUrls.forEach((url: string) => {
          if (!finalContent.includes(url)) {
            finalContent = `${finalContent} [media:${tag}:${url}]`.trim();
          }
        });
      }

      if (!finalContent) {
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
          author_handle: authorHandle || 'Fanatic',
          author_type: authorType || 'user',
          content: finalContent,
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

      // Root message: stored in banter_posts
      const validAuthorTypes = ['user', 'journalist', 'admin', 'seed'];
      const dbAuthorType = validAuthorTypes.includes(authorType) ? authorType : 'user';
      const dbBadge = authorType === 'coach' ? (authorBadge || 'HEAD COACH') : authorBadge;

      const postPayload: any = {
        author_handle: authorHandle || 'Fanatic',
        author_type: dbAuthorType,
        author_badge: dbBadge || null,
        content: finalContent,
        source_type: 'user',
        status: 'active',
        match_id: matchId || null,
        league_id: leagueId || null,
        reaction_fire_count: 0,
        reaction_clown_count: 0,
        reaction_skull_count: 0,
        comment_count: 0,
        impressions_count: 1,
        views_count: 1,
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
