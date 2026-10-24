const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

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

const supabase = createClient(env.VITE_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY || env.VITE_SUPABASE_SERVICE_ROLE_KEY);

async function verifyStoreAndAdmin() {
  console.log('Verifying store and admin data consistency from Supabase...\n');

  // 1. Fetch categories
  const { data: categories, error: catErr } = await supabase
    .from('categories')
    .select('*')
    .order('display_order', { ascending: true });
  if (catErr) throw catErr;

  console.log(`Categories found: ${categories.length}`);
  categories.forEach(c => console.log(`  - [${c.slug}] "${c.name}"`));

  // 2. Fetch full catalog exactly like syncCatalogFromDatabase() does
  const { data: products, error: prodErr } = await supabase
    .from('products')
    .select(`
      *,
      product_images ( id, product_id, image_path, display_order, is_primary ),
      categories ( id, name, slug, class_id ),
      product_classes ( id, code, name )
    `)
    .order('created_at', { ascending: false });
  if (prodErr) throw prodErr;

  console.log(`\nProducts loaded: ${products.length} / 100`);

  // Verify all products have images
  let missingImagesCount = 0;
  let invalidIdFormat = 0;
  let jerseysWithColorImages = 0;
  let teamSetsCount = 0;

  for (const p of products) {
    const images = (p.product_images || []).map(img => img.image_path);
    if (images.length === 0) {
      console.error(`Product ${p.sku} has no images!`);
      missingImagesCount++;
    }

    if (!/^[ITCO][A-Z]-[0-9]{5}$/.test(p.sku)) {
      console.error(`Product SKU ${p.sku} has invalid format!`);
      invalidIdFormat++;
    }

    if (p.categories?.slug === 'kit' && Array.isArray(p.colors) && p.colors.some(c => c.image)) {
      jerseysWithColorImages++;
    }

    if (p.product_classes?.code === 'T') {
      teamSetsCount++;
    }
  }

  console.log(`Missing images count: ${missingImagesCount}`);
  console.log(`Invalid ID format count: ${invalidIdFormat}`);
  console.log(`Jerseys with color-specific photos: ${jerseysWithColorImages}`);
  console.log(`Team class (T) products: ${teamSetsCount}`);

  // 3. Admin Ledger & Category Cards Reconciliation Check
  console.log('\n--- ADMIN DASHBOARD CATEGORY INVENTORY RECONCILIATION ---');
  let totalStockInAdmin = 0;
  for (const cat of categories) {
    const catProds = products.filter(p => p.categories?.slug === cat.slug);
    const catStock = catProds.reduce((sum, p) => sum + (p.stock_count || 0), 0);
    totalStockInAdmin += catStock;
    console.log(`Admin Category Card "${cat.name.padEnd(22)}": ${String(catProds.length).padStart(2)} Products | Total Stock: ${catStock} units`);
  }

  console.log(`\nAdmin Total Products Ledger: ${products.length} items`);
  console.log(`Admin Total Units in Stock:  ${totalStockInAdmin} units`);

  // 4. Verification assertions
  if (products.length !== 100) {
    throw new Error(`Expected 100 products, got ${products.length}`);
  }
  if (missingImagesCount > 0) {
    throw new Error(`Found ${missingImagesCount} products with no images!`);
  }
  if (invalidIdFormat > 0) {
    throw new Error(`Found ${invalidIdFormat} products with invalid IDs!`);
  }

  console.log('\n>>> ALL 100 PRODUCTS VERIFIED PERFECTLY FOR STORE & ADMIN DASHBOARD! <<<');
}

verifyStoreAndAdmin().catch(console.error);
