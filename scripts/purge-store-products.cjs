const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Read .env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split(/\r?\n/).forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let val = (match[2] || '').trim();
    if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
    if (val.startsWith("'") && val.endsWith("'")) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error('Missing Supabase URL or Service Role Key in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('Connecting to Supabase at:', supabaseUrl);

  // Check product_images
  const { data: images, count: imgCount, error: imgErr } = await supabase
    .from('product_images')
    .select('id', { count: 'exact' });
  console.log('Initial product_images count:', imgCount, 'error:', imgErr?.message || 'none');

  if (images && images.length > 0) {
    console.log(`Deleting ${images.length} product images...`);
    const { error: delImgErr } = await supabase
      .from('product_images')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (delImgErr) console.error('Error deleting product_images:', delImgErr.message);
    else console.log('Successfully deleted all product_images rows.');
  }

  // Check products
  const { data: prods, count: prodCount, error: prodErr } = await supabase
    .from('products')
    .select('id, name, sku', { count: 'exact' });
  console.log('Initial products count:', prodCount, 'error:', prodErr?.message || 'none');

  if (prods && prods.length > 0) {
    console.log(`Deleting ${prods.length} products...`);
    const { error: delProdErr } = await supabase
      .from('products')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    if (delProdErr) console.error('Error deleting products:', delProdErr.message);
    else console.log('Successfully deleted all products rows.');
  }

  // Check storage bucket files
  try {
    const { data: files, error: filesErr } = await supabase.storage
      .from('product-images')
      .list('products', { limit: 100 });
    console.log('Files in storage bucket product-images/products:', files ? files.length : 0, 'error:', filesErr?.message || 'none');
    if (files && files.length > 0) {
      console.log('Sample storage items:', files.map(f => f.name));
    }
  } catch (e) {
    console.log('Storage check info:', e.message);
  }

  // Final verification
  const { count: finalImgCount } = await supabase.from('product_images').select('id', { count: 'exact', head: true });
  const { count: finalProdCount } = await supabase.from('products').select('id', { count: 'exact', head: true });

  console.log('====================================');
  console.log('VERIFIED IN PRODUCTION SUPABASE:');
  console.log('Total products count:        ', finalProdCount ?? 0);
  console.log('Total product_images count: ', finalImgCount ?? 0);
  console.log('====================================');

  console.log('\nChecking related store tables:');
  const checkTables = ['products', 'product_images', 'store_users', 'store_profiles', 'categories', 'product_classes'];
  for (const t of checkTables) {
    const { count, error } = await supabase.from(t).select('*', { count: 'exact', head: true });
    console.log(`- ${t.padEnd(20)}: ${count ?? 0} rows (status: ${error ? error.message : 'healthy'})`);
  }
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
