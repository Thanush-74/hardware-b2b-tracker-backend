const BASE_URL = 'http://localhost:3000';

const runDeliveryTests = async () => {
  console.log('====================================================');
  console.log('STARTING DELIVERIES MODULE (PHASE 6) TESTS');
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
    const adminStaffId = loginData.data.user.id;
    assert(token && token.length > 20, 'Admin token acquired');

    // 2. Fetch or create a product & customer order for delivery testing
    console.log('\n--- 2. Setting Up Test Order for Delivery ---');
    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Delivery Test RAM 8GB', type: 'RAM', price: 35.00, available_quantity: 40 })
    });
    const prodData = await prodRes.json();
    const product = prodData.data;

    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customer_name: 'Nexus Tech Systems',
        customer_email: 'delivery@nexustech.com',
        customer_phone: '+1-555-8844',
        items: [{ product_id: product.id, quantity: 4 }]
      })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, 'Test order created with 201');
    const orderId = orderData.data.id;

    // 3. Create Delivery (POST /api/deliveries)
    console.log('\n--- 3. Testing Create Delivery (POST /api/deliveries) ---');
    const createDeliveryRes = await fetch(`${BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        order_id: orderId,
        delivery_address: '742 Evergreen Terrace, Sector 4, Tech City',
        recipient_name: 'Alex Mercer',
        recipient_phone: '+1-555-8844',
        expected_delivery_date: '2026-10-05',
        notes: 'Call before dispatch'
      })
    });
    const createDeliveryData = await createDeliveryRes.json();
    assert(createDeliveryRes.status === 201, 'Create delivery status is 201');
    assert(createDeliveryData.success === true, 'Response success is true');
    assert(createDeliveryData.data.tracking_number.startsWith('TRK-'), 'Tracking number generated with TRK- prefix');
    assert(createDeliveryData.data.customer_name === 'Nexus Tech Systems', 'Customer name matches order');
    assert(createDeliveryData.data.delivery_address.includes('Evergreen Terrace'), 'Delivery address recorded');
    assert(createDeliveryData.data.status === 'Pending', 'Initial delivery status is Pending');

    const deliveryId = createDeliveryData.data.id;
    const trackingNumber = createDeliveryData.data.tracking_number;

    // 4. View All Deliveries (GET /api/deliveries)
    console.log('\n--- 4. Testing Get All Deliveries (GET /api/deliveries) ---');
    const getAllRes = await fetch(`${BASE_URL}/api/deliveries`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200, 'Get all deliveries status is 200 OK');
    assert(Array.isArray(getAllData.data.deliveries), 'Deliveries array returned');
    assert(getAllData.data.total >= 1, 'Total deliveries count >= 1');

    // 5. View Single Delivery by ID and Tracking Number (GET /api/deliveries/:id)
    console.log('\n--- 5. Testing Get Single Delivery by ID & Tracking Number ---');
    const getByIdRes = await fetch(`${BASE_URL}/api/deliveries/${deliveryId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByIdData = await getByIdRes.json();
    assert(getByIdRes.status === 200, 'Get delivery by ID is 200 OK');
    assert(getByIdData.data.id === deliveryId, 'Retrieved delivery ID matches');

    const getByTrkRes = await fetch(`${BASE_URL}/api/deliveries/${trackingNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByTrkData = await getByTrkRes.json();
    assert(getByTrkRes.status === 200, 'Get delivery by tracking number is 200 OK');
    assert(getByTrkData.data.tracking_number === trackingNumber, 'Retrieved tracking number matches');

    // 6. Assign Delivery Staff (PATCH /api/deliveries/:id/assign)
    console.log('\n--- 6. Testing Assign Delivery Employee (PATCH /api/deliveries/:id/assign) ---');
    const assignRes = await fetch(`${BASE_URL}/api/deliveries/${deliveryId}/assign`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ delivery_staff_id: adminStaffId })
    });
    const assignData = await assignRes.json();
    assert(assignRes.status === 200, 'Assign delivery staff status is 200 OK');
    assert(Number(assignData.data.delivery_staff_id) === Number(adminStaffId), 'Delivery staff assigned');
    assert(assignData.data.status === 'Preparing', 'Status transitioned to "Preparing" upon assignment');

    // 7. Update Delivery Status to In Transit (PATCH /api/deliveries/:id/status)
    console.log('\n--- 7. Testing Transition to In Transit (Order -> Shipped) ---');
    const transitRes = await fetch(`${BASE_URL}/api/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'In Transit' })
    });
    const transitData = await transitRes.json();
    assert(transitRes.status === 200, 'Status updated to In Transit');
    assert(transitData.data.status === 'In Transit', 'Delivery status is In Transit');

    // Check order status changed to Shipped
    const checkOrderRes1 = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkOrderData1 = await checkOrderRes1.json();
    assert(checkOrderData1.data.order_status === 'Shipped', 'Order status automatically synced to "Shipped"');

    // 8. Update Delivery Status to Delivered
    console.log('\n--- 8. Testing Transition to Delivered (Order -> Delivered) ---');
    const deliveredRes = await fetch(`${BASE_URL}/api/deliveries/${deliveryId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ status: 'Delivered' })
    });
    const deliveredData = await deliveredRes.json();
    assert(deliveredRes.status === 200, 'Status updated to Delivered');
    assert(deliveredData.data.status === 'Delivered', 'Delivery status is Delivered');
    assert(deliveredData.data.delivery_date !== null, 'Delivery date timestamp recorded');

    // Check order status changed to Delivered
    const checkOrderRes2 = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkOrderData2 = await checkOrderRes2.json();
    assert(checkOrderData2.data.order_status === 'Delivered', 'Order status automatically synced to "Delivered"');

    // 9. Validation: Reject Missing Address or Invalid Order
    console.log('\n--- 9. Testing Delivery Validations ---');
    const invalidAddressRes = await fetch(`${BASE_URL}/api/deliveries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ order_id: orderId, delivery_address: '' })
    });
    const invalidAddressData = await invalidAddressRes.json();
    assert(invalidAddressRes.status === 400 && invalidAddressData.success === false, 'Empty address rejected with 400');

    // 10. Auth Protection without Token
    console.log('\n--- 10. Testing Auth Protection without Token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/deliveries`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated delivery request rejected with 401');

    console.log('\n====================================================');
    console.log(`DELIVERIES TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runDeliveryTests();
