const { Product } = require('../models');

const BASE_URL = 'http://localhost:3000';

const runProductTests = async () => {
  console.log('====================================================');
  console.log('STARTING PRODUCT MODULE (PHASE 1) TESTS');
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

    // 2. Create Product 1 (RAM)
    console.log('\n--- 2. Testing Create Product (POST /api/products) ---');
    const createRes1 = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'DDR4 16GB 3200MHz RAM',
        type: 'RAM',
        specifications: { capacity: '16GB', speed: '3200MHz', generation: 'DDR4' },
        price: 45.99,
        available_quantity: 150,
        description: 'High-speed desktop memory module'
      })
    });
    const createData1 = await createRes1.json();
    assert(createRes1.status === 201, 'Create product status is 201');
    assert(createData1.success === true, 'Response success is true');
    assert(createData1.data.name === 'DDR4 16GB 3200MHz RAM', 'Product name matches');
    assert(createData1.data.type === 'RAM', 'Product type matches');
    assert(Number(createData1.data.price) === 45.99, 'Product price matches');
    assert(createData1.data.available_quantity === 150, 'Product quantity matches');
    assert(createData1.data.is_active === true, 'Product is active by default');

    const productId = createData1.data.id;

    // 3. Create Product 2 (SSD)
    console.log('\n--- 3. Testing Create Second Product (SSD) ---');
    const createRes2 = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'NVMe M.2 1TB SSD',
        type: 'SSD',
        specifications: { capacity: '1TB', form_factor: 'M.2 NVMe', read_speed: '3500MB/s' },
        price: 89.50,
        available_quantity: 80,
        description: 'High-performance NVMe Solid State Drive'
      })
    });
    const createData2 = await createRes2.json();
    assert(createRes2.status === 201, 'Second product created with 201');
    const product2Id = createData2.data.id;

    // 4. Validation: Missing Name / Type / Negative Price
    console.log('\n--- 4. Testing Product Creation Validations ---');
    const invalidPriceRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        name: 'Test Product',
        type: 'SSD',
        price: -10
      })
    });
    const invalidPriceData = await invalidPriceRes.json();
    assert(invalidPriceRes.status === 400 && invalidPriceData.success === false, 'Negative price rejected with 400 Bad Request');

    const missingNameRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        type: 'SSD',
        price: 50
      })
    });
    const missingNameData = await missingNameRes.json();
    assert(missingNameRes.status === 400 && missingNameData.success === false, 'Missing name rejected with 400 Bad Request');

    // 5. Get All Products (GET /api/products)
    console.log('\n--- 5. Testing Get All Products (GET /api/products) ---');
    const getAllRes = await fetch(`${BASE_URL}/api/products`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200, 'Get all products returns 200 OK');
    assert(Array.isArray(getAllData.data.products), 'Products array returned');
    assert(getAllData.data.total >= 2, 'Total products count >= 2');

    // Filter by type: SSD
    const filterTypeRes = await fetch(`${BASE_URL}/api/products?type=SSD`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const filterTypeData = await filterTypeRes.json();
    assert(
      filterTypeData.data.products.every(p => p.type.toLowerCase().includes('ssd')),
      'Type filter correctly returns only SSD products'
    );

    // Search by name
    const searchRes = await fetch(`${BASE_URL}/api/products?search=DDR4`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    assert(searchData.data.products.length > 0 && searchData.data.products[0].name.includes('DDR4'), 'Search by query string works');

    // 6. Get Product By ID (GET /api/products/:id)
    console.log('\n--- 6. Testing Get Single Product (GET /api/products/:id) ---');
    const getSingleRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getSingleData = await getSingleRes.json();
    assert(getSingleRes.status === 200, 'Single product retrieved with 200 OK');
    assert(getSingleData.data.id === productId, 'Retrieved product ID matches');

    // Non-existent product ID
    const notFoundRes = await fetch(`${BASE_URL}/api/products/99999999`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const notFoundData = await notFoundRes.json();
    assert(notFoundRes.status === 404 && notFoundData.success === false, 'Non-existent product returns 404 Not Found');

    // 7. Update Product (PUT /api/products/:id)
    console.log('\n--- 7. Testing Update Product (PUT /api/products/:id) ---');
    const updateRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        price: 49.99,
        available_quantity: 180,
        description: 'Updated high-speed desktop memory module'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update product status is 200 OK');
    assert(Number(updateData.data.price) === 49.99, 'Updated price reflected');
    assert(updateData.data.available_quantity === 180, 'Updated quantity reflected');

    // 8. Deactivate Product (DELETE /api/products/:id)
    console.log('\n--- 8. Testing Deactivate Product (DELETE /api/products/:id) ---');
    const deactivateRes = await fetch(`${BASE_URL}/api/products/${productId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const deactivateData = await deactivateRes.json();
    assert(deactivateRes.status === 200, 'Deactivate status is 200 OK');
    assert(deactivateData.data.is_active === false, 'Product is_active is now false');

    // 9. Unauthorized request without token
    console.log('\n--- 9. Testing Auth Protection without Token ---');
    const noAuthRes = await fetch(`${BASE_URL}/api/products`);
    const noAuthData = await noAuthRes.json();
    assert(noAuthRes.status === 401 && noAuthData.success === false, 'Unauthenticated request rejected with 401');

    console.log('\n====================================================');
    console.log(`PRODUCT TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runProductTests();
