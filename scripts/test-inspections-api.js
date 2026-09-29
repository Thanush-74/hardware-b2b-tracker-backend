const BASE_URL = 'http://localhost:3000';

const runInspectionTests = async () => {
  console.log('====================================================');
  console.log('STARTING QUALITY INSPECTION MODULE (PHASE 10) TESTS');
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
    console.log('\n--- 2. Setting Up Test Product for Inspection ---');
    const prodRes = await fetch(`${BASE_URL}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ name: 'Graphics Card RTX 4080', type: 'GPU', price: 950.00, available_quantity: 40 })
    });
    const prodData = await prodRes.json();
    const productId = prodData.data.id;
    assert(prodRes.status === 201, 'Test Product created successfully');

    // 3. Create Inspection Records (POST /api/inspections)
    console.log('\n--- 3. Testing Create Inspections (POST /api/inspections) ---');
    const inspRes1 = await fetch(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        inspector_id: adminStaffId,
        product_id: productId,
        item_type: 'Finished Good',
        batch_number: 'BATCH-GPU-2026-A',
        quantity_inspected: 50,
        passed_quantity: 48,
        failed_quantity: 2,
        result: 'Approved',
        defect_type: 'Solder Bridge',
        severity: 'Medium',
        notes: '2 units failed thermal stress test due to solder bridge on VRAM'
      })
    });
    const inspData1 = await inspRes1.json();
    assert(inspRes1.status === 201, 'Inspection 1 created with status 201', JSON.stringify(inspData1));
    assert(inspData1.data.result === 'Approved', 'Result is Approved');
    assert(inspData1.data.quantity_inspected === 50, 'Quantity inspected is 50');
    assert(inspData1.data.passed_quantity === 48, 'Passed quantity is 48');
    assert(inspData1.data.failed_quantity === 2, 'Failed quantity is 2');
    assert(Number(inspData1.data.inspector?.id) === Number(adminStaffId), 'Inspector details returned');
    assert(Number(inspData1.data.product?.id) === Number(productId), 'Product details returned');
    const inspection1Id = inspData1.data.id;

    // Create 2nd Inspection (Defective item)
    const inspRes2 = await fetch(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        inspector_id: adminStaffId,
        product_id: productId,
        item_type: 'Returned Hardware',
        batch_number: 'RET-GPU-991',
        quantity_inspected: 5,
        passed_quantity: 1,
        failed_quantity: 4,
        result: 'Defective',
        defect_type: 'Burn Mark',
        severity: 'Critical',
        notes: 'Severe power surge burn marks on VRM'
      })
    });
    const inspData2 = await inspRes2.json();
    assert(inspRes2.status === 201, 'Inspection 2 created with status 201');
    const inspection2Id = inspData2.data.id;

    // 4. Validation Failures
    console.log('\n--- 4. Testing Validation Failures ---');
    const invalidInspectorRes = await fetch(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ inspector_id: 999999, quantity_inspected: 10 })
    });
    assert(invalidInspectorRes.status === 404, 'Rejects non-existent inspector (404)');

    const invalidQuantityRes = await fetch(`${BASE_URL}/api/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ inspector_id: adminStaffId, quantity_inspected: 0 })
    });
    assert(invalidQuantityRes.status === 400, 'Rejects quantity < 1 (400)');

    // 5. List Inspections with Filters (GET /api/inspections)
    console.log('\n--- 5. Testing List & Filtering ---');
    const listAllRes = await fetch(`${BASE_URL}/api/inspections`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listAllData = await listAllRes.json();
    assert(listAllRes.status === 200, 'List all inspections returned 200');
    assert(listAllData.data.total >= 2, 'Total inspections >= 2');
    assert(Array.isArray(listAllData.data.inspections), 'Inspections is array');

    // Filter by Result
    const listApprovedRes = await fetch(`${BASE_URL}/api/inspections?result=Approved`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listApprovedData = await listApprovedRes.json();
    assert(listApprovedData.data.inspections.every(i => i.result === 'Approved'), 'Filter by result=Approved verified');

    // Filter by Severity
    const listCriticalRes = await fetch(`${BASE_URL}/api/inspections?severity=Critical`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listCriticalData = await listCriticalRes.json();
    assert(listCriticalData.data.inspections.every(i => i.severity === 'Critical'), 'Filter by severity=Critical verified');

    // 6. Get Single Inspection (GET /api/inspections/:id)
    console.log('\n--- 6. Testing Get Inspection by ID ---');
    const getRes = await fetch(`${BASE_URL}/api/inspections/${inspection1Id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'Get by ID returned 200');
    assert(Number(getData.data.id) === Number(inspection1Id), 'Returned correct inspection ID');
    assert(getData.data.batch_number === 'BATCH-GPU-2026-A', 'Batch number matched');

    // 7. Update Inspection (PUT /api/inspections/:id)
    console.log('\n--- 7. Testing Update Inspection ---');
    const updateRes = await fetch(`${BASE_URL}/api/inspections/${inspection1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        passed_quantity: 49,
        failed_quantity: 1,
        notes: '1 unit repaired on-site by rework station'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update returned 200');
    assert(updateData.data.passed_quantity === 49, 'Updated passed_quantity reflected');
    assert(updateData.data.notes === '1 unit repaired on-site by rework station', 'Updated notes reflected');

    // 8. Quality Summary & Pass Rate (GET /api/inspections/summary)
    console.log('\n--- 8. Testing Quality Summary & Pass Rate ---');
    const summaryRes = await fetch(`${BASE_URL}/api/inspections/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200, 'Summary endpoint returned 200');
    assert(summaryData.data.totalReports >= 2, 'Total reports count is correct');
    assert(summaryData.data.totalInspected >= 55, 'Total inspected units calculated');
    assert(summaryData.data.totalPassed >= 50, 'Total passed units calculated');
    assert(typeof summaryData.data.passRatePercentage === 'number', 'Pass rate is numeric');
    assert(summaryData.data.byResult['Approved'] != null, 'Approved breakdown present');
    assert(summaryData.data.byDefect['Solder Bridge'] != null, 'Defect breakdown present');
    assert(summaryData.data.bySeverity['Critical'] != null, 'Severity breakdown present');

    // 9. Delete Inspection (DELETE /api/inspections/:id)
    console.log('\n--- 9. Testing Delete Inspection ---');
    const deleteRes = await fetch(`${BASE_URL}/api/inspections/${inspection2Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(deleteRes.status === 200, 'Delete returned 200');

    const verifyDeleteRes = await fetch(`${BASE_URL}/api/inspections/${inspection2Id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(verifyDeleteRes.status === 404, 'Deleted inspection not found (404)');

    // 10. Auth Protection
    console.log('\n--- 10. Testing Auth Protection ---');
    const unauthRes = await fetch(`${BASE_URL}/api/inspections`);
    assert(unauthRes.status === 401, 'Unauthenticated request returns 401');

  } catch (error) {
    console.error('Fatal error during inspection test execution:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`QUALITY INSPECTION TESTS SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
};

runInspectionTests();
