const http = require('http');
const app = require('../server');
const { Role, Staff, Permission, Screen, RolePermission } = require('../models');

async function runE2ETests() {
  console.log('====================================================');
  console.log('E2E TEST: ROLE SCREEN-SELECTION WORKFLOW (STEPS 1-12)');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  const assert = (condition, title, details = '') => {
    if (condition) {
      console.log(`✅ [PASS] ${title}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${title} - Details: ${details}`);
      failed++;
    }
  };

  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  try {
    // ---------------------------------------------------------
    // STEP 1: Log in as an authorized admin
    // ---------------------------------------------------------
    console.log('--- Step 1: Log in as authorized Admin ---');
    let adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@company.com', password: 'password' })
    });
    if (adminLoginRes.status !== 200) {
      // Try alternative password if seeded with realistic data
      adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@company.com', password: 'password123' })
      });
    }
    const adminData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200 && adminData.data?.token, 'Admin logged in successfully');
    const adminToken = adminData.data.token;
    assert(adminData.data.user.role.slug === 'admin', 'Logged-in user has "admin" role');

    // ---------------------------------------------------------
    // STEP 2: Open Role & Permission (fetch all roles & screens)
    // ---------------------------------------------------------
    console.log('\n--- Step 2: Open Role & Permission (GET /api/roles) ---');
    const rolesRes = await fetch(`${baseUrl}/api/roles`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const rolesData = await rolesRes.json();
    assert(rolesRes.status === 200 && Array.isArray(rolesData.data), 'Roles retrieved successfully');
    const roles = rolesData.data;
    assert(roles.length >= 4, `At least 4 roles present in system (found ${roles.length})`);

    // ---------------------------------------------------------
    // STEP 3: Open the screen-selection page (GET /api/screens)
    // ---------------------------------------------------------
    console.log('\n--- Step 3: Open Screen Selection Page (GET /api/screens) ---');
    const screensRes = await fetch(`${baseUrl}/api/screens`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const screensData = await screensRes.json();
    assert(screensRes.status === 200 && Array.isArray(screensData.data), 'Screens retrieved successfully');
    const allScreens = screensData.data;

    // ---------------------------------------------------------
    // STEP 4: Select an existing role (e.g. Sales role)
    // ---------------------------------------------------------
    console.log('\n--- Step 4: Select an existing role (Sales role) ---');
    const salesRole = roles.find((r) => r.slug === 'sales');
    assert(!!salesRole, 'Sales role exists in the system');

    // ---------------------------------------------------------
    // STEP 5: Verify that actual available screens appear
    // ---------------------------------------------------------
    console.log('\n--- Step 5: Verify actual available screens from backend ---');
    const screenSlugs = allScreens.map((s) => s.slug);
    assert(screenSlugs.includes('products'), 'Available screens include "products"');
    assert(screenSlugs.includes('inventory'), 'Available screens include "inventory"');
    assert(screenSlugs.includes('orders'), 'Available screens include "orders"');
    assert(screenSlugs.includes('cart'), 'Available screens include "cart"');
    assert(screenSlugs.includes('deliveries'), 'Available screens include "deliveries"');
    assert(screenSlugs.includes('manufacturing'), 'Available screens include "manufacturing"');
    assert(screenSlugs.length === 12, `Total of 12 distinct screens returned by backend (found ${screenSlugs.length})`);

    // ---------------------------------------------------------
    // STEP 6: Verify that previously assigned screens are checked
    // ---------------------------------------------------------
    console.log('\n--- Step 6: Verify previously assigned screens for Sales role ---');
    const initialPermsRes = await fetch(`${baseUrl}/api/roles/${salesRole.id}/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const initialPermsData = await initialPermsRes.json();
    const initialPerms = initialPermsData.data || [];
    const initialScreenIds = new Set(initialPerms.map((p) => Number(p.screen_id || p.screen?.id)));
    const initialScreenSlugs = new Set(
      allScreens.filter((s) => initialScreenIds.has(Number(s.id))).map((s) => s.slug)
    );
    console.log('Sales initially assigned screen slugs:', Array.from(initialScreenSlugs));
    assert(initialScreenSlugs.has('dashboard'), 'Sales role initially has "dashboard" checked');
    assert(initialScreenSlugs.has('orders'), 'Sales role initially has "orders" checked');

    // ---------------------------------------------------------
    // STEP 7: Select and deselect screens
    // Modify Sales role: Ensure "cart" and "inspection" are selected, but "returns" is not
    // ---------------------------------------------------------
    console.log('\n--- Step 7: Select & Deselect screens for Sales role ---');
    const cartScreen = allScreens.find((s) => s.slug === 'cart');
    const inspectionScreen = allScreens.find((s) => s.slug === 'inspection');
    const newSelectedScreens = allScreens.filter(
      (s) => s.slug === 'dashboard' || s.slug === 'orders' || s.slug === 'products' || s.slug === 'cart' || s.slug === 'inspection'
    );
    const newSelectedScreenIds = newSelectedScreens.map((s) => Number(s.id));
    const newSelectedPermIds = newSelectedScreens.flatMap((s) =>
      (s.permissions || []).map((p) => Number(p.id))
    );

    // ---------------------------------------------------------
    // STEP 8: Save the changes
    // ---------------------------------------------------------
    console.log('\n--- Step 8: Save changes using PUT /api/roles/:id/permissions ---');
    const saveRes = await fetch(`${baseUrl}/api/roles/${salesRole.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        permission_ids: newSelectedPermIds,
        screen_ids: newSelectedScreenIds
      })
    });
    const saveData = await saveRes.json();
    assert(saveRes.status === 200 && saveData.success === true, 'Screen assignments saved successfully (200 OK)');

    // ---------------------------------------------------------
    // STEP 9: Reload / re-fetch permissions and verify persistence
    // ---------------------------------------------------------
    console.log('\n--- Step 9: Re-fetch role permissions and verify persistence ---');
    const verifyPermsRes = await fetch(`${baseUrl}/api/roles/${salesRole.id}/permissions`, {
      headers: { 'Authorization': `Bearer ${adminToken}` }
    });
    const verifyPermsData = await verifyPermsRes.json();
    const verifiedPerms = verifyPermsData.data || [];
    const verifiedScreenIds = new Set(verifiedPerms.map((p) => Number(p.screen_id || p.screen?.id)));
    const verifiedScreenSlugs = new Set(
      allScreens.filter((s) => verifiedScreenIds.has(Number(s.id))).map((s) => s.slug)
    );

    assert(verifiedScreenSlugs.has('cart'), 'Persisted selections include "cart"');
    assert(verifiedScreenSlugs.has('inspection'), 'Persisted selections include "inspection"');
    assert(verifiedScreenSlugs.has('orders'), 'Persisted selections include "orders"');
    assert(verifiedScreenSlugs.has('products'), 'Persisted selections include "products"');
    assert(!verifiedScreenSlugs.has('deliveries'), 'Persisted selections do NOT include "deliveries"');
    assert(!verifiedScreenSlugs.has('manufacturing'), 'Persisted selections do NOT include "manufacturing"');

    // ---------------------------------------------------------
    // STEP 10: Verify assigned role sees only permitted screens in RBAC
    // ---------------------------------------------------------
    console.log('\n--- Step 10: Verify Sales user sees only permitted screens in RBAC ---');
    let salesLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'priya.sales@titancore.in', password: 'password123' })
    });
    const salesLoginData = await salesLoginRes.json();
    assert(salesLoginRes.status === 200, 'Sales user logged in successfully');
    const salesUserScreens = salesLoginData.data.screens || [];
    const salesUserScreenSlugs = salesUserScreens.map((s) => s.slug);
    console.log('Sales user received screens on login:', salesUserScreenSlugs);

    assert(salesUserScreenSlugs.includes('cart'), 'Sales user has "cart" screen on login');
    assert(salesUserScreenSlugs.includes('inspection'), 'Sales user has "inspection" screen on login');
    assert(salesUserScreenSlugs.includes('orders'), 'Sales user has "orders" screen on login');
    assert(!salesUserScreenSlugs.includes('deliveries'), 'Sales user does NOT have "deliveries" screen');
    assert(!salesUserScreenSlugs.includes('manufacturing'), 'Sales user does NOT have "manufacturing" screen');

    // Verify API level RBAC enforcement
    const salesToken = salesLoginData.data.token;
    const cartAccessRes = await fetch(`${baseUrl}/api/cart`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    assert(cartAccessRes.status === 200, 'Sales user CAN access GET /api/cart (200 OK)');

    const deliveriesAccessRes = await fetch(`${baseUrl}/api/deliveries`, {
      headers: { 'Authorization': `Bearer ${salesToken}` }
    });
    assert(deliveriesAccessRes.status === 403, 'Sales user is BLOCKED from GET /api/deliveries (403 Forbidden)');

    // ---------------------------------------------------------
    // STEP 11: Verify that an unauthorized user cannot modify role permissions
    // ---------------------------------------------------------
    console.log('\n--- Step 11: Verify non-admin CANNOT modify role permissions ---');
    const unauthorizedPutRes = await fetch(`${baseUrl}/api/roles/${salesRole.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${salesToken}` // Sales user token (non-admin)
      },
      body: JSON.stringify({ permission_ids: [1, 2, 3] })
    });
    const unauthorizedPutData = await unauthorizedPutRes.json();
    assert(unauthorizedPutRes.status === 403, 'Non-admin rejected with 403 Forbidden on PUT /api/roles/:id/permissions');
    assert(unauthorizedPutData.success === false, 'Error message properly returned for unauthorized attempt');

    // ---------------------------------------------------------
    // STEP 12: Verify that existing login & staff-role assignments work
    // ---------------------------------------------------------
    console.log('\n--- Step 12: Verify staff-role assignments still work separately ---');
    const storeManagerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'ramesh.store@titancore.in', password: 'password123' })
    });
    assert(storeManagerLoginRes.status === 200, 'Store Manager login succeeds');

    const deliveryLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'murugan.logistics@titancore.in', password: 'password123' })
    });
    assert(deliveryLoginRes.status === 200, 'Delivery staff login succeeds');

    // Restore Sales role permissions back to clean original state
    console.log('\n--- Restoring Sales role permissions to original seed state ---');
    const restorePermIds = Array.from(initialPerms.map((p) => Number(p.id)));
    await fetch(`${baseUrl}/api/roles/${salesRole.id}/permissions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({ permission_ids: restorePermIds })
    });
    console.log('Restoration complete.');

    console.log('\n====================================================');
    console.log(`WORKFLOW TEST RESULT: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
}

runE2ETests();
