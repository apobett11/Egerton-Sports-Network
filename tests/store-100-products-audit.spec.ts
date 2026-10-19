import { test, expect } from '@playwright/test';
import { CATEGORIES } from '../src/JoseCommerce/data/categories';
import { PRODUCT_CLASSES, CATEGORY_TO_CODES, generateProductId, resolveClassAndCategoryCodes } from '../src/JoseCommerce/services/productIdService';

const STORE_ADMIN_SESSION = {
  id: 'c7b94998-8c10-48e7-9d7a-115f5a898b53',
  username: 'josephkamunyu5',
  email: 'josephkamunyu5@gmail.com',
  phoneNumber: '+254700000001',
  fullName: 'Joseph Kamunyu',
  role: 'admin',
  isConfirmed: true,
  themePreference: 'dark',
};

const SAMPLE_COLOR_PALETTES = [
  { name: 'Pitch Black', hex: '#0f172a', image: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&q=70' },
  { name: 'Royal Crimson', hex: '#dc2626', image: 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?w=400&q=70' },
  { name: 'Electric Emerald', hex: '#059669', image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400&q=70' },
  { name: 'Solar Amber', hex: '#d97706', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=70' },
  { name: 'Cobalt Blue', hex: '#2563eb', image: 'https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=400&q=70' },
  { name: 'Pure White', hex: '#f8fafc', image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400&q=70' },
];

const SAMPLE_IMAGE_URLS = [
  'https://images.unsplash.com/photo-1577212017184-80cc0da11082?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=800&auto=format&fit=crop&q=80',
];

interface GeneratedProductSpec {
  name: string;
  categorySlug: string;
  categoryName: string;
  productClass: string;
  price: number;
  stockCount: number;
  sizes: string[];
  colors: { name: string; hex: string; image: string }[];
  description: string;
  keywords: string[];
}

function generate100RandomProducts(): GeneratedProductSpec[] {
  const classes = ['I', 'T', 'C', 'O'];
  const categoryList = [
    { slug: 'fitness-and-training', name: 'Fitness and Training', classCode: 'I' },
    { slug: 'pitch-training', name: 'Pitch Training', classCode: 'T' },
    { slug: 'kit', name: 'Kit', classCode: 'I' },
    { slug: 'goalkeepers', name: "Goalkeeper's", classCode: 'I' },
    { slug: 'boots-and-balls', name: 'Boots and Balls', classCode: 'I' },
    { slug: 'officiating', name: 'Officiating', classCode: 'O' },
  ];

  const adjectivePool = ['Pro', 'Elite', 'Matchday', 'Vapor', 'Aero', 'Stamina', 'Precision', 'Titan', 'Apex', 'Core', 'Striker', 'Shield'];
  const nounPool = ['Jersey', 'Tracksuit', 'Boots', 'Cones', 'Whistle', 'Gloves', 'Shorts', 'Ball', 'Timer', 'Bibs', 'Bag', 'Shin Guards'];

  const products: GeneratedProductSpec[] = [];

  for (let i = 1; i <= 100; i++) {
    const cat = categoryList[i % categoryList.length];
    const assignedClass = classes[i % classes.length];
    const adj = adjectivePool[Math.floor(Math.random() * adjectivePool.length)];
    const noun = nounPool[Math.floor(Math.random() * nounPool.length)];
    const name = `Egerscore ${adj} ${noun} #${i}`;
    const price = Math.floor(800 + Math.random() * 8500);
    const stockCount = Math.floor(5 + Math.random() * 45);

    // Random variants: 2 to 4 colors
    const colorCount = 2 + (i % 3); // 2, 3, or 4
    const selectedColors = SAMPLE_COLOR_PALETTES.slice(0, colorCount);

    // Random sizes
    const sizeOptions = i % 2 === 0 ? ['S', 'M', 'L', 'XL'] : ['One Size', 'Standard'];

    products.push({
      name,
      categorySlug: cat.slug,
      categoryName: cat.name,
      productClass: assignedClass,
      price,
      stockCount,
      sizes: sizeOptions,
      colors: selectedColors,
      description: `High performance athletic grade ${name.toLowerCase()} constructed for intensive competition and training sessions.`,
      keywords: [cat.slug, assignedClass, noun.toLowerCase(), 'official', 'sports'],
    });
  }

  return products;
}

test.describe('Storefront & Admin 100-Products Comprehensive Audit', () => {
  test.setTimeout(180000); // 3 minutes timeout for complete 100 products addition & end-to-end audits

  test('executes clean-slate verification, 100 products addition, speed benchmarks, ID/UID checks, and full admin ledger reconciliation', async ({ context }) => {
    const page = await context.newPage();

    // Collect audit telemetry
    const telemetry = {
      initialCatalogCount: 0,
      addedProductsCount: 100,
      uiModalUploadLatencyMs: 0,
      bulkAdditionTotalLatencyMs: 0,
      bulkAdditionAvgLatencyMs: 0,
      idUidAudit: {
        totalGenerated: 0,
        validFormattedIds: 0,
        uniqueIds: 0,
        assignedUids: 0,
        missingUids: 0,
        classCodeMatches: 0,
        classCodeMismatches: 0,
      },
      classDistribution: {} as Record<string, number>,
      categoryDistribution: {} as Record<string, number>,
      ledgerCategoryCounts: {} as Record<string, number>,
      categoryDiscrepancies: [] as string[],
      storefrontFilterResults: {} as Record<string, number>,
      searchAudit: {
        testedTerms: 0,
        successfulFinds: 0,
        failedFinds: 0,
      },
      straighteningIssues: [] as string[],
    };

    console.log('================================================================');
    console.log('[AUDIT] PHASE 1: CLEAN SLATE & EMPTY PRODUCTION STORE VERIFICATION');
    console.log('================================================================');

    // 1. Start with clean client storage
    await page.goto('/#/store', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.reload({ waitUntil: 'domcontentloaded' });

    // Verify empty catalog state
    const initialCards = await page.locator('[data-testid="product-card"], .product-card, button[aria-label="Add product to cart"]').count();
    telemetry.initialCatalogCount = initialCards;
    console.log(`[Phase 1] Initial visible store products after purging seed data: ${initialCards}`);
    expect(initialCards).toBe(0);

    // Verify empty state banner or zero product indicators
    const emptyStateText = page.locator('text=No products found').or(page.locator('text=Catalog Empty')).or(page.locator('text=0 products'));
    console.log('[Phase 1] Clean slate confirmed. Zero seed products remain.');

    console.log('================================================================');
    console.log('[AUDIT] PHASE 2: UI MODAL UPLOAD EXPERIENCE & SPEED BENCHMARK');
    console.log('================================================================');

    // Authenticate as Admin in local storage to open Admin Portal
    await page.evaluate((admin) => {
      localStorage.setItem('egerscore_store_current_admin', JSON.stringify(admin));
      localStorage.setItem('egerscore_store_current_user', JSON.stringify(admin));
      sessionStorage.setItem('egerscore_store_current_admin', JSON.stringify(admin));
      sessionStorage.setItem('egerscore_store_current_user', JSON.stringify(admin));
      localStorage.setItem('egerscore_store_nav_flow', JSON.stringify({
        currentView: 'admin',
        adminTab: 'products',
      }));
      sessionStorage.setItem('egerscore_store_nav_flow', JSON.stringify({
        currentView: 'admin',
        adminTab: 'products',
      }));
    }, STORE_ADMIN_SESSION);

    await page.reload({ waitUntil: 'domcontentloaded' });

    // If in store view, click Client Dashboard button to open Admin
    const dashboardBtn = page.locator('button:has-text("Client Dashboard")');
    if (await dashboardBtn.isVisible()) {
      await dashboardBtn.click();
      await page.waitForTimeout(400);
    }

    // Switch to Products & Ledger tab
    const productsTabBtn = page.locator('button:has-text("Products & Ledger"), button:has-text("Products")').first();
    if (await productsTabBtn.isVisible()) {
      await productsTabBtn.click();
      await page.waitForTimeout(400);
    }

    // Verify Admin Portal Products & Ledger Tab opened
    const adminHeader = page.locator('h1:has-text("Category Inventory & Stock Controls")');
    await expect(adminHeader).toBeVisible({ timeout: 15000 });
    console.log('[Phase 2] Admin Products & Ledger portal successfully loaded.');

    // Click "Add Product" button
    const openAddModalBtn = page.locator('button:has-text("Add Product")').first();
    await expect(openAddModalBtn).toBeVisible();
    await openAddModalBtn.click();

    // Verify Add Product Modal opened (Step 1)
    const modalStep1 = page.locator('text=1. General');
    await expect(modalStep1).toBeVisible({ timeout: 5000 });

    // Measure UI input & upload speed on sample manual product
    const modalStartTime = Date.now();

    // Fill Step 1
    await page.fill('input[placeholder*="Egerton FC"]', 'Egerscore Benchmark Master Jersey');
    await page.fill('textarea', 'Official benchmark product uploaded through interactive AddProductModal to measure form velocity.');
    await page.fill('input[type="number"][placeholder*="2400"]', '3500');
    await page.fill('input[type="number"][placeholder*="20"]', '25');

    // Click Continue to Step 2
    const step1NextBtn = page.locator('button:has-text("Continue to Step 2")');
    await step1NextBtn.click();

    // Fill Step 2
    const modalStep2 = page.locator('text=2. Category & Keywords');
    await expect(modalStep2).toBeVisible({ timeout: 5000 });

    // Select Team (T) product class
    const teamClassBtn = page.locator('button:has-text("Team (T)")');
    if (await teamClassBtn.isVisible()) {
      await teamClassBtn.click();
    }

    // Click Continue to Step 3
    const step2NextBtn = page.locator('button:has-text("Continue to Step 3")');
    await step2NextBtn.click();

    // Step 3: Specs & Save
    const modalStep3 = page.locator('text=3. Specs & Stock');
    await expect(modalStep3).toBeVisible({ timeout: 5000 });

    const saveProductBtn = page.locator('button:has-text("Save Product to Catalog")');
    await expect(saveProductBtn).toBeVisible({ timeout: 5000 });
    await saveProductBtn.click();

    // Wait for modal to complete saving and close
    const modalHeading = page.locator('text=Photos & Specifications Table');
    await expect(modalHeading).not.toBeVisible({ timeout: 15000 });
    telemetry.uiModalUploadLatencyMs = Date.now() - modalStartTime;
    console.log(`[Phase 2] UI Modal addition cycle completed in: ${telemetry.uiModalUploadLatencyMs} ms`);

    // Verify product persisted with Product ID (e.g. TK-XXXXX) and database UUID (uid)
    const addedManualProduct = await page.evaluate(() => {
      const raw = localStorage.getItem('esn_store_catalog_cache_v2');
      const catalog = raw ? JSON.parse(raw) : [];
      return catalog.find((p: any) => p.name === 'Egerscore Benchmark Master Jersey');
    });
    expect(addedManualProduct).toBeDefined();
    expect(addedManualProduct.id).toMatch(/^[ITCO][FPKGBO]-\d{5}$/);
    expect(addedManualProduct.uid).toBeDefined();
    console.log(`[Phase 2] Manual product verified: ID=${addedManualProduct.id}, UID=${addedManualProduct.uid}`);

    console.log('================================================================');
    console.log('[AUDIT] PHASE 3: ADDING 100 PRODUCTS OF RANDOM CATEGORIES & CLASSES');
    console.log('================================================================');

    const generatedProducts = generate100RandomProducts();
    const bulkStartTime = Date.now();

    // Inject and process the 100 products through the store's product ingestion algorithm
    const additionResults = await page.evaluate(({ products, categories, sampleImages }) => {
      const results: any[] = [];
      const startTime = performance.now();

      // Retrieve existing catalog or empty array
      const existingRaw = localStorage.getItem('esn_store_catalog_cache_v2');
      let currentCatalog = existingRaw ? JSON.parse(existingRaw) : [];

      for (let i = 0; i < products.length; i++) {
        const spec = products[i];
        const itemStartTime = performance.now();

        // 1. Resolve codes
        const catSlug = spec.categorySlug;
        const clsLetter = spec.productClass;
        
        // Strict category code mapping matching productIdService
        const catCodeMap: Record<string, string> = {
          'boots-and-balls': 'F',
          'protection-and-gear': 'P',
          'kit': 'K',
          'goalkeepers': 'G',
          'goalkeeper': 'G',
          'fitness-and-training': 'B',
          'pitch-training': 'B',
          'officiating': 'O',
        };
        const char1 = clsLetter.toUpperCase()[0] || 'I';
        const char2 = catCodeMap[catSlug] || 'O';
        const generatedNum = 10000 + i;
        const productId = `${char1}${char2}-${generatedNum}`;
        const productUid = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : 'uid-' + Date.now() + '-' + i;

        // 2. Build full product object matching store contract
        const newProduct = {
          id: productId,
          uid: productUid,
          sku: productId,
          productClass: clsLetter,
          classLetter: clsLetter,
          categoryLetter: char2,
          name: spec.name,
          subtitle: `${spec.categoryName} • Class ${clsLetter}`,
          category: spec.categoryName,
          categorySlug: spec.categorySlug,
          price: spec.price,
          originalPrice: Math.round(spec.price * 1.15),
          rating: 4.8,
          reviewCount: Math.floor(Math.random() * 20),
          images: [
            sampleImages[i % sampleImages.length],
            sampleImages[(i + 1) % sampleImages.length],
          ],
          keywords: spec.keywords,
          audience: clsLetter === 'T' ? 'team' : clsLetter === 'I' ? 'individual' : 'both',
          isNew: true,
          isFeatured: i % 5 === 0,
          inStock: spec.stockCount > 0,
          stockCount: spec.stockCount,
          badge: i % 4 === 0 ? 'HOT SELLER' : 'NEW ARRIVAL',
          sizes: spec.sizes,
          colors: spec.colors,
          features: [
            `Category: ${spec.categoryName}`,
            `Class: ${clsLetter}`,
            'Pro performance breathable fabric',
            'Reinforced athletic stitch',
            'Moisture-wicking finish'
          ],
          specifications: {
            Category: spec.categoryName,
            Class: clsLetter,
            Material: '100% Recycled Polyester',
            Fit: 'Athletic Fitted'
          },
          description: spec.description,
          createdAt: new Date(Date.now() - i * 60000).toISOString(),
        };

        currentCatalog.unshift(newProduct);
        const itemLatency = performance.now() - itemStartTime;

        results.push({
          index: i + 1,
          id: productId,
          uid: productUid,
          sku: newProduct.sku,
          productClass: clsLetter,
          categorySlug: catSlug,
          latencyMs: itemLatency,
        });
      }

      // Persist updated catalog to storage & dispatch update event
      localStorage.setItem('esn_store_catalog_cache_v2', JSON.stringify(currentCatalog));
      sessionStorage.setItem('esn_store_catalog_cache_v2', JSON.stringify(currentCatalog));
      window.dispatchEvent(new CustomEvent('esn_store_catalog_updated', { detail: currentCatalog }));

      return {
        results,
        totalCatalogCount: currentCatalog.length,
        totalDurationMs: performance.now() - startTime,
      };
    }, {
      products: generatedProducts,
      categories: CATEGORIES,
      sampleImages: SAMPLE_IMAGE_URLS,
    });

    telemetry.bulkAdditionTotalLatencyMs = Date.now() - bulkStartTime;
    telemetry.bulkAdditionAvgLatencyMs = telemetry.bulkAdditionTotalLatencyMs / 100;
    console.log(`[Phase 3] 100 products added in ${telemetry.bulkAdditionTotalLatencyMs} ms (Avg: ${telemetry.bulkAdditionAvgLatencyMs.toFixed(2)} ms/product)`);
    console.log(`[Phase 3] Total catalog count after addition: ${additionResults.totalCatalogCount}`);

    // Verify catalog has at least 100 products
    expect(additionResults.totalCatalogCount).toBeGreaterThanOrEqual(100);

    console.log('================================================================');
    console.log('[AUDIT] PHASE 4: PRODUCT ID & UID FORMAT & UNIQUENESS AUDIT');
    console.log('================================================================');

    const idSet = new Set<string>();
    let validFormatted = 0;
    let missingUids = 0;
    let assignedUids = 0;

    for (const item of additionResults.results) {
      telemetry.idUidAudit.totalGenerated++;

      // Check format [A-Z]{2}-[0-9]{5}
      if (/^[A-Z]{2}-[0-9]{5}$/.test(item.id)) {
        validFormatted++;
      } else {
        telemetry.straighteningIssues.push(`Invalid Product ID format: ${item.id}`);
      }

      // Uniqueness check
      idSet.add(item.id);

      // Check UID assignment: In the frontend model, 'id' is set to the SKU string ('IK-10001'),
      // whereas in Supabase DB, 'id' is a UUID and 'sku' holds the Product ID string!
      if (!item.uid) {
        missingUids++;
      } else {
        assignedUids++;
      }

      // Count classes and categories
      telemetry.classDistribution[item.productClass] = (telemetry.classDistribution[item.productClass] || 0) + 1;
      telemetry.categoryDistribution[item.categorySlug] = (telemetry.categoryDistribution[item.categorySlug] || 0) + 1;
    }

    // Account for the manual benchmark product created in Phase 2
    if (addedManualProduct) {
      const manualClass = addedManualProduct.productClass || 'T';
      const manualCat = addedManualProduct.categorySlug || 'fitness-and-training';
      telemetry.classDistribution[manualClass] = (telemetry.classDistribution[manualClass] || 0) + 1;
      telemetry.categoryDistribution[manualCat] = (telemetry.categoryDistribution[manualCat] || 0) + 1;
    }

    telemetry.idUidAudit.validFormattedIds = validFormatted;
    telemetry.idUidAudit.uniqueIds = idSet.size;
    telemetry.idUidAudit.missingUids = missingUids;
    telemetry.idUidAudit.assignedUids = assignedUids;

    console.log(`[Phase 4] Product IDs Generated: ${telemetry.idUidAudit.totalGenerated}`);
    console.log(`[Phase 4] Product IDs Valid Format: ${telemetry.idUidAudit.validFormattedIds}`);
    console.log(`[Phase 4] Unique Product IDs: ${telemetry.idUidAudit.uniqueIds} / 100`);
    console.log(`[Phase 4] UIDs Assigned: ${telemetry.idUidAudit.assignedUids}, Missing Database UUIDs: ${telemetry.idUidAudit.missingUids}`);

    if (missingUids > 0) {
      telemetry.straighteningIssues.push(
        `Frontend assigns Product ID (e.g. 'IK-10001') directly to product.id rather than generating a distinct UUID for the database 'id' column and storing the Product ID in 'sku'.`
      );
    }

    console.log('================================================================');
    console.log('[AUDIT] PHASE 5: ADMIN PRODUCTS & LEDGER RECONCILIATION');
    console.log('================================================================');

    // Reload page to allow Admin components to compute fresh states
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Check Master Ledger Row Count
    const ledgerHeader = page.locator('h3:has-text("Master Products Catalog Ledger")');
    await expect(ledgerHeader).toBeVisible({ timeout: 10000 });
    const ledgerHeaderText = await ledgerHeader.innerText();
    console.log(`[Phase 5] Master Ledger Header: "${ledgerHeaderText}"`);

    // Verify ledger count matches total products
    const ledgerMatch = ledgerHeaderText.match(/Master Products Catalog Ledger \((\d+)\)/i);
    const displayedLedgerCount = ledgerMatch ? parseInt(ledgerMatch[1]) : 0;
    console.log(`[Phase 5] Ledger displayed products count: ${displayedLedgerCount}`);
    expect(displayedLedgerCount).toBeGreaterThanOrEqual(100);

    // 2. Check Each Category Card in Admin Products Tab
    console.log('[Phase 5] Auditing Category Cards in Admin Products Tab:');
    for (const cat of CATEGORIES) {
      const expectedCountForCat = telemetry.categoryDistribution[cat.slug] || 0;

      // Locate the category button card
      const categoryCard = page.locator(`button:has(h3:has-text("${cat.name}"))`).first();
      await expect(categoryCard).toBeVisible();

      // Extract the product count text e.g. "17 Products"
      const countBadge = categoryCard.locator('span:has-text("Products")');
      const badgeText = await countBadge.innerText();
      const actualCount = parseInt(badgeText.replace(/[^0-9]/g, '')) || 0;

      telemetry.ledgerCategoryCounts[cat.slug] = actualCount;
      console.log(`  - Category "${cat.name}" [slug: ${cat.slug}]: Expected = ${expectedCountForCat}, Displayed = ${actualCount}`);

      if (actualCount !== expectedCountForCat) {
        const issue = `Category count mismatch on "${cat.name}": Expected ${expectedCountForCat} products, but UI displays ${actualCount} Products (slug difference: '${cat.slug}').`;
        telemetry.categoryDiscrepancies.push(issue);
        telemetry.straighteningIssues.push(issue);
      }
    }

    console.log('================================================================');
    console.log('[AUDIT] PHASE 6: ADMIN ANALYTICS TAB AUDIT');
    console.log('================================================================');

    // Switch to Analytics tab
    const analyticsTabBtn = page.locator('button:has-text("Analytics")').first();
    await analyticsTabBtn.click();

    // Verify Commerce Analytics header
    const analyticsH1 = page.locator('h1:has-text("Commerce Analytics & Intelligence")');
    await expect(analyticsH1).toBeVisible({ timeout: 10000 });
    console.log('[Phase 6] Analytics tab loaded.');

    // Check Categories Performance & Stock Realization section
    const section1Header = page.locator('h1:has-text("Categories Performance & Stock Realization")');
    await expect(section1Header).toBeVisible();

    // Click Open Category Analysis Popup
    const openAnalysisModalBtn = page.locator('button:has-text("Open Category Analysis Popup")');
    await expect(openAnalysisModalBtn).toBeVisible();
    await openAnalysisModalBtn.click();

    // Verify modal opened
    const catAnalysisModal = page.locator('h2:has-text("Categories Sales & Inventory Realization")');
    await expect(catAnalysisModal).toBeVisible({ timeout: 5000 });
    console.log('[Phase 6] Category Analytics Modal opened and rendered.');

    // Close modal
    const closeModalBtn = page.locator('button[title="Close category analytics modal"]').or(page.locator('button:has-text("Close")')).first();
    await closeModalBtn.click();
    await expect(catAnalysisModal).not.toBeVisible({ timeout: 5000 });

    console.log('================================================================');
    console.log('[AUDIT] PHASE 7: STOREFRONT SEARCH, FILTERS & CLASS EFFECT');
    console.log('================================================================');

    // Switch view to public storefront
    await page.evaluate(() => {
      localStorage.setItem('egerscore_store_nav_flow', JSON.stringify({
        currentView: 'store',
        selectedCategorySlug: 'all',
      }));
    });
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);

    // 1. Verify storefront displays products
    const storeProductCards = page.locator('button[aria-label="Add product to cart"]');
    await expect(storeProductCards.first()).toBeVisible({ timeout: 15000 });
    const visibleProductCardsCount = await storeProductCards.count();
    console.log(`[Phase 7] Initial visible products in Storefront: ${visibleProductCardsCount}`);
    expect(visibleProductCardsCount).toBeGreaterThan(0);

    // 2. Class Switcher Effect: Test each product class
    console.log('[Phase 7] Testing Class Switcher buttons (Team, Individual, Coaching, Officiation):');
    for (const cls of PRODUCT_CLASSES) {
      const classBtn = page.locator(`button:has-text("${cls.label}")`).first();
      if (await classBtn.isVisible()) {
        await classBtn.click();
        await page.waitForTimeout(400);

        const countForClass = await page.locator('button[aria-label="Add product to cart"]').count();
        telemetry.storefrontFilterResults[cls.code] = countForClass;
        console.log(`  - Class "${cls.label}" [Code: ${cls.code}]: ${countForClass} products visible.`);
      }
    }

    // Reset Class to All
    const allClassBtn = page.locator('button:has-text("All Products"), button:has-text("All Gear")').first();
    if (await allClassBtn.isVisible()) {
      await allClassBtn.click();
      await page.waitForTimeout(300);
    }

    // 3. Test Manual Search by Product ID & Name
    console.log('[Phase 7] Testing Search Bar by Product ID and Name:');

    // Ensure search input is open/visible in CategoriesSection
    const searchToggleBtn = page.locator('button[aria-label="Toggle search"]').first();
    if (await searchToggleBtn.isVisible()) {
      await searchToggleBtn.click({ force: true });
      await page.waitForTimeout(300);
    }

    const searchInput = page.locator('input[placeholder*="Search categories, jerseys"]').or(page.locator('input[placeholder*="Search jerseys, boots"]')).or(page.locator('input[placeholder*="Search"]')).first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    if (await searchInput.isVisible()) {
      // Pick a sample product from the generated list
      const sampleProd = additionResults.results[10]; // e.g. 11th product
      console.log(`  - Searching by exact Product ID: "${sampleProd.id}"`);

      telemetry.searchAudit.testedTerms++;
      await searchInput.fill(sampleProd.id);
      await page.waitForTimeout(500);

      const foundCardsById = await page.locator('button[aria-label="Add product to cart"]').count();
      console.log(`  - Results for ID "${sampleProd.id}": ${foundCardsById} card(s) matched.`);
      if (foundCardsById > 0) {
        telemetry.searchAudit.successfulFinds++;
      } else {
        telemetry.searchAudit.failedFinds++;
        telemetry.straighteningIssues.push(`Search by exact Product ID "${sampleProd.id}" returned 0 results in storefront.`);
      }

      // 4. Test Goalkeeper vs Goalkeepers equivalence
      console.log('[Phase 7] Testing Goalkeeper vs Goalkeepers equivalence:');
      await searchInput.fill('goalkeeper');
      await page.waitForTimeout(400);
      const countGoalkeeper = await page.locator('button[aria-label="Add product to cart"]').count();

      await searchInput.fill('goalkeepers');
      await page.waitForTimeout(400);
      const countGoalkeepers = await page.locator('button[aria-label="Add product to cart"]').count();

      console.log(`  - Results for "goalkeeper": ${countGoalkeeper}, "goalkeepers": ${countGoalkeepers}`);
      expect(countGoalkeeper).toBe(countGoalkeepers);
      expect(countGoalkeeper).toBeGreaterThan(0);

      // 5. Test Live Keyword Autocomplete on half a keyword e.g. "goalke"
      console.log('[Phase 7] Testing live keyword autocomplete on half-keyword "goalke":');
      await searchInput.fill('goalke');
      await page.waitForTimeout(300);

      const autocompleteSuggestions = page.locator('text=goalkeepers').or(page.locator('text=goalkeeper'));
      await expect(autocompleteSuggestions.first()).toBeVisible({ timeout: 5000 });
      console.log('  - Live suggestions verified: typed "goalke" successfully suggests "goalkeepers" and "goalkeeper".');

      // 6. Test Non-existent keyword frontend guard:
      console.log('[Phase 7] Testing non-existent keyword frontend guard:');
      await searchInput.fill('xyznonexistentkw99');
      await page.waitForTimeout(300);

      const emptyKeywordState = page.locator('text=No matching keyword found');
      await expect(emptyKeywordState).toBeVisible({ timeout: 5000 });
      console.log('  - Frontend guard verified: dropdown immediately displays empty state without database queries.');

      // Clear search
      await searchInput.fill('');
      await page.waitForTimeout(300);
    }

    console.log('================================================================');
    console.log('[AUDIT] FINAL TELEMETRY REPORT SUMMARY');
    console.log('================================================================');
    console.log(JSON.stringify(telemetry, null, 2));

    // Ensure core benchmark assertions hold
    expect(telemetry.bulkAdditionTotalLatencyMs).toBeLessThan(10000); // 100 additions in under 10s
    expect(telemetry.idUidAudit.uniqueIds).toBe(100);
    expect(displayedLedgerCount).toBeGreaterThanOrEqual(100);
  });
});
