const BASE_URL = 'http://localhost:3000';

const runReturnTests = async () => {
  console.log('====================================================');
  console.log('STARTING RETURNS & REPLACEMENT MODULE (PHASE 7) TESTS');
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

    // 2. Setup Test Product and Customer Order
    console.log('\n--- 2. Setting Up Test Product & Order for Return ---');
    const prodRes1 = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Faulty RAM 16GB', type: 'RAM', price: 40.00, available_quantity: 50 })
    });
    const prodData1 = await prodRes1.json();
    const returnedProduct = prodData1.data;

    const prodRes2 = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Replacement RAM 16GB Pro', type: 'RAM', price: 45.00, available_quantity: 50 })
    });
    const prodData2 = await prodRes2.json();
    const replacementProduct = prodData2.data;

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customer_name: 'Delta Computing Solutions',
        customer_email: 'support@deltacomputing.com',
        items: [{ product_id: returnedProduct.id, quantity: 2 }]
      })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, 'Order created for return testing');
    const orderId = orderData.data.id;

    // 3. Create Return Request (POST /api/returns)
    console.log('\n--- 3. Testing Create Return Request (POST /api/returns) ---');
    const createReturnRes = await fetch(`${BASE_URL}/api/returns`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        order_id: orderId,
        product_id: returnedProduct.id,
        quantity: 1,
        return_reason: 'Memory module failing POST test on Slot A',
        replacement_required: true,
        replacement_product_id: replacementProduct.id,
        replacement_quantity: 1,
        notes: 'Customer requested express RMA replacement'
      })
    });
    const createReturnData = await createReturnRes.json();
    assert(createReturnRes.status === 201, 'Create return status is 201');
    assert(createReturnData.success === true, 'Response success is true');
    assert(createReturnData.data.return_number.startsWith('RET-'), 'Return number generated with RET- prefix');
    assert(createReturnData.data.customer_name === 'Delta Computing Solutions', 'Customer name matches');
    assert(createReturnData.data.product_id === returnedProduct.id, 'Returned product ID matches');
    assert(createReturnData.data.replacement_required === true, 'Replacement required flag is true');
    assert(createReturnData.data.status === 'Requested', 'Initial return status is "Requested"');

    const returnId = createReturnData.data.id;
    const returnNumber = createReturnData.data.return_number;

    // 4. View All Returns (GET /api/returns)
    console.log('\n--- 4. Testing Get All Returns (GET /api/returns) ---');
    const getAllRes = await fetch(`${BASE_URL}/api/returns`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200, 'Get all returns status is 200 OK');
    assert(Array.isArray(getAllData.data.returns), 'Returns array returned');
    assert(getAllData.data.total >= 1, 'Total returns count >= 1');

    // 5. View Single Return Record (GET /api/returns/:id)
    console.log('\n--- 5. Testing Get Single Return Record by ID & Number ---');
    const getByIdRes = await fetch(`${BASE_URL}/api/returns/${returnId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByIdData = await getByIdRes.json();
    assert(getByIdRes.status === 200, 'Get return by ID is 200 OK');
    assert(getByIdData.data.id === returnId, 'Retrieved return ID matches');
    assert(getByIdData.data.product_name === 'Faulty RAM 16GB', 'Product name included');

    const getByNumRes = await fetch(`${BASE_URL}/api/returns/${returnNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByNumData = await getByNumRes.json();
    assert(getByNumRes.status === 200, 'Get return by return_number is 200 OK');
    assert(getByNumData.data.return_number === returnNumber, 'Retrieved return number matches');

    // 6. Update Return Details (PUT /api/returns/:id)
    console.log('\n--- 6. Testing Update Return Details (PUT /api/returns/:id) ---');
    const updateRes = await fetch(`${BASE_URL}/api/returns/${returnId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        return_reason: 'Memory module failing POST test on Slot A (Verified with MemTest86)',
        notes: 'Priority RMA approved by tier 2 support'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update return status is 200 OK');
    assert(updateData.data.return_reason.includes('MemTest86'), 'Return reason updated');

    // 7. Update Return Status (PATCH /api/returns/:id/status)
    console.log('\n--- 7. Testing Update Return Status Flow ---');
    const approveRes = await fetch(`${BASE_URL}/api/returns/${returnId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'Approved' })
    });
    const approveData = await approveRes.json();
    assert(approveRes.status === 200, 'Status updated to Approved');
    assert(approveData.data.status === 'Approved', 'Status is Approved');

    const receiveRes = await fetch(`${BASE_URL}/api/returns/${returnId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'Received' })
    });
    const receiveData = await receiveRes.json();
    assert(receiveData.data.status === 'Received', 'Status updated to Received');

    // 8. Record Replacement Information (PATCH /api/returns/:id/replacement)
    console.log('\n--- 8. Testing Record Replacement Information ---');
    const replRes = await fetch(`${BASE_URL}/api/returns/${returnId}/replacement`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        replacement_required: true,
        replacement_product_id: replacementProduct.id,
        replacement_quantity: 1
      })
    });
    const replData = await replRes.json();
    assert(replRes.status === 200, 'Replacement info recorded with 200 OK');
    assert(replData.data.replacement_product_name === 'Replacement RAM 16GB Pro', 'Replacement product name recorded');
    assert(replData.data.replacement_quantity === 1, 'Replacement quantity recorded');

    // 9. Validation: Reject Empty Return Reason
    console.log('\n--- 9. Testing Return Validations ---');
    const invalidReasonRes = await fetch(`${BASE_URL}/api/returns`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ order_id: orderId, product_id: returnedProduct.id, return_reason: '' })
    });
    const invalidReasonData = await invalidReasonRes.json();
    assert(invalidReasonRes.status === 400 && invalidReasonData.success === false, 'Empty return reason rejected with 400');

    // 10. Auth Protection without Token
    console.log('\n--- 10. Testing Auth Protection without Token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/returns`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated return request rejected with 401');

    console.log('\n====================================================');
    console.log(`RETURNS TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runReturnTests();
