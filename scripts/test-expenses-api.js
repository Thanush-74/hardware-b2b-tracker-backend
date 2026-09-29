const BASE_URL = 'http://localhost:3000';

const runExpenseTests = async () => {
  console.log('====================================================');
  console.log('STARTING EXPENSE & FINANCIALS MODULE (PHASE 9) TESTS');
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

    // 2. Create Expense Records (POST /api/expenses)
    console.log('\n--- 2. Testing Create Expenses & Revenues (POST /api/expenses) ---');
    const expenseRes1 = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Factory Electricity Bill - Sept',
        type: 'Expense',
        category: 'Utilities',
        amount: 1450.50,
        date: '2026-09-15',
        payment_method: 'Bank Transfer',
        reference_no: 'INV-ELEC-9021',
        notes: 'Monthly power consumption for assembly line'
      })
    });
    const expenseData1 = await expenseRes1.json();
    assert(expenseRes1.status === 201, 'Expense 1 created with status 201', JSON.stringify(expenseData1));
    assert(expenseData1.data.type === 'Expense', 'Type is Expense');
    assert(parseFloat(expenseData1.data.amount) === 1450.50, 'Amount is 1450.50');
    assert(expenseData1.data.category === 'Utilities', 'Category is Utilities');
    const expense1Id = expenseData1.data.id;

    // Create Income Record
    const incomeRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Wholesale Hardware Batch Sale',
        type: 'Income',
        category: 'Sales Revenue',
        amount: 9800.00,
        date: '2026-09-20',
        payment_method: 'Bank Transfer',
        reference_no: 'REC-SALE-4412',
        notes: 'Advance payment for enterprise order'
      })
    });
    const incomeData = await incomeRes.json();
    assert(incomeRes.status === 201, 'Income created with status 201');
    assert(incomeData.data.type === 'Income', 'Type is Income');
    assert(parseFloat(incomeData.data.amount) === 9800.00, 'Income amount is 9800.00');
    const incomeId = incomeData.data.id;

    // Create 3rd Record (Raw Materials)
    const expenseRes2 = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Copper Coil & Capacitor Supplies',
        type: 'Expense',
        category: 'Raw Materials',
        amount: 2300.00,
        date: '2026-09-22',
        payment_method: 'Cheque',
        reference_no: 'CHQ-77821'
      })
    });
    const expenseData2 = await expenseRes2.json();
    assert(expenseRes2.status === 201, 'Expense 2 (Raw Materials) created');
    const expense2Id = expenseData2.data.id;

    // 3. Validation Failures
    console.log('\n--- 3. Testing Validation Failures ---');
    const missingTitleRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ amount: 100, category: 'General' })
    });
    assert(missingTitleRes.status === 400, 'Rejects expense without title (400)');

    const negativeAmountRes = await fetch(`${BASE_URL}/api/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ title: 'Invalid amount', category: 'General', amount: -50 })
    });
    assert(negativeAmountRes.status === 400, 'Rejects negative amount (400)');

    // 4. List Expenses with Filters (GET /api/expenses)
    console.log('\n--- 4. Testing List & Filtering ---');
    const listAllRes = await fetch(`${BASE_URL}/api/expenses`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listAllData = await listAllRes.json();
    assert(listAllRes.status === 200, 'List all returned 200');
    assert(listAllData.data.total >= 3, 'Total records >= 3');
    assert(Array.isArray(listAllData.data.expenses), 'Expenses is array');

    // Filter by Type
    const listIncomeRes = await fetch(`${BASE_URL}/api/expenses?type=Income`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listIncomeData = await listIncomeRes.json();
    assert(listIncomeData.data.expenses.every(e => e.type === 'Income'), 'Filter by type=Income verified');

    // Filter by Category
    const listUtilRes = await fetch(`${BASE_URL}/api/expenses?category=Utilities`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const listUtilData = await listUtilRes.json();
    assert(listUtilData.data.expenses.every(e => e.category === 'Utilities'), 'Filter by category=Utilities verified');

    // 5. Get Single Expense (GET /api/expenses/:id)
    console.log('\n--- 5. Testing Get Expense by ID ---');
    const getRes = await fetch(`${BASE_URL}/api/expenses/${expense1Id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const getData = await getRes.json();
    assert(getRes.status === 200, 'Get by ID returned 200');
    assert(Number(getData.data.id) === Number(expense1Id), 'Returned correct expense ID');
    assert(getData.data.title === 'Factory Electricity Bill - Sept', 'Returned correct title');
    assert(getData.data.staff != null, 'Associated staff details present');

    // 6. Update Expense (PUT /api/expenses/:id)
    console.log('\n--- 6. Testing Update Expense ---');
    const updateRes = await fetch(`${BASE_URL}/api/expenses/${expense1Id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        amount: 1520.00,
        notes: 'Adjusted for late night shift power surge'
      })
    });
    const updateData = await updateRes.json();
    assert(updateRes.status === 200, 'Update returned 200');
    assert(parseFloat(updateData.data.amount) === 1520.00, 'Updated amount reflected (1520.00)');
    assert(updateData.data.notes === 'Adjusted for late night shift power surge', 'Updated notes reflected');

    // 7. Get Financial Summary & Balance (GET /api/expenses/summary)
    console.log('\n--- 7. Testing Financial Summary & Balance Calculations ---');
    const summaryRes = await fetch(`${BASE_URL}/api/expenses/summary`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const summaryData = await summaryRes.json();
    assert(summaryRes.status === 200, 'Summary endpoint returned 200');
    assert(summaryData.data.totalIncome >= 9800.00, 'Total income calculated correctly');
    assert(summaryData.data.totalExpense >= 3820.00, 'Total expenses calculated correctly');
    assert(typeof summaryData.data.netBalance === 'number', 'Net balance is numeric');
    assert(summaryData.data.netBalance === parseFloat((summaryData.data.totalIncome - summaryData.data.totalExpense).toFixed(2)), 'Net balance math verified (Income - Expense)');
    assert(summaryData.data.byCategory['Utilities'] != null, 'Utilities category breakdown present');
    assert(summaryData.data.byCategory['Sales Revenue'] != null, 'Sales Revenue category breakdown present');

    // 8. Delete Expense (DELETE /api/expenses/:id)
    console.log('\n--- 8. Testing Delete Expense ---');
    const deleteRes = await fetch(`${BASE_URL}/api/expenses/${expense2Id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(deleteRes.status === 200, 'Delete returned 200');

    const verifyDeleteRes = await fetch(`${BASE_URL}/api/expenses/${expense2Id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    assert(verifyDeleteRes.status === 404, 'Deleted expense is not found (404)');

    // 9. Auth Protection
    console.log('\n--- 9. Testing Auth Protection ---');
    const unauthRes = await fetch(`${BASE_URL}/api/expenses`);
    assert(unauthRes.status === 401, 'Unauthenticated request returns 401');

  } catch (error) {
    console.error('Fatal error during expense test execution:', error);
    failed++;
  }

  console.log('\n====================================================');
  console.log(`EXPENSES & FINANCIALS TESTS SUMMARY: Passed: ${passed}, Failed: ${failed}`);
  console.log('====================================================');
  if (failed > 0) process.exit(1);
};

runExpenseTests();
