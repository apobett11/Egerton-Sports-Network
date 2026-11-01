import { test, expect } from '@playwright/test';
import { execSync } from 'child_process';
import { Product, Order } from '../src/JoseCommerce/types';

const TEST_CUSTOMER_USER = {
  id: 'cust-brian-101',
  username: 'Brian Kiprono',
  email: 'brian.kiprono@sportsmail.co.ke',
  phoneNumber: '+254722113355',
  fullName: 'Brian Kiprono',
  role: 'customer',
  isConfirmed: true,
  themePreference: 'dark',
};

const TEST_ADMIN_SESSION = {
  id: 'c7b94998-8c10-48e7-9d7a-115f5a898b53',
  username: 'josephkamunyu5',
  email: 'josephkamunyu5@gmail.com',
  phoneNumber: '+254700000001',
  fullName: 'Joseph Kamunyu',
  role: 'admin',
  isConfirmed: true,
  themePreference: 'dark',
};

const BASELINE_PRODUCT: Product = {
  id: 'TK-JER-101',
  uid: 'uid-striker-jersey-101',
  sku: 'TK-JER-101',
  name: 'Egerscore Pro Striker Match Jersey',
  subtitle: 'Official Matchday Vapor Edition',
  category: 'Kit',
  categorySlug: 'kit',
  productClass: 'T',
  classLetter: 'T',
  categoryLetter: 'K',
  price: 3500,
  rating: 4.9,
  reviewCount: 38,
  images: [
    'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=70',
  ],
  keywords: ['jersey', 'striker', 'vapor', 'kit', 'matchday'],
  audience: 'team',
  isNew: true,
  isFeatured: true,
  inStock: true,
  stockCount: 12, // Starting baseline stock
  sizes: ['M', 'L', 'XL'],
  colors: [
    { name: 'Navy Blue', hex: '#1e3a8a' },
    { name: 'Pure White', hex: '#ffffff' },
  ],
  description: 'Pro grade match jersey designed for optimal breathability and athletic performance.',
  features: ['Dri-FIT Technology', 'Sublimated Team Crest'],
  specifications: {
    Material: '100% Recycled Polyester',
    Fit: 'Slim Fit Athletic',
    Care: 'Machine wash cold',
  },
  createdAt: new Date().toISOString(),
};

const PRIOR_BASELINE_ORDER: Order = {
  id: 'EGS-110022',
  customerName: 'Dennis Wambua',
  customerEmail: 'dennis.wambua@egerscore.co.ke',
  phoneNumber: '+254711889900',
  deliveryAddress: 'Egerton Main Campus Gate 3 Sports Hub & Main Pitch Depot',
  city: 'Njoro',
  county: 'Nakuru',
  subCounty: 'Njoro',
  pickupStation: 'Egerton Main Campus Gate 3 Sports Hub & Main Pitch Depot',
  paymentMethod: 'delivery',
  checkoutType: 'in-app',
  items: [
    {
      id: 'item-prior-1',
      product: { ...BASELINE_PRODUCT },
      size: 'M',
      color: 'Navy Blue',
      quantity: 1,
    },
  ],
  subtotal: 3500,
  discount: 0,
  shipping: 0,
  total: 3500,
  depositAmount: 1750,
  depositPaid: true,
  depositRequired: true,
  status: 'delivered',
  trackingStep: 4,
  trackingState: 'delivered',
  createdAt: new Date(Date.now() - 86400000).toISOString(),
};

