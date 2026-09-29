const BASE_URL = 'http://localhost:3000';

const runOrderTests = async () => {
  console.log('====================================================');
  console.log('STARTING CUSTOMER ORDERS MODULE (PHASE 5) TESTS');
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

    // 2. Create products for testing orders
    const p1Res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Enterprise DDR4 32GB RAM', type: 'RAM', price: 80.00, available_quantity: 50 })
    });
    const p1Data = await p1Res.json();
    const product1 = p1Data.data;

    const p2Res = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Enterprise NVMe 2TB SSD', type: 'SSD', price: 150.00, available_quantity: 30 })
    });
    const p2Data = await p2Res.json();
    const product2 = p2Data.data;

    // 3. Create Direct Customer Order (POST /api/orders)
    console.log('\n--- 2. Testing Create Direct Order with Items ---');
    const createOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        customer_name: 'Acme Hardware Corp',
        customer_email: 'procurement@acme.com',
        customer_phone: '+1-555-0199',
        items: [
          { product_id: product1.id, quantity: 5 },
          { product_id: product2.id, quantity: 2 }
        ],
        payment_method: 'Bank Transfer',
        payment_status: 'Pending',
        notes: 'Deliver to main HQ'
      })
    });
    const createOrderData = await createOrderRes.json();
    assert(createOrderRes.status === 201, 'Create order status is 201');
    assert(createOrderData.success === true, 'Response success is true');
    assert(createOrderData.data.order_number.startsWith('ORD-'), 'Order number is generated with ORD- prefix');
    assert(createOrderData.data.customer_name === 'Acme Hardware Corp', 'Customer name matches');
    assert(createOrderData.data.items.length === 2, 'Order has 2 items');

    // Expected total: (5 * 80) + (2 * 150) = 400 + 300 = 700.00
    assert(Number(createOrderData.data.total_amount) === 700.00, 'Total amount correctly calculated ($700.00)');
    assert(createOrderData.data.order_status === 'Pending', 'Order status is Pending');
    assert(createOrderData.data.payment_status === 'Pending', 'Payment status is Pending');

    const orderId = createOrderData.data.id;
    const orderNumber = createOrderData.data.order_number;

    // 4. Verify Stock Deduction after Order Creation
    console.log('\n--- 3. Verifying Stock Deduction from Products & Inventory ---');
    const checkProdRes = await fetch(`${BASE_URL}/api/products/${product1.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkProdData = await checkProdRes.json();
    assert(checkProdData.data.available_quantity === 45, 'Product 1 stock deducted by 5 (50 - 5 = 45)');

    // 5. Create Order via Cart Conversion
    console.log('\n--- 4. Testing Create Order from Cart ---');
    // Ensure cart is clean first
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Add item to cart
    await fetch(`${BASE_URL}/api/cart`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ product_id: product1.id, quantity: 2 })
    });

    const cartOrderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customer_name: 'TechLogistics Ltd',
        customer_email: 'buyer@techlogistics.com',
        use_cart: true,
        payment_method: 'Credit Card',
        payment_status: 'Paid'
      })
    });
    const cartOrderData = await cartOrderRes.json();
    assert(cartOrderRes.status === 201, 'Order created from cart with 201');
    assert(cartOrderData.data.items.length === 1, 'Order contains cart items');
    assert(Number(cartOrderData.data.total_amount) === 160.00, 'Total amount matches cart items (2 * $80 = $160)');
    assert(cartOrderData.data.payment_status === 'Paid', 'Payment status is Paid');

    // Verify cart is now empty
    const checkCartRes = await fetch(`${BASE_URL}/api/cart`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const checkCartData = await checkCartRes.json();
    assert(checkCartData.data.items.length === 0, 'Cart was automatically cleared after order creation');

    // 6. View All Orders (GET /api/orders)
    console.log('\n--- 5. Testing Get All Orders (GET /api/orders) ---');
    const getAllRes = await fetch(`${BASE_URL}/api/orders`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getAllData = await getAllRes.json();
    assert(getAllRes.status === 200, 'Get all orders status is 200 OK');
    assert(Array.isArray(getAllData.data.orders), 'Orders array returned');
    assert(getAllData.data.total >= 2, 'Total orders count >= 2');

    // Search filter
    const searchRes = await fetch(`${BASE_URL}/api/orders?search=Acme`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const searchData = await searchRes.json();
    assert(searchData.data.orders.some(o => o.customer_name.includes('Acme')), 'Search by customer name works');

    // 7. View Single Order by ID and by order_number (GET /api/orders/:id)
    console.log('\n--- 6. Testing Get Single Order (GET /api/orders/:id) ---');
    const getByIdRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByIdData = await getByIdRes.json();
    assert(getByIdRes.status === 200, 'Get single order by ID is 200 OK');
    assert(getByIdData.data.id === orderId, 'Retrieved order ID matches');

    const getByNumRes = await fetch(`${BASE_URL}/api/orders/${orderNumber}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getByNumData = await getByNumRes.json();
    assert(getByNumRes.status === 200, 'Get single order by order_number is 200 OK');
    assert(getByNumData.data.order_number === orderNumber, 'Retrieved order number matches');

    // 8. Update Order (PUT /api/orders/:id)
    console.log('\n--- 7. Testing Update Order Details (PUT /api/orders/:id) ---');
    const updateRes = await fetch(`${BASE_URL}/api/orders/${orderId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        customer_phone: '+1-555-9988',
        notes: 'Updated delivery instructions: Gate Code #4432'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update order status is 200 OK');
    assert(updateData.data.customer_phone === '+1-555-9988', 'Customer phone updated');
    assert(updateData.data.notes.includes('Gate Code #4432'), 'Notes updated');

    // 9. Update Payment Status (PATCH /api/orders/:id/payment)
    console.log('\n--- 8. Testing Update Payment Status (PATCH /api/orders/:id/payment) ---');
    const paymentRes = await fetch(`${BASE_URL}/api/orders/${orderId}/payment`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        payment_status: 'Paid',
        payment_amount: 700.00,
        payment_method: 'Bank Transfer'
      })
    });
    const paymentData = await paymentRes.json();
    assert(paymentRes.status === 200, 'Update payment status is 200 OK');
    assert(paymentData.data.payment_status === 'Paid', 'Payment status is Paid');
    assert(paymentData.data.payment_amount === 700.00, 'Payment amount recorded');

    // 10. Update Order Status (PATCH /api/orders/:id/status)
    console.log('\n--- 9. Testing Update Order Status & Cancel Restoration ---');
    const statusRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ order_status: 'Confirmed' })
    });
    const statusData = await statusRes.json();
    assert(statusRes.status === 200, 'Order status updated to Confirmed');
    assert(statusData.data.order_status === 'Confirmed', 'Order status is Confirmed');

    // Cancel order and verify stock restored
    const cancelRes = await fetch(`${BASE_URL}/api/orders/${orderId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ order_status: 'Cancelled' })
    });
    const cancelData = await cancelRes.json();
    assert(cancelRes.status === 200, 'Order cancelled successfully');
    assert(cancelData.data.order_status === 'Cancelled', 'Order status is Cancelled');

    // Check restored stock on product 1 (43 + 5 = 48)
    const restoredProdRes = await fetch(`${BASE_URL}/api/products/${product1.id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const restoredProdData = await restoredProdRes.json();
    assert(restoredProdData.data.available_quantity === 48, 'Stock restored after order cancellation (43 + 5 = 48)');

    // 11. Validation: Reject Empty Customer Name or Missing Items
    console.log('\n--- 10. Testing Order Validations ---');
    const invalidNameRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ customer_name: '', items: [{ product_id: product1.id, quantity: 1 }] })
    });
    const invalidNameData = await invalidNameRes.json();
    assert(invalidNameRes.status === 400 && invalidNameData.success === false, 'Empty customer name rejected with 400');

    // 12. Auth Protection without Token
    console.log('\n--- 11. Testing Auth Protection without Token ---');
    const unauthRes = await fetch(`${BASE_URL}/api/orders`);
    const unauthData = await unauthRes.json();
    assert(unauthRes.status === 401 && unauthData.success === false, 'Unauthenticated order request rejected with 401');

    console.log('\n====================================================');
    console.log(`CUSTOMER ORDERS TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runOrderTests();
