const BASE_URL = 'http://localhost:3000';

const runTests = async () => {
  console.log('================================================================');
  console.log('COMPREHENSIVE GLOBAL SEARCH VERIFICATION SUITE');
  console.log('================================================================\n');

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

  try {
    // 1. Authenticate Admin
    console.log('--- Step 1: Admin Authentication ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@company.com', password: 'password' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData?.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin logged in successfully and acquired JWT');

    // 2. Search by an existing order ID (e.g., 1)
    console.log('\n--- Step 2: Search by Existing Order ID ("1") ---');
    const idSearchRes = await fetch(`${BASE_URL}/api/search?q=1`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const idSearchData = await idSearchRes.json();
    assert(idSearchRes.status === 200, 'Search by ID returns 200');
    assert(idSearchData.success === true, 'Response indicates success = true');
    assert(idSearchData.data.orders.length > 0, `Matching orders found by ID (count: ${idSearchData.data.orders.length})`);
    assert(idSearchData.data.deliveries.length > 0, `Matching deliveries found by order ID (count: ${idSearchData.data.deliveries.length})`);
    assert(idSearchData.data.returns.length > 0, `Matching returns found by order ID (count: ${idSearchData.data.returns.length})`);
    assert(idSearchData.data.inventory.length > 0, `Matching inventory found by product ID (count: ${idSearchData.data.inventory.length})`);
    assert(idSearchData.data.production.length > 0, `Matching production found by batch ID (count: ${idSearchData.data.production.length})`);
    assert(idSearchData.data.inspections.length > 0, `Matching inspections found by inspection ID (count: ${idSearchData.data.inspections.length})`);

    // 3. Search by partial order number (e.g., "ORD-")
    console.log('\n--- Step 3: Search by Partial Order Number ("ORD") ---');
    const partialOrderRes = await fetch(`${BASE_URL}/api/search?q=ORD`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const partialOrderData = await partialOrderRes.json();
    assert(partialOrderRes.status === 200, 'Search by partial order number returns 200');
    assert(partialOrderData.data.orders.length > 0, `Orders found matching "ORD" (count: ${partialOrderData.data.orders.length})`);
    assert(partialOrderData.data.deliveries.length > 0, `Deliveries found linked to "ORD" orders (count: ${partialOrderData.data.deliveries.length})`);
    assert(partialOrderData.data.returns.length > 0, `Returns found linked to "ORD" orders (count: ${partialOrderData.data.returns.length})`);

    // 4. Search by Product Name (e.g., "GPU" and "Titanium")
    console.log('\n--- Step 4: Search by Product Name ("GPU") ---');
    const productSearchRes = await fetch(`${BASE_URL}/api/search?q=GPU`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const productSearchData = await productSearchRes.json();
    assert(productSearchRes.status === 200, 'Search by product name returns 200');
    assert(productSearchData.data.products.length > 0, `Products matching "GPU" found (count: ${productSearchData.data.products.length})`);
    assert(productSearchData.data.inventory.length > 0, `Inventory stock matching "GPU" found (count: ${productSearchData.data.inventory.length})`);

    // 5. Search by Staff Name ("Admin" or "Senthil")
    console.log('\n--- Step 5: Search by Staff Name ("Admin") ---');
    const staffSearchRes = await fetch(`${BASE_URL}/api/search?q=Admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const staffSearchData = await staffSearchRes.json();
    assert(staffSearchRes.status === 200, 'Search by staff name returns 200');
    assert(staffSearchData.data.staff.length > 0, `Staff matching "Admin" found (count: ${staffSearchData.data.staff.length})`);
    assert(!staffSearchData.data.staff.some(s => s.password_hash), 'Staff records NEVER contain password_hash');

    // 6. Search by tracking number / delivery identifier (e.g. "TRK-")
    console.log('\n--- Step 6: Search by Tracking Number ("TRK") ---');
    const deliverySearchRes = await fetch(`${BASE_URL}/api/search?q=TRK`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const deliverySearchData = await deliverySearchRes.json();
    assert(deliverySearchRes.status === 200, 'Search by tracking number returns 200');
    assert(deliverySearchData.data.deliveries.length > 0, `Deliveries matching "TRK" found (count: ${deliverySearchData.data.deliveries.length})`);

    // 7. Case-insensitivity test ("gpu" vs "GPU")
    console.log('\n--- Step 7: Case-Insensitivity Test ("gpu" vs "GPU") ---');
    const lowerRes = await fetch(`${BASE_URL}/api/search?q=gpu`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const lowerData = await lowerRes.json();
    assert(lowerData.data.products.length === productSearchData.data.products.length,
      `Case-insensitivity holds: "gpu" found ${lowerData.data.products.length} products, same as "GPU"`);

    // 8. Empty input and whitespace input
    console.log('\n--- Step 8: Empty and Whitespace Queries ---');
    const emptyRes = await fetch(`${BASE_URL}/api/search?q=`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const emptyData = await emptyRes.json();
    assert(emptyRes.status === 200, 'Empty query returns 200');
    assert(emptyData.data.products.length === 0 && emptyData.data.orders.length === 0, 'Empty query returns empty arrays for all modules');

    const spaceRes = await fetch(`${BASE_URL}/api/search?q=%20%20%20`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const spaceData = await spaceRes.json();
    assert(spaceRes.status === 200, 'Whitespace query returns 200');
    assert(spaceData.data.products.length === 0 && spaceData.data.orders.length === 0, 'Whitespace query returns empty arrays without error');

    // 9. Term with no matching records
    console.log('\n--- Step 9: Non-Existent Term ("xyzNonExistentTerm999") ---');
    const noMatchRes = await fetch(`${BASE_URL}/api/search?q=xyzNonExistentTerm999`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const noMatchData = await noMatchRes.json();
    assert(noMatchRes.status === 200, 'Non-existent search returns 200');
    const noMatchTotal = Object.values(noMatchData.data).reduce((acc, arr) => acc + arr.length, 0);
    assert(noMatchTotal === 0, 'Non-existent search returns 0 results across all modules');

    // 10. RBAC Permission Filtering (User with restricted permissions)
    console.log('\n--- Step 10: RBAC Restricted User Search ---');
    const driverLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@company.com', password: 'password' })
    });
    const driverLoginData = await driverLoginRes.json();
    if (driverLoginData?.data?.token) {
      const driverToken = driverLoginData.data.token;
      const driverSearchRes = await fetch(`${BASE_URL}/api/search?q=Admin`, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      const driverSearchData = await driverSearchRes.json();
      assert(driverSearchRes.status === 200, 'Restricted driver search returns 200');
      assert(driverSearchData.data.staff.length === 0, 'Driver without staff.view receives 0 staff records');
      console.log('Driver search verified: staff.view restricted correctly.');
    } else {
      console.log('Driver user not seeded; skipped driver-specific login.');
    }

    // 11. Missing and Expired Authentication Token
    console.log('\n--- Step 11: Unauthenticated and Invalid Token Handling ---');
    const unauthRes = await fetch(`${BASE_URL}/api/search?q=GPU`);
    assert(unauthRes.status === 401, 'Request without token rejected with 401 Unauthorized');

    const invalidRes = await fetch(`${BASE_URL}/api/search?q=GPU`, {
      headers: { Authorization: 'Bearer invalid.token.payload' }
    });
    assert(invalidRes.status === 401, 'Request with invalid token rejected with 401 Unauthorized');

    // 12. Verification of Result Object Fields for Navigation
    console.log('\n--- Step 12: Verify Result Object Structure for Frontend Navigation ---');
    const sampleProduct = productSearchData.data.products[0];
    assert(sampleProduct && sampleProduct.route === '/products', 'Product result has route "/products"');
    assert(typeof sampleProduct.title === 'string' && sampleProduct.title.length > 0, 'Product result has title');

    const sampleOrder = partialOrderData.data.orders[0];
    assert(sampleOrder && sampleOrder.route === '/orders', 'Order result has route "/orders"');
    assert(typeof sampleOrder.title === 'string' && sampleOrder.title.length > 0, 'Order result has title');

    console.log('\n================================================================');
    console.log(`GLOBAL SEARCH TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution error:', err);
    process.exit(1);
  }
};

runTests();
