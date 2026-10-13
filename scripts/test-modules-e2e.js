// test-modules-e2e.js
// End-to-End integration test covering Scenarios A, B, and C as required.

const BASE_URL = 'http://localhost:3000';

async function runTests() {
  console.log('====================================================');
  console.log('STARTING HARDWARE B2B TRACKER MODULE INTEGRATION TESTS');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, message, details = '') {
    if (condition) {
      console.log(`✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${message} - Details: ${details}`);
      failed++;
    }
  }

  // 1. Authenticate as Admin
  console.log('\n--- Authenticating Admin ---');
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@company.com', password: 'password' })
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.token;
  const adminId = loginData.data?.user?.id;
  assert(Boolean(token), 'Admin login successful and token acquired');

  const authHeaders = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  };

  // ----------------------------------------------------
  // SCENARIO A: Existing stock and order
  // ----------------------------------------------------
  console.log('\n--- SCENARIO A: Existing stock and order ---');

  // Step A1: Ensure we have a GPU product with exactly 100 stock
  console.log('1. Setting up GPU product with exactly 100 units in stock');
  const createGpuRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Test GPU RTX 4090 - ${Date.now()}`,
      type: 'GPU',
      price: 150000,
      available_quantity: 100,
      description: 'Test GPU for E2E validation'
    })
  });
  const gpuData = await createGpuRes.json();
  const gpuProduct = gpuData.data;
  assert(gpuProduct && gpuProduct.id, 'GPU product created with ID: ' + gpuProduct?.id);

  // Check inventory record for this GPU
  const invRes = await fetch(`${BASE_URL}/api/inventory?product_id=${gpuProduct.id}`, {
    headers: authHeaders
  });
  const invData = await invRes.json();
  const gpuInventory = invData.data?.inventory?.[0];
  assert(gpuInventory && Number(gpuInventory.available_quantity) === 100,
    'GPU inventory verified with available_quantity = 100',
    `Found available: ${gpuInventory?.available_quantity}`
  );

  // Step A2: Add 5 GPUs to the cart
  console.log('2. Adding 5 GPUs to active cart');
  // Clear any existing cart items first
  await fetch(`${BASE_URL}/api/cart`, { method: 'DELETE', headers: authHeaders });

  const addCartRes = await fetch(`${BASE_URL}/api/cart/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      product_id: gpuProduct.id,
      quantity: 5
    })
  });
  const addCartData = await addCartRes.json();
  assert(addCartData.success, 'Added 5 GPUs to cart');

  // Step A3: Confirm that adding to cart alone does NOT deduct physical inventory stock
  console.log('3. Verifying stock remains 100 after adding to cart');
  const invAfterCartRes = await fetch(`${BASE_URL}/api/inventory?product_id=${gpuProduct.id}`, {
    headers: authHeaders
  });
  const invAfterCartData = await invAfterCartRes.json();
  const invAfterCart = invAfterCartData.data?.inventory?.[0];
  assert(Number(invAfterCart.available_quantity) === 100,
    'Adding to cart did not deduct physical stock (still 100 units)',
    `Available: ${invAfterCart?.available_quantity}`
  );

  // Step A4 & A5: Confirm the order and verify stock deduction
  console.log('4 & 5. Placing order and verifying immediate physical stock deduction');
  const orderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer_name: 'Apex Data Centers Ltd',
      customer_email: 'procurement@apex.io',
      use_cart: true,
      payment_method: 'Bank Transfer',
      notes: 'Test order scenario A'
    })
  });
  const orderData = await orderRes.json();
  const createdOrder = orderData.data;
  assert(orderData.success && createdOrder?.order_number,
    'Order created successfully: #' + createdOrder?.order_number
  );

  // Step A6: Verify order and order items stored correctly
  assert(createdOrder?.items?.length === 1 && Number(createdOrder.items[0].quantity) === 5,
    'Order items stored correctly with quantity = 5'
  );
  assert(Number(createdOrder.total_amount) === 5 * 150000,
    'Order total correctly computed: ₹' + createdOrder.total_amount
  );

  // Check inventory stock after order
  const invAfterOrderRes = await fetch(`${BASE_URL}/api/inventory?product_id=${gpuProduct.id}`, {
    headers: authHeaders
  });
  const invAfterOrderData = await invAfterOrderRes.json();
  const invAfterOrder = invAfterOrderData.data?.inventory?.[0];
  assert(Number(invAfterOrder.available_quantity) === 95,
    'Inventory available_quantity correctly reduced from 100 to 95',
    `Available: ${invAfterOrder?.available_quantity}`
  );

  // Verify cart was cleared after order creation
  const cartAfterOrderRes = await fetch(`${BASE_URL}/api/cart`, { headers: authHeaders });
  const cartAfterOrderData = await cartAfterOrderRes.json();
  assert(cartAfterOrderData.data?.items?.length === 0, 'Cart cleared after order creation');

  // Step A7: Cancel order and verify stock restored exactly once
  console.log('6. Testing order cancellation and stock restoration');
  const cancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ order_status: 'Cancelled' })
  });
  const cancelData = await cancelRes.json();
  assert(cancelData.success && cancelData.data?.order_status === 'Cancelled',
    'Order successfully cancelled'
  );

  const invAfterCancelRes = await fetch(`${BASE_URL}/api/inventory?product_id=${gpuProduct.id}`, {
    headers: authHeaders
  });
  const invAfterCancelData = await invAfterCancelRes.json();
  const invAfterCancel = invAfterCancelData.data?.inventory?.[0];
  assert(Number(invAfterCancel.available_quantity) === 100,
    'Inventory stock successfully restored to 100 upon cancellation'
  );

  // Repeat cancellation request: stock must NOT be restored twice
  console.log('7. Retrying cancellation to verify idempotency (no double-restoration)');
  const repeatCancelRes = await fetch(`${BASE_URL}/api/orders/${createdOrder.id}/status`, {
    method: 'PUT',
    headers: authHeaders,
    body: JSON.stringify({ order_status: 'Cancelled' })
  });
  const invAfterRepeatRes = await fetch(`${BASE_URL}/api/inventory?product_id=${gpuProduct.id}`, {
    headers: authHeaders
  });
  const invAfterRepeatData = await invAfterRepeatRes.json();
  const invAfterRepeat = invAfterRepeatData.data?.inventory?.[0];
  assert(Number(invAfterRepeat.available_quantity) === 100,
    'Repeated cancellation attempt did not restore stock again (remains 100)'
  );

  // ----------------------------------------------------
  // SCENARIO B: Production and inspection
  // ----------------------------------------------------
  console.log('\n--- SCENARIO B: Production and Quality Inspection ---');

  // Step B0: Create a RAM product with initial stock 0
  const createRamRes = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      name: `Test TitanRAM DDR5 64GB - ${Date.now()}`,
      type: 'RAM',
      price: 18000,
      available_quantity: 0,
      description: 'RAM for Production Scenario B'
    })
  });
  const ramData = await createRamRes.json();
  const ramProduct = ramData.data;
  assert(ramProduct && ramProduct.id, 'RAM Product created with initial stock 0');

  // Step B1: Create a production batch for 50 RAM modules
  console.log('1. Creating production batch for 50 RAM modules');
  const prodRes = await fetch(`${BASE_URL}/api/production`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      product_id: ramProduct.id,
      quantity_planned: 50,
      status: 'Planned',
      notes: 'RAM Batch 50 units Scenario B'
    })
  });
  const prodData = await prodRes.json();
  const productionBatch = prodData.data;
  assert(productionBatch && Number(productionBatch.quantity_planned) === 50,
    'Production batch created with target planned = 50'
  );

  // Verify creating a production batch alone does NOT increase sellable inventory
  const ramInvRes1 = await fetch(`${BASE_URL}/api/inventory?product_id=${ramProduct.id}`, { headers: authHeaders });
  const ramInv1 = (await ramInvRes1.json()).data?.inventory?.[0];
  assert(Number(ramInv1.available_quantity) === 0,
    'Creating production batch did NOT add to sellable inventory (remains 0)'
  );

  // Step B2: Assign manufacturing staff
  console.log('2. Assigning manufacturing staff to production batch');
  const assignRes = await fetch(`${BASE_URL}/api/manufacturing`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      staff_id: adminId,
      sector: 'Assembly',
      production_id: productionBatch.id,
      product_id: ramProduct.id,
      completed_quantity: 50,
      status: 'Completed',
      notes: 'Assembly shift completed for 50 RAM units'
    })
  });
  const assignData = await assignRes.json();
  assert(assignData.success && assignData.data?.production_id == productionBatch.id,
    'Manufacturing assignment created and linked to production batch'
  );

  // Step B3: Verify production batch progress is updated to 50 completed
  const checkBatchRes = await fetch(`${BASE_URL}/api/production/${productionBatch.id}`, { headers: authHeaders });
  const checkBatchData = await checkBatchRes.json();
  assert(Number(checkBatchData.data.quantity_completed) === 50,
    'Production batch completed quantity tracked as 50'
  );

  // Verify manufacturing completion alone does NOT add to inventory
  const ramInvRes2 = await fetch(`${BASE_URL}/api/inventory?product_id=${ramProduct.id}`, { headers: authHeaders });
  const ramInv2 = (await ramInvRes2.json()).data?.inventory?.[0];
  assert(Number(ramInv2.available_quantity) === 0,
    'Manufacturing completion did NOT add units to sellable inventory (remains 0)'
  );

  // Step B4 & B5: Inspect all 50 units: 47 passed, 3 failed
  console.log('3 & 4. Logging Quality Inspection: 50 inspected, 47 passed, 3 failed');
  const inspectRes = await fetch(`${BASE_URL}/api/inspections`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      inspector_id: adminId,
      product_id: ramProduct.id,
      production_id: productionBatch.id,
      item_type: 'Production Batch',
      quantity_inspected: 50,
      passed_quantity: 47,
      failed_quantity: 3,
      result: 'Pending',
      defect_type: 'Signal timing variance on 3 units',
      notes: '3 units quarantined, 47 units ready for stock approval'
    })
  });
  const inspectData = await inspectRes.json();
  const inspectionRecord = inspectData.data;
  assert(inspectData.success && inspectionRecord?.id,
    'Quality inspection recorded: 47 passed, 3 failed, status Pending'
  );

  // Verify before approval, stock is still 0
  const ramInvRes3 = await fetch(`${BASE_URL}/api/inventory?product_id=${ramProduct.id}`, { headers: authHeaders });
  const ramInv3 = (await ramInvRes3.json()).data?.inventory?.[0];
  assert(Number(ramInv3.available_quantity) === 0,
    'Before inspection approval, sellable inventory remains 0'
  );

  // Step B6 & B7: Complete approval step and verify exactly 47 accepted units are added to sellable stock
  console.log('5 & 6. Approving inspection and verifying exactly 47 accepted units added to inventory');
  const approveRes = await fetch(`${BASE_URL}/api/inspections/${inspectionRecord.id}/approve`, {
    method: 'PUT',
    headers: authHeaders
  });
  const approveData = await approveRes.json();
  assert(approveData.success, 'Inspection approval endpoint succeeded');

  const ramInvRes4 = await fetch(`${BASE_URL}/api/inventory?product_id=${ramProduct.id}`, { headers: authHeaders });
  const ramInv4 = (await ramInvRes4.json()).data?.inventory?.[0];
  assert(Number(ramInv4.available_quantity) === 47,
    'EXACTLY 47 accepted units added to sellable inventory (3 failed kept out)',
    `Available quantity: ${ramInv4?.available_quantity}`
  );

  // Step B8: Submit the same inspection approval again and verify NO extra stock is added
  console.log('7. Re-submitting approval to verify idempotency (no duplicate stock added)');
  const reApproveRes = await fetch(`${BASE_URL}/api/inspections/${inspectionRecord.id}/approve`, {
    method: 'PUT',
    headers: authHeaders
  });
  const ramInvRes5 = await fetch(`${BASE_URL}/api/inventory?product_id=${ramProduct.id}`, { headers: authHeaders });
  const ramInv5 = (await ramInvRes5.json()).data?.inventory?.[0];
  assert(Number(ramInv5.available_quantity) === 47,
    'Re-approval did NOT add extra stock (remains exactly 47)'
  );

  // ----------------------------------------------------
  // SCENARIO C: Failure handling and edge cases
  // ----------------------------------------------------
  console.log('\n--- SCENARIO C: Failure handling and edge cases ---');

  // Test C1: Ordering more than available stock fails with 400
  console.log('1. Attempting to order 999 units of RAM (available: 47)');
  const overOrderRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      customer_name: 'Overbuyer Corp',
      items: [{ product_id: ramProduct.id, quantity: 999 }]
    })
  });
  const overOrderData = await overOrderRes.json();
  assert(overOrderRes.status === 400 && !overOrderData.success,
    'Overselling prevented: 400 Bad Request returned',
    overOrderData.message
  );

  // Verify stock remained intact at 47
  const ramInvRes6 = await fetch(`${BASE_URL}/api/inventory?product_id=${ramProduct.id}`, { headers: authHeaders });
  const ramInv6 = (await ramInvRes6.json()).data?.inventory?.[0];
  assert(Number(ramInv6.available_quantity) === 47, 'Stock unchanged after failed order attempt');

  // Test C2: Invalid quantities in Cart and Orders rejected
  console.log('2. Testing invalid cart quantities (-5, 0, 3.14)');
  const negCartRes = await fetch(`${BASE_URL}/api/cart/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ product_id: ramProduct.id, quantity: -5 })
  });
  assert(negCartRes.status === 400, 'Negative cart quantity rejected (400)');

  const floatCartRes = await fetch(`${BASE_URL}/api/cart/items`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ product_id: ramProduct.id, quantity: 3.14 })
  });
  assert(floatCartRes.status === 400, 'Non-integer cart quantity rejected (400)');

  // Test C3: Inspecting units that exceed batch completion rejected
  console.log('3. Attempting to inspect more units than manufactured');
  const overInspectRes = await fetch(`${BASE_URL}/api/inspections`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      inspector_id: adminId,
      production_id: productionBatch.id,
      quantity_inspected: 100, // Batch completed was 50, and 50 already inspected
      passed_quantity: 100,
      failed_quantity: 0
    })
  });
  assert(overInspectRes.status === 400, 'Inspecting more than manufactured units rejected (400)');

  // Test C4: Unauthorized requests rejected
  console.log('4. Testing unauthorized access without valid JWT');
  const unauthRes = await fetch(`${BASE_URL}/api/orders`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' }
  });
  assert(unauthRes.status === 401, 'Unauthorized request rejected with 401');

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`ALL INTEGRATION TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