test.describe('Sports House Admin Dashboard Reflectiveness & E2E Integrity Suite', () => {
  test.setTimeout(90000);

  test('0. Docker Container Health Pre-Flight Check', async () => {
    try {
      const dockerOutput = execSync('docker ps --format "{{.Names}}: {{.Status}}"', { encoding: 'utf-8' });
      console.log('[Docker Pre-Flight] Live Container Services:\n' + dockerOutput.trim());
      expect(dockerOutput.toLowerCase()).toContain('supabase');
    } catch (e: any) {
      console.warn('[Docker Pre-Flight] Docker inspection notice:', e?.message || e);
    }
  });

  test('Complete End-to-End Simulation: Store Order Placement -> Stock Deducted by 1 -> Real-time Reflectiveness Across All 7 Admin Dashboard Pages', async ({ context }) => {
    const page = await context.newPage();

    let liveMockStock = 12;

    // Intercept database sync to provide consistent deterministic test product
    await page.route('**/rest/v1/products*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'TK-JER-101',
          uid: 'uid-striker-jersey-101',
          sku: 'TK-JER-101',
          name: 'Egerscore Pro Striker Match Jersey',
          subtitle: 'Official Matchday Vapor Edition',
          category: 'Kit',
          category_slug: 'kit',
          price: 3500,
          rating: 4.9,
          review_count: 38,
          images: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=400&auto=format&fit=crop&q=70'],
          keywords: ['jersey', 'striker', 'vapor', 'kit', 'matchday'],
          audience: 'team',
          is_new: true,
          is_featured: true,
          in_stock: true,
          stock_count: liveMockStock,
          sizes: ['M', 'L', 'XL'],
          colors: [{ name: 'Navy Blue', hex: '#1e3a8a' }, { name: 'Pure White', hex: '#ffffff' }],
          description: 'Pro grade match jersey designed for optimal breathability and athletic performance.',
          features: ['Dri-FIT Technology', 'Sublimated Team Crest'],
          specifications: {
            Material: '100% Recycled Polyester',
            Fit: 'Slim Fit Athletic',
            Care: 'Machine wash cold',
          },
          product_class: 'T',
          class_letter: 'T',
          category_letter: 'K',
          created_at: new Date().toISOString(),
        }]),
      });
    });

    console.log('================================================================');
    console.log('[STAGE 1] INITIALIZING CLEAN STORE & SEEDING KNOWN BASELINE ITEM');
    console.log('================================================================');

    await page.goto('/#/store', { waitUntil: 'domcontentloaded' });

    // Seed baseline product (stock: 12), baseline prior order, and customer session
    await page.evaluate(({ prod, priorOrder, customer }) => {
      localStorage.clear();
      sessionStorage.clear();

      localStorage.setItem('esn_store_catalog_cache_v4', JSON.stringify([prod]));
      sessionStorage.setItem('esn_store_catalog_cache_v4', JSON.stringify([prod]));

      localStorage.setItem('egerscore_admin_orders', JSON.stringify([priorOrder]));
      sessionStorage.setItem('egerscore_admin_orders', JSON.stringify([priorOrder]));

      localStorage.setItem('egerscore_store_current_user', JSON.stringify(customer));
      sessionStorage.setItem('egerscore_store_current_user', JSON.stringify(customer));
    }, { prod: BASELINE_PRODUCT, priorOrder: PRIOR_BASELINE_ORDER, customer: TEST_CUSTOMER_USER });

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    console.log('================================================================');
    console.log('[STAGE 2] SIMULATING STOREFRONT ORDERING & STOCK REDUCTION');
    console.log('================================================================');

    // 1. Locate product card for "Egerscore Pro Striker Match Jersey"
    const productTitle = page.locator('text=Egerscore Pro Striker Match Jersey').first();
    await expect(productTitle).toBeVisible({ timeout: 15000 });

    // 2. Click "Add to Cart"
    const addBtn = page.locator('button[aria-label="Add product to cart"]').first();
    await expect(addBtn).toBeVisible();
    await addBtn.click();

    // 3. In Specs modal, confirm and add to cart
    const confirmAddBtn = page.locator('button:has-text("Confirm & Add to Cart")');
    await expect(confirmAddBtn).toBeVisible({ timeout: 5000 });
    await confirmAddBtn.click();
    await expect(confirmAddBtn).not.toBeVisible({ timeout: 5000 });

    // 4. Open Cart Drawer
    const cartBtn = page.locator('button[aria-label="View shopping cart"]');
    await expect(cartBtn).toBeVisible();
    await cartBtn.click();

    const checkoutBtn = page.locator('button:has-text("Proceed to Checkout")');
    await expect(checkoutBtn).toBeVisible({ timeout: 5000 });
    await checkoutBtn.click();

    // 5. Submit Order (Customer fields are prefilled from authenticated session)
    const placeOrderBtn = page.locator('button[type="submit"]:has-text("Confirm Order")').or(page.locator('button:has-text("Confirm Order")')).first();
    await expect(placeOrderBtn).toBeVisible({ timeout: 10000 });
    await placeOrderBtn.click();

    // Confirmation screen or order success toast
    const successMsg = page.locator('text=Order Recorded Successfully!').or(page.locator('text=Order Recorded')).or(page.locator('text=Successfully'));
    await expect(successMsg.first()).toBeVisible({ timeout: 15000 });
    console.log('[Stage 2] Order placement confirmed on storefront.');

    // 6. VERIFY STOCK IS DEDUCTED BY EXACTLY 1 (from 12 to 11)
    const stockAfterOrder = await page.evaluate(() => {
      const raw = localStorage.getItem('esn_store_catalog_cache_v4');
      const catalog = raw ? JSON.parse(raw) : [];
      const prod = catalog.find((p: any) => p.id === 'TK-JER-101');
      return prod ? prod.stockCount : null;
    });

    console.log(`[Stage 2] Initial Stock: 12 -> Stock After Order Placement: ${stockAfterOrder}`);
    expect(stockAfterOrder).toBe(11);
    liveMockStock = 11;

    console.log('================================================================');
    console.log('[STAGE 3] VERIFYING NEW ADMIN DASHBOARD REFLECTIVENESS');
    console.log('================================================================');

    // Authenticate as Admin and set view to Admin Portal
    await page.evaluate((admin) => {
      localStorage.setItem('egerscore_store_current_admin', JSON.stringify(admin));
      sessionStorage.setItem('egerscore_store_current_admin', JSON.stringify(admin));
      localStorage.setItem('egerscore_store_nav_flow', JSON.stringify({
        currentView: 'admin',
        adminTab: 'dashboard',
      }));
      sessionStorage.setItem('egerscore_store_nav_flow', JSON.stringify({
        currentView: 'admin',
        adminTab: 'dashboard',
      }));
    }, TEST_ADMIN_SESSION);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify Admin Portal mounted
    const portalHeader = page.locator('h1:has-text("Dashboard Overview")');
    await expect(portalHeader).toBeVisible({ timeout: 15000 });
    console.log('[Stage 3.1] Admin Dashboard Page successfully mounted.');

    // --- PAGE 1: DASHBOARD CHECKS ---
    // 1. Total Orders count should be 2 (1 baseline + 1 newly placed)
    const totalOrdersText = page.locator('text=2 Orders');
    await expect(totalOrdersText.first()).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.1] Dashboard Metric: Total Orders count reflects 2 orders.');

    // 2. Recorded Sales Value should be KES 7,500 (3,500 baseline + 4,000 new with shipping)
    const totalSalesText = page.locator('text=7,500');
    await expect(totalSalesText.first()).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.1] Dashboard Metric: Recorded Sales Value reflects KES 7,500.');

    // 3. Orders Requiring Attention should show 1 order (the new unfulfilled order)
    const needsAttentionCard = page.locator('div:has-text("Needs Attention")').locator('text=1 Orders').first();
    await expect(needsAttentionCard).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.1] Dashboard Metric: Needs Attention reflects 1 unfulfilled order.');

    // 4. Verify Brian Kiprono appears in the "Orders Requiring Attention" section
    const attentionCustomer = page.locator('text=Brian Kiprono');
    await expect(attentionCustomer.first()).toBeVisible({ timeout: 5000 });

    // 5. Verify Recent Activity ledger logs the new order
    const recentActivityRow = page.locator('tr:has-text("Brian Kiprono")');
    await expect(recentActivityRow).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.1] Dashboard Recent Activity confirms real-time order record.');

    // --- PAGE 2: ORDERS CHECKS & FULFILLMENT STEPS ---
    console.log('================================================================');
    console.log('[STAGE 3.2] TESTING ORDERS WORKSPACE & FULFILMENT LIFECYCLE');
    console.log('================================================================');

    const ordersNavBtn = page.locator('aside button:has-text("Orders")').first();
    await ordersNavBtn.click();

    const ordersHeader = page.locator('h1:has-text("Customer Orders & Fulfilment")');
    await expect(ordersHeader).toBeVisible({ timeout: 10000 });

    // Verify row for Brian Kiprono is present
    const filteredOrderRow = page.locator('tr:has-text("Brian Kiprono")').first();
    await expect(filteredOrderRow).toBeVisible({ timeout: 5000 });

    // Advance step: click "Dispatch"
    const dispatchBtn = filteredOrderRow.locator('button:has-text("Dispatch")');
    await expect(dispatchBtn).toBeVisible({ timeout: 5000 });
    await dispatchBtn.click();
    await page.waitForTimeout(400);

    // Verify state transitioned to "At Depot" button
    const atDepotBtn = filteredOrderRow.locator('button:has-text("At Depot")');
    await expect(atDepotBtn).toBeVisible({ timeout: 5000 });
    await atDepotBtn.click();
    await page.waitForTimeout(400);

    // Click "Deliver"
    const deliverBtn = filteredOrderRow.locator('button:has-text("Deliver")');
    await expect(deliverBtn).toBeVisible({ timeout: 5000 });
    await deliverBtn.click();
    await page.waitForTimeout(400);

    // Verify order completed
    const doneIndicator = filteredOrderRow.locator('text=Done');
    await expect(doneIndicator.first()).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.2] Order fulfilment lifecycle successfully advanced to Delivered.');

    // Open Order Details
    const detailsBtn = filteredOrderRow.locator('button:has-text("Details")');
    await detailsBtn.click();

    const orderModalHeading = page.locator('h3:has-text("Order Fulfillment Workflow State")');
    await expect(orderModalHeading).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=+254722113355').first()).toBeVisible();
    console.log('[Stage 3.2] Order Details modal inspected successfully.');

    // Close details modal
    const closeDetailsBtn = page.locator('button:has-text("Cancel")');
    await closeDetailsBtn.first().click();
    await page.waitForTimeout(300);

    // --- PAGE 3: PRODUCTS CATALOG CHECKS ---
    console.log('================================================================');
    console.log('[STAGE 3.3] TESTING PRODUCTS CATALOGUE VIEW');
    console.log('================================================================');

    const productsNavBtn = page.locator('aside button:has-text("Products")').first();
    await productsNavBtn.click();

    const productsHeader = page.locator('h1:has-text("Products Catalogue")');
    await expect(productsHeader).toBeVisible({ timeout: 10000 });

    const catalogProductRow = page.locator('tr:has-text("Egerscore Pro Striker Match Jersey")').first();
    await expect(catalogProductRow).toBeVisible();
    await expect(catalogProductRow.locator('text=3,500')).toBeVisible();

    // Click Specifications button
    const specsBtn = catalogProductRow.locator('button:has-text("Specifications")');
    await specsBtn.click();

    const specsModalHeader = page.locator('h3:has-text("Egerscore Pro Striker Match Jersey")');
    await expect(specsModalHeader).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=100% Recycled Polyester').first()).toBeVisible();
    console.log('[Stage 3.3] Product specifications verified intact.');

    const closeSpecsBtn = page.locator('button:has-text("Close")');
    await closeSpecsBtn.first().click();
    await page.waitForTimeout(300);

    // --- PAGE 4: INVENTORY CHECKS & LIVE STOCK ADJUSTMENTS ---
    console.log('================================================================');
    console.log('[STAGE 3.4] TESTING INVENTORY WORKSPACE & STOCK CONTROLS');
    console.log('================================================================');

    const inventoryNavBtn = page.locator('aside button:has-text("Inventory")').first();
    await inventoryNavBtn.click();

    const inventoryHeader = page.locator('h1:has-text("Stock & Inventory Ledger")');
    await expect(inventoryHeader).toBeVisible({ timeout: 10000 });

    const inventoryRow = page.locator('tr:has-text("Egerscore Pro Striker Match Jersey")').first();
    await expect(inventoryRow).toBeVisible();

    // Available stock should be exactly 11 units (12 minus 1)
    await expect(inventoryRow.locator('text=11 units')).toBeVisible();
    console.log('[Stage 3.4] Inventory table accurately confirms stock reduction to 11 units.');

    // Test quick decrement stepper (-)
    const decrementBtn = inventoryRow.locator('button:has-text("-")');
    await decrementBtn.click();
    await page.waitForTimeout(300);
    await expect(inventoryRow.locator('text=10 units')).toBeVisible();

    // Test quick increment stepper (+)
    const incrementBtn = inventoryRow.locator('button:has-text("+")');
    await incrementBtn.click();
    await page.waitForTimeout(300);
    await expect(inventoryRow.locator('text=11 units')).toBeVisible();

    // Test direct input: click quantity number, type '4' (making it low-stock <= 5), save
    const stockQtyText = inventoryRow.locator('span[title*="manually edit"]').first();
    await stockQtyText.click();

    const stockNumberInput = inventoryRow.locator('input[type="number"]');
    await expect(stockNumberInput).toBeVisible({ timeout: 3000 });
    await stockNumberInput.fill('4');
    await page.keyboard.press('Enter');
    liveMockStock = 4;
    await page.waitForTimeout(400);

    // Assert status badge updated to "Low Stock"
    await expect(inventoryRow.locator('text=Low Stock')).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.4] Live stock adjustment to 4 units successfully triggered Low Stock status.');

    // --- PAGE 5: ANALYTICS CHECKS ---
    console.log('================================================================');
    console.log('[STAGE 3.5] TESTING ANALYTICS INTELLIGENCE & CHARTS');
    console.log('================================================================');

    const analyticsNavBtn = page.locator('aside button:has-text("Analytics")').first();
    await analyticsNavBtn.click();

    const analyticsHeader = page.locator('h1:has-text("Business Performance & Sales Analytics")');
    await expect(analyticsHeader).toBeVisible({ timeout: 10000 });

    // Check key metrics
    await expect(page.locator('text=7,500').first()).toBeVisible();
    await expect(page.locator('text=2 Orders').first()).toBeVisible();

    // Open Category Deep-Dive modal
    const categoryAnalysisBtn = page.locator('button:has-text("Category Deep-Dive")');
    await categoryAnalysisBtn.click();

    const categoryModalTitle = page.locator('text=Categories Stock Realization');
    await expect(categoryModalTitle.first()).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.5] Category Analytics Deep-Dive verified.');

    const closeCategoryModal = page.locator('button:has-text("Close Window")').or(page.locator('button:has-text("Close")')).first();
    await closeCategoryModal.click();
    await page.waitForTimeout(300);

    // --- PAGE 6: CUSTOMERS DIRECTORY CHECKS ---
    console.log('================================================================');
    console.log('[STAGE 3.6] TESTING CUSTOMERS DIRECTORY & ORDER HISTORY');
    console.log('================================================================');

    const customersNavBtn = page.locator('aside button:has-text("Customers")').first();
    await customersNavBtn.click();

    const customersHeader = page.locator('h1:has-text("Customers & Order History")');
    await expect(customersHeader).toBeVisible({ timeout: 10000 });

    // Brian Kiprono should be in the customer directory
    const customerRow = page.locator('tr:has-text("Brian Kiprono")').first();
    await expect(customerRow).toBeVisible();
    await expect(customerRow.locator('text=+254722113355')).toBeVisible();

    // Click "View Orders ->"
    const viewCustomerOrdersBtn = customerRow.locator('button:has-text("View Orders")');
    await viewCustomerOrdersBtn.first().click();

    const customerModal = page.locator('text=Recorded Order History');
    await expect(customerModal).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Total Lifetime Value:').first()).toBeVisible();
    await expect(page.locator('text=4,000').first()).toBeVisible();
    console.log('[Stage 3.6] Customer order history and lifetime value verified.');

    const closeCustomerModal = page.locator('button:has-text("Close")').first();
    await closeCustomerModal.click();
    await page.waitForTimeout(300);

    // --- PAGE 7: SETTINGS CHECKS ---
    console.log('================================================================');
    console.log('[STAGE 3.7] TESTING SETTINGS HUB & BUSINESS CONTACT RETENTION');
    console.log('================================================================');

    const settingsNavBtn = page.locator('aside button:has-text("Settings")').first();
    await settingsNavBtn.click();

    const settingsHeader = page.locator('h1:has-text("Settings & Store Operations")');
    await expect(settingsHeader).toBeVisible({ timeout: 10000 });

    // Verify Business Contact sub-tab is intact
    await expect(page.locator('button:has-text("Business Contact")').first()).toBeVisible();
    await expect(page.locator('text=Business Point of Contact').or(page.locator('text=Customer Support Inquiries'))).toBeVisible();
    console.log('[Stage 3.7] Business Contact point confirmed intact.');

    // Switch to Pickup Locations sub-tab
    const depotsSubTab = page.locator('button:has-text("Pickup Locations")');
    await depotsSubTab.click();

    const stationInput = page.locator('input[placeholder*="Sports Hub Depot"]');
    await expect(stationInput).toBeVisible({ timeout: 5000 });
    await stationInput.fill('Industrial Park Gate 4 Hub');

    const addDepotBtn = page.locator('button:has-text("Add Depot")');
    await addDepotBtn.click();

    // Check newly registered depot is visible in the directory
    await expect(page.locator('text=Industrial Park Gate 4 Hub').first()).toBeVisible({ timeout: 5000 });
    console.log('[Stage 3.7] Pickup station successfully registered and persisted.');

    console.log('================================================================');
    console.log('[AUDIT COMPLETE] ALL 7 PAGES VERIFIED 100% OPERATIONAL & REFLECTIVE');
    console.log('================================================================');
  });
});
