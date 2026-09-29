const BASE_URL = 'http://localhost:3000';

const runManufacturingTests = async () => {
  console.log('====================================================');
  console.log('STARTING MANUFACTURING AREA (PHASE 8) API TESTS');
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
    const token = loginData.data?.token;
    const adminStaffId = loginData.data?.user?.id;
    assert(token && token.length > 20, 'Admin token acquired');
    assert(adminStaffId != null, 'Admin staff ID present');

    // 2. Setup Test Product
    console.log('\n--- 2. Setting Up Test Product for Sector Assignment ---');
    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Motherboard Z790', type: 'Motherboard', price: 210.00, available_quantity: 30 })
    });
    const prodData = await prodRes.json();
    const productId = prodData.data.id;
    assert(prodRes.status === 201, 'Test Product created successfully');

    // 3. Create Manufacturing Assignment (POST /api/manufacturing)
    console.log('\n--- 3. Testing Create Assignment (POST /api/manufacturing) ---');
    const createRes1 = await fetch(`${BASE_URL}/api/manufacturing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        staff_id: adminStaffId,
        sector: 'PCB Assembly',
        product_id: productId,
        start_date: '2026-09-29',
        status: 'Working',
        shift: 'Day',
        notes: 'Lead engineer on line A'
      })
    });
    const createData1 = await createRes1.json();
    assert(createRes1.status === 201, 'Assignment 1 created with status 201', JSON.stringify(createData1));
    assert(createData1.success === true, 'Response indicates success', JSON.stringify(createData1));
    assert(createData1.data.sector === 'PCB Assembly', 'Sector is PCB Assembly');
    assert(createData1.data.shift === 'Day', 'Shift is Day');
    assert(Number(createData1.data.staff?.id) === Number(adminStaffId), 'Staff details included in response');
    assert(Number(createData1.data.product?.id) === Number(productId), 'Product details included in response');
    const assignment1Id = createData1.data.id;

    // Create a 2nd Assignment (Welding Sector)
    const createRes2 = await fetch(`${BASE_URL}/api/manufacturing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        staff_id: adminStaffId,
        sector: 'Chassis Welding',
        status: 'Working',
        shift: 'Night',
        notes: 'Overnight shift'
      })
    });
    const createData2 = await createRes2.json();
    assert(createRes2.status === 201, 'Assignment 2 created without product_id');
    const assignment2Id = createData2.data.id;

    // 4. Validation Failures
    console.log('\n--- 4. Testing Validation Failures ---');
    const missingSectorRes = await fetch(`${BASE_URL}/api/manufacturing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ staff_id: adminStaffId })
    });
    assert(missingSectorRes.status === 400, 'Rejects assignment without sector (400)');

    const invalidStaffRes = await fetch(`${BASE_URL}/api/manufacturing`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ staff_id: 999999, sector: 'Testing' })
    });
    assert(invalidStaffRes.status === 404, 'Rejects assignment with non-existent staff (404)');

    // 5. Get All Assignments (GET /api/manufacturing)
    console.log('\n--- 5. Testing List Assignments (GET /api/manufacturing) ---');
    const listRes = await fetch(`${BASE_URL}/api/manufacturing`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listData = await listRes.json();
    assert(listRes.status === 200, 'List assignments returned 200');
    assert(listData.data.total >= 2, `Total assignments is >= 2 (actual: ${listData.data.total})`);
    assert(Array.isArray(listData.data.assignments), 'Assignments is an array');

    // 6. Filter by Sector
    console.log('\n--- 6. Testing Filter by Sector & Shift ---');
    const filterSectorRes = await fetch(`${BASE_URL}/api/manufacturing?sector=PCB%20Assembly`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const filterSectorData = await filterSectorRes.json();
    assert(filterSectorData.data.assignments.every(a => a.sector === 'PCB Assembly'), 'Filtered correctly by sector');

    const filterShiftRes = await fetch(`${BASE_URL}/api/manufacturing?shift=Night`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const filterShiftData = await filterShiftRes.json();
    assert(filterShiftData.data.assignments.every(a => a.shift === 'Night'), 'Filtered correctly by shift');

    // 7. Get Single Assignment (GET /api/manufacturing/:id)
    console.log('\n--- 7. Testing Get Assignment by ID ---');
    const getRes = await fetch(`${BASE_URL}/api/manufacturing/${assignment1Id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'Get assignment by ID returned 200');
    assert(getData.data.id == assignment1Id, 'Returned correct assignment ID');
    assert(getData.data.product.name === 'Motherboard Z790', 'Associated product name matched');

    // 8. Update Assignment (PUT /api/manufacturing/:id)
    console.log('\n--- 8. Testing Update Assignment ---');
    const updateRes = await fetch(`${BASE_URL}/api/manufacturing/${assignment1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        status: 'Completed',
        notes: 'Shift completed with 100 units assembled'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update returned 200');
    assert(updateData.data.status === 'Completed', 'Status updated to Completed');
    assert(updateData.data.notes === 'Shift completed with 100 units assembled', 'Notes updated');

    // 9. Sector Summary Metrics (GET /api/manufacturing/summary)
    console.log('\n--- 9. Testing Sector Summary (GET /api/manufacturing/summary) ---');
    const summaryRes = await fetch(`${BASE_URL}/api/manufacturing/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200, 'Summary returned 200');
    assert(summaryData.data.totalAssignments >= 2, 'Summary includes total count');
    assert(typeof summaryData.data.bySector === 'object', 'Summary includes bySector breakdown');
    assert(typeof summaryData.data.byStatus === 'object', 'Summary includes byStatus breakdown');

    // 10. Delete Assignment (DELETE /api/manufacturing/:id)
    console.log('\n--- 10. Testing Delete Assignment ---');
    const deleteRes = await fetch(`${BASE_URL}/api/manufacturing/${assignment2Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(deleteRes.status === 200, 'Delete returned 200');

    const verifyDeleteRes = await fetch(`${BASE_URL}/api/manufacturing/${assignment2Id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(verifyDeleteRes.status === 404, 'Deleted assignment is no longer found (404)');

    // 11. Unauthenticated and Unauthorized checks
    console.log('\n--- 11. Testing Auth Protection ---');
    const unauthRes = await fetch(`${BASE_URL}/api/manufacturing`);
    assert(unauthRes.status === 401, 'Unauthenticated request rejected with 401');

  } catch (error) {
    console.error('Fatal error during manufacturing test execution:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`MANUFACTURING AREA TESTS SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
};

runManufacturingTests();
