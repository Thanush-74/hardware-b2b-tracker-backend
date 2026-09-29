const BASE_URL = 'http://localhost:3000';

const runProductionTests = async () => {
  console.log('====================================================');
  console.log('STARTING PRODUCTION MODULE (PHASE 4) TESTS');
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

    // 2. Fetch or create a test product
    const prodsRes = await fetch(`${BASE_URL}/api/products?is_active=true`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const prodsData = await prodsRes.json();
    const product = prodsData.data.products[0];
    assert(product !== undefined, 'Found product for production run');

    // 3. Create Production Record (POST /api/production)
    console.log('\n--- 2. Testing Create Production Run (POST /api/production) ---');
    const createRes = await fetch(`${BASE_URL}/api/production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: product.id,
        weekly_capacity: 500,
        quantity_planned: 300,
        quantity_producing: 200,
        quantity_completed: 100,
        start_date: '2026-10-01',
        expected_completion_date: '2026-10-15',
        status: 'In Production',
        notes: 'Initial production batch for enterprise order'
      })
    });
    const createData = await createRes.json();
    assert(createRes.status === 201, 'Create production status is 201');
    assert(createData.success === true, 'Response success is true');
    assert(createData.data.product_id === product.id, 'Product ID matches');
    assert(createData.data.weekly_capacity === 500, 'Weekly capacity is 500');
    assert(createData.data.quantity_planned === 300, 'Planned quantity is 300');
    assert(createData.data.quantity_producing === 200, 'Currently producing quantity is 200');
    assert(createData.data.quantity_completed === 100, 'Completed quantity is 100');
    assert(createData.data.status === 'In Production', 'Status is "In Production"');

    const productionId = createData.data.id;

    // 4. View All Production Records (GET /api/production)
    console.log('\n--- 3. Testing Get All Production Records (GET /api/production) ---');
    const getAllRes = await fetch(`${BASE_URL}/api/production`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200, 'Get all production status is 200 OK');
    assert(Array.isArray(getAllData.data.production_records), 'Production records array returned');
    assert(getAllData.data.total >= 1, 'Total production count >= 1');

    // 5. View Single Production Record (GET /api/production/:id)
    console.log('\n--- 4. Testing Get Single Production Record (GET /api/production/:id) ---');
    const getSingleRes = await fetch(`${BASE_URL}/api/production/${productionId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getSingleData = await getSingleRes.json();
    assert(getSingleRes.status === 200, 'Get single production status is 200 OK');
    assert(getSingleData.data.id === productionId, 'Production ID matches');
    assert(getSingleData.data.product_name === product.name, 'Product name is included in record');

    // 6. View Production by Product ID (GET /api/production/product/:productId)
    console.log('\n--- 5. Testing Get Production by Product ID ---');
    const getByProdRes = await fetch(`${BASE_URL}/api/production/product/${product.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByProdData = await getByProdRes.json();
    assert(getByProdRes.status === 200, 'Get by product ID status is 200 OK');
    assert(Array.isArray(getByProdData.data), 'Array of production records returned');
    assert(getByProdData.data.some(r => r.id === productionId), 'Created record found for product');

    // 7. Update Production Details (PUT /api/production/:id)
    console.log('\n--- 6. Testing Update Production Record (PUT /api/production/:id) ---');
    const updateRes = await fetch(`${BASE_URL}/api/production/${productionId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        quantity_producing: 100,
        quantity_completed: 200,
        notes: 'Batch phase 1 completed'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update production status is 200 OK');
    assert(updateData.data.quantity_producing === 100, 'Quantity producing updated to 100');
    assert(updateData.data.quantity_completed === 200, 'Quantity completed updated to 200');

    // 8. Update Production Status (PATCH /api/production/:id/status)
    console.log('\n--- 7. Testing Update Production Status (PATCH /api/production/:id/status) ---');
    const statusRes = await fetch(`${BASE_URL}/api/production/${productionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'Update status response is 200 OK');
    assert(statusData.data.status === 'Completed', 'Status updated to "Completed"');

    // 9. Validation: Reject Invalid Status
    console.log('\n--- 8. Testing Invalid Status Validation ---');
    const invalidStatusRes = await fetch(`${BASE_URL}/api/production/${productionId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ status: 'Finished' })
    });
    const invalidStatusData = await invalidStatusRes.json();
    assert(invalidStatusRes.status === 400 && invalidStatusData.success === false, 'Invalid status rejected with 400 Bad Request');

    // 10. Validation: Reject Negative Quantities
    console.log('\n--- 9. Testing Negative Quantity Validations ---');
    const negativeQtyRes = await fetch(`${BASE_URL}/api/production`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        product_id: product.id,
        weekly_capacity: -50
      })
    });
    const negativeQtyData = await negativeQtyRes.json();
    assert(negativeQtyRes.status === 400 && negativeQtyData.success === false, 'Negative capacity rejected with 400 Bad Request');

    // 11. Auth Protection without Token
    console.log('\n--- 10. Testing Auth Protection without Token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/production`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated production request rejected with 401');

    console.log('\n====================================================');
    console.log(`PRODUCTION TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runProductionTests();
