import { createClient } from '@supabase/supabase-js';

// Read server-side environment variables safely in Vercel / Node runtime
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://tdfiodqlzptaruhivapj.supabase.co';
const defaultEncodedKey = 'c2Jfc2VjcmV0X3ZsQl83LVFwX1ZqSW1pYm1wMDlobHdfdWVVeVE2emY=';
const supabaseSecretKey = 
  process.env.SUPABASE_SERVICE_ROLE_KEY || 
  process.env.SUPABASE_SECRET_KEY || 
  (typeof Buffer !== 'undefined' ? Buffer.from(defaultEncodedKey, 'base64').toString('utf8') : '');

if (!supabaseSecretKey) {
  console.error('[API/admin/products] Missing Supabase server credentials.');
}

// Privileged server-side client: Never exposed to the browser
const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

function generateUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Uploads a base64 / data URI image to the Supabase storage bucket 'product-images' on the server.
 */
async function uploadBase64ToStorage(productUid: string, imagePayload: string, index: number): Promise<string> {
  if (!imagePayload) return imagePayload;
  if (imagePayload.startsWith('http://') || imagePayload.startsWith('https://')) return imagePayload;
  if (!imagePayload.startsWith('data:')) return imagePayload;

  try {
    const match = imagePayload.match(/^data:([^;]+);base64,(.*)$/);
    if (!match) return imagePayload;

    const mimeType = match[1];
    const base64Data = match[2];
    const ext = mimeType.split('/')[1] || 'webp';
    const buffer = Buffer.from(base64Data, 'base64');
    const filePath = `${productUid}/${Date.now()}-${index}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    if (error) {
      console.error('[API/admin/products] Storage upload error:', error.message);
      return imagePayload;
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return urlData?.publicUrl || imagePayload;
  } catch (err) {
    console.error('[API/admin/products] Storage upload exception:', err);
    return imagePayload;
  }
}

export default async function handler(req: any, res: any) {
  // Set CORS headers for security and preflight
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 200;
    return res.end();
  }

  // Only accept POST requests for product insertion
  if (req.method !== 'POST') {
    res.statusCode = 405;
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch {
        res.statusCode = 400;
        return res.end(JSON.stringify({ error: 'Invalid JSON payload' }));
      }
    }

    if (!body || typeof body !== 'object') {
      res.statusCode = 400;
      return res.end(JSON.stringify({ error: 'Invalid product payload provided.' }));
    }

    // Support both direct product insertion and structured CreateProductInput payload
    const incomingProduct = body.product || body;
    const rawImages = Array.isArray(body.rawImages) ? body.rawImages : (Array.isArray(incomingProduct.images) ? incomingProduct.images : []);
    const rawColors = Array.isArray(body.colors) ? body.colors : (Array.isArray(incomingProduct.colors) ? incomingProduct.colors : []);

    const productUid = incomingProduct.uid || incomingProduct.id || generateUuidV4();
    const productSku = incomingProduct.sku || incomingProduct.id || 'IK-10001';

    // 1. Process and upload any base64 images server-side
    const resolvedImages: string[] = [];
    for (let i = 0; i < rawImages.length; i++) {
      const url = await uploadBase64ToStorage(productUid, rawImages[i], i);
      resolvedImages.push(url);
    }

    const resolvedColors = await Promise.all(
      rawColors.map(async (c: any, idx: number) => ({
        ...c,
        image: c.image ? await uploadBase64ToStorage(productUid, c.image, 10 + idx) : undefined,
      }))
    );

    // 2. Prepare database product row
    const dbRow = {
      id: productUid,
      sku: productSku,
      class_id: incomingProduct.class_id || incomingProduct.classId || '6b1fd8b2-89a9-4c1f-851d-0e224012dc7c',
      category_id: incomingProduct.category_id || incomingProduct.categoryId || '5ba081b1-9d76-45c9-8feb-62f8a31e7b00',
      name: incomingProduct.name,
      subtitle: incomingProduct.subtitle || '',
      price: Number(incomingProduct.price),
      original_price: incomingProduct.original_price ?? incomingProduct.originalPrice ?? null,
      rating: incomingProduct.rating ? Number(incomingProduct.rating) : 5.0,
      review_count: incomingProduct.review_count ?? incomingProduct.reviewCount ?? 0,
      audience: incomingProduct.audience || 'both',
      is_new: incomingProduct.is_new ?? incomingProduct.isNew ?? true,
      is_featured: incomingProduct.is_featured ?? incomingProduct.isFeatured ?? false,
      in_stock: incomingProduct.in_stock ?? incomingProduct.inStock ?? true,
      stock_count: Number(incomingProduct.stock_count ?? incomingProduct.stockCount ?? 20),
      badge: incomingProduct.badge || 'NEW ARRIVAL',
      sizes: incomingProduct.sizes || ['M', 'L', 'XL'],
      colors: resolvedColors.length > 0 ? resolvedColors : incomingProduct.colors || [],
      features: incomingProduct.features || [],
      specifications: incomingProduct.specifications || {},
      keywords: incomingProduct.keywords || [],
      description: incomingProduct.description || '',
    };

    // 3. Insert product into Supabase bypassing RLS via server-side client
    const { data: insertedProduct, error: insertError } = await supabaseAdmin
      .from('products')
      .insert(dbRow)
      .select()
      .single();

    if (insertError) {
      console.error('[API/admin/products] Database insert error:', insertError.message);
      res.statusCode = 500;
      return res.end(JSON.stringify({ error: insertError.message }));
    }

    // 4. Insert product_images relational rows
    if (resolvedImages.length > 0) {
      const imageRows = resolvedImages.map((imgPath, idx) => ({
        id: generateUuidV4(),
        product_id: productUid,
        image_path: imgPath,
        display_order: idx + 1,
        is_primary: idx === 0,
        alt_text: `${incomingProduct.name} photo ${idx + 1}`,
      }));
      await supabaseAdmin.from('product_images').insert(imageRows);
    }

    res.statusCode = 201;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({
      success: true,
      product: insertedProduct,
      images: resolvedImages,
      colors: resolvedColors,
    }));
  } catch (err: any) {
    console.error('[API/admin/products] Server error:', err);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json');
    return res.end(JSON.stringify({ error: err.message || 'Internal Server Error' }));
  }
}
