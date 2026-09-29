const BASE_URL = 'http://localhost:3000';

const runInventoryTests = async () => {
  console.log('====================================================');
  console.log('STARTING INVENTORY MODULE (PHASE 3) TESTS');
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

  try {
    // 1. Authenticate as Admin
    console.log('\n--- 1. Authenticating as Admin ---');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'password'
      })
    });
    const loginData = await loginRes.json();
    const token = loginData.data.token;
    assert(token && token.length > 20, 'Admin token acquired');

    // 2. Create a test product to verify auto-inventory creation
    console.log('\n--- 2. Testing Auto-Inventory Record Creation on New Product ---');
    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'DDR5 32GB 6000MHz RAM',
        type: 'RAM',
        specifications: { capacity: '32GB', speed: '6000MHz' },
        price: 120.00,
        available_quantity: 40,
        description: 'Next-gen high speed memory'
      })
    });
    const prodData = await prodRes.json();
    assert(prodRes.status === 201, 'Product created with 201');
    const productId = prodData.data.id;

    // 3. View All Inventory (GET /api/inventory)
    console.log('\n--- 3. Testing Get All Inventory (GET /api/inventory) ---');
    const invListRes = await fetch(`${BASE_URL}/api/inventory`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const invListData = await invListRes.json();
    assert(invListRes.status === 200, 'Get all inventory status is 200 OK');
    assert(Array.isArray(invListData.data.inventory), 'Inventory array returned');
    // Fetch inventory specifically for this product
    const invByProdRes = await fetch(`${BASE_URL}/api/inventory?product_id=${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const invByProdData = await invByProdRes.json();
    const invItem = invByProdData.data.inventory.find(i => Number(i.product_id) === Number(productId));
    assert(invItem !== undefined, 'Newly created product has corresponding inventory record');
    assert(invItem?.total_quantity === 40, 'Total quantity is 40');
    assert(invItem?.available_quantity === 40, 'Available quantity is 40');
    assert(invItem?.stock_status === 'In Stock', 'Stock status is "In Stock"');

    const inventoryId = invItem.id;

    // 4. View Single Inventory Record (GET /api/inventory/:id)
    console.log('\n--- 4. Testing Get Single Inventory Record (GET /api/inventory/:id) ---');
    const singleRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const singleData = await singleRes.json();
    assert(singleRes.status === 200, 'Get single inventory status is 200 OK');
    assert(singleData.data.id === inventoryId, 'Inventory ID matches');
    assert(singleData.data.product_name === 'DDR5 32GB 6000MHz RAM', 'Product name matches');

    // 5. Update Stock Quantities (PUT /api/inventory/:id)
    console.log('\n--- 5. Testing Update Stock Quantities (PUT /api/inventory/:id) ---');
    const updateRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quantity: 50,
        reserved_quantity: 10,
        location: 'Warehouse Section B'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update inventory status is 200 OK');
    assert(updateData.data.total_quantity === 50, 'Total quantity updated to 50');
    assert(updateData.data.reserved_quantity === 10, 'Reserved quantity updated to 10');
    assert(updateData.data.available_quantity === 40, 'Available quantity is 40 (50 - 10)');
    assert(updateData.data.location === 'Warehouse Section B', 'Location updated');

    // 6. Validation: Reserved quantity cannot exceed total quantity
    console.log('\n--- 6. Testing Reserved > Total Validation ---');
    const invalidReserveRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quantity: 10,
        reserved_quantity: 25
      })
    });
    const invalidReserveData = await invalidReserveRes.json();
    assert(invalidReserveRes.status === 400 && invalidReserveData.success === false, 'Reserved > total rejected with 400 Bad Request');

    // 7. Increase Stock (POST /api/inventory/:id/increase)
    console.log('\n--- 7. Testing Increase Stock (POST /api/inventory/:id/increase) ---');
    const increaseRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}/increase`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 15 })
    });
    const increaseData = await increaseRes.json();
    assert(increaseRes.status === 200, 'Increase stock status is 200 OK');
    assert(increaseData.data.total_quantity === 65, 'Total quantity increased to 65 (50 + 15)');
    assert(increaseData.data.available_quantity === 55, 'Available quantity is 55 (65 - 10)');

    // 8. Decrease Stock (POST /api/inventory/:id/decrease)
    console.log('\n--- 8. Testing Decrease Stock (POST /api/inventory/:id/decrease) ---');
    const decreaseRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}/decrease`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 20 })
    });
    const decreaseData = await decreaseRes.json();
    assert(decreaseRes.status === 200, 'Decrease stock status is 200 OK');
    assert(decreaseData.data.total_quantity === 45, 'Total quantity decreased to 45 (65 - 20)');
    assert(decreaseData.data.available_quantity === 35, 'Available quantity is 35 (45 - 10)');

    // 9. Validation: Cannot decrease stock below reserved quantity
    console.log('\n--- 9. Testing Decrease Below Reserved Quantity Validation ---');
    const excessDecreaseRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}/decrease`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ amount: 40 })
    });
    const excessDecreaseData = await excessDecreaseRes.json();
    assert(excessDecreaseRes.status === 400 && excessDecreaseData.success === false, 'Decreasing below reserved rejected with 400 Bad Request');

    // 10. Stock Status Resolutions (Low Stock & Out of Stock)
    console.log('\n--- 10. Testing Stock Status Transitions ---');
    const lowStockRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: 5, reserved_quantity: 0 })
    });
    const lowStockData = await lowStockRes.json();
    assert(lowStockData.data.stock_status === 'Low Stock', 'Stock <= 10 marked as "Low Stock"');

    const outOfStockRes = await fetch(`${BASE_URL}/api/inventory/${inventoryId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ quantity: 0, reserved_quantity: 0 })
    });
    const outOfStockData = await outOfStockRes.json();
    assert(outOfStockData.data.stock_status === 'Out of Stock', 'Stock = 0 marked as "Out of Stock"');

    // 11. Auth Protection without Token
    console.log('\n--- 11. Testing Auth Protection without Token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/inventory`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated inventory request rejected with 401');

    console.log('\n====================================================');
    console.log(`INVENTORY TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runInventoryTests();
