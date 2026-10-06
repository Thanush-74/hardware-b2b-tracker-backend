const BASE_URL = 'http://localhost:3000';

const runTests = async () => {
  console.log('====================================================');
  console.log('STARTING GLOBAL SEARCH & NOTIFICATIONS TEST SUITE');
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
    console.log('--- 1. Authenticating as Admin ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@company.com', password: 'password' })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData?.data?.token;
    assert(adminToken && adminToken.length > 20, 'Admin token acquired');

    // 2. Test Global Search without query (GET /api/search?q=)
    console.log('\n--- 2. Testing Empty Search (GET /api/search) ---');
    const emptySearchRes = await fetch(`${BASE_URL}/api/search?q=`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const emptySearchData = await emptySearchRes.json();
    assert(emptySearchRes.status === 200, 'Empty search returns 200');
    assert(emptySearchData.success === true, 'Empty search success is true');
    assert(Array.isArray(emptySearchData.data.products) && emptySearchData.data.products.length === 0, 'Empty search returns empty products array');

    // 3. Test Global Search for "GPU" (GET /api/search?q=GPU)
    console.log('\n--- 3. Testing Global Search for "GPU" ---');
    const gpuSearchRes = await fetch(`${BASE_URL}/api/search?q=GPU`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const gpuSearchData = await gpuSearchRes.json();
    assert(gpuSearchRes.status === 200, 'GPU search returns 200');
    assert(gpuSearchData.success === true, 'GPU search success is true');
    assert(Array.isArray(gpuSearchData.data.products) && gpuSearchData.data.products.length > 0, 'GPU search returns matching products');
    console.log(`Found ${gpuSearchData.data.products.length} products matching "GPU"`);

    // 4. Test Global Search for "admin" (GET /api/search?q=admin)
    console.log('\n--- 4. Testing Global Search for "admin" ---');
    const adminSearchRes = await fetch(`${BASE_URL}/api/search?q=admin`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const adminSearchData = await adminSearchRes.json();
    assert(adminSearchRes.status === 200, 'Admin search returns 200');
    assert(adminSearchData.success === true, 'Admin search success is true');
    assert(Array.isArray(adminSearchData.data.staff) && adminSearchData.data.staff.length > 0, 'Admin search returns matching staff members');
    console.log(`Found ${adminSearchData.data.staff.length} staff matching "admin"`);

    // 5. Test Global Search for "order" (GET /api/search?q=order)
    console.log('\n--- 5. Testing Global Search for "order" ---');
    const orderSearchRes = await fetch(`${BASE_URL}/api/search?q=order`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const orderSearchData = await orderSearchRes.json();
    assert(orderSearchRes.status === 200, 'Order search returns 200');
    assert(orderSearchData.success === true, 'Order search success is true');
    console.log(`Found ${orderSearchData.data.orders.length} orders matching "order"`);

    // 6. Test Unauthenticated Search
    console.log('\n--- 6. Testing Unauthenticated Search (Should 401) ---');
    const unauthSearchRes = await fetch(`${BASE_URL}/api/search?q=GPU`);
    assert(unauthSearchRes.status === 401, 'Unauthenticated search rejected with 401');

    // 7. Trigger a Business Event to Create Notifications (e.g. create an order)
    console.log('\n--- 7. Creating Order to Trigger Backend Notification ---');
    const orderRes = await fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        customer_name: 'Search & Notification Test Corp',
        items: [{ product_id: '50', quantity: 1 }],
        payment_method: 'Bank Transfer',
        payment_status: 'Pending'
      })
    });
    const orderData = await orderRes.json();
    assert(orderRes.status === 201, 'Order created successfully');
    const createdOrderId = orderData.data.id;

    // 8. Test GET /api/notifications
    console.log('\n--- 8. Testing GET /api/notifications ---');
    const notifRes = await fetch(`${BASE_URL}/api/notifications`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const notifData = await notifRes.json();
    assert(notifRes.status === 200, 'Get notifications returns 200');
    assert(notifData.success === true, 'Get notifications success is true');
    assert(Array.isArray(notifData.data.notifications), 'Notifications list is an array');
    assert(notifData.data.notifications.length > 0, 'Notifications list is populated with real backend records');
    const latestNotification = notifData.data.notifications[0];
    console.log(`Latest notification: "${latestNotification.title}" - ${latestNotification.message}`);

    // 9. Test GET /api/notifications/unread-count
    console.log('\n--- 9. Testing GET /api/notifications/unread-count ---');
    const countRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const countData = await countRes.json();
    assert(countRes.status === 200, 'Get unread-count returns 200');
    assert(typeof countData.data.count === 'number', 'Count is a number');
    console.log(`Current unread count: ${countData.data.count}`);

    // 10. Test PATCH /api/notifications/:id/read
    console.log('\n--- 10. Testing PATCH /api/notifications/:id/read ---');
    const markOneRes = await fetch(`${BASE_URL}/api/notifications/${latestNotification.id}/read`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const markOneData = await markOneRes.json();
    assert(markOneRes.status === 200, 'Mark single notification read returns 200');
    assert(markOneData.data.is_read === true, 'Notification is_read is now true');

    // 11. Test PATCH /api/notifications/read-all
    console.log('\n--- 11. Testing PATCH /api/notifications/read-all ---');
    const markAllRes = await fetch(`${BASE_URL}/api/notifications/read-all`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const markAllData = await markAllRes.json();
    assert(markAllRes.status === 200, 'Mark all notifications read returns 200');
    assert(typeof markAllData.data.updated_count === 'number', 'Updated count returned');

    // 12. Verify unread count is 0 after mark-all
    console.log('\n--- 12. Verifying Unread Count After Read-All ---');
    const verifyCountRes = await fetch(`${BASE_URL}/api/notifications/unread-count`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    const verifyCountData = await verifyCountRes.json();
    assert(verifyCountData.data.count === 0, 'Unread count is now 0');

    // 13. Test Non-Admin Role RBAC isolation
    console.log('\n--- 13. Testing Non-Admin Role RBAC Search & Notification Isolation ---');
    // Login as a non-admin staff member if one exists, or create one for test
    const staffLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'driver@company.com', password: 'password' })
    });
    const staffLoginData = await staffLoginRes.json();
    if (staffLoginData?.data?.token) {
      const driverToken = staffLoginData.data.token;
      const driverSearchRes = await fetch(`${BASE_URL}/api/search?q=admin`, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      const driverSearchData = await driverSearchRes.json();
      assert(driverSearchRes.status === 200, 'Driver search returns 200');
      // Driver should not have staff.view permission, so staff results must be empty
      assert(driverSearchData.data.staff.length === 0, 'Driver cannot view staff in search (RBAC protected)');

      const driverNotifRes = await fetch(`${BASE_URL}/api/notifications`, {
        headers: { Authorization: `Bearer ${driverToken}` }
      });
      const driverNotifData = await driverNotifRes.json();
      assert(driverNotifRes.status === 200, 'Driver notifications returns 200');
      // Verify driver does not receive admin's notifications
      const hasOtherStaffNotifs = driverNotifData.data.notifications.some(n => n.recipient_staff_id !== staffLoginData.data.user.id);
      assert(!hasOtherStaffNotifs, 'Driver only receives their own notifications');
    } else {
      console.log('ℹ️ Driver account not seeded, skipped non-admin sub-check');
    }

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');
  } catch (err) {
    console.error('Test execution error:', err);
  }
};

runTests();
