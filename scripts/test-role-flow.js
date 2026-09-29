const http = require('http');
const app = require('../server');
const { Role, Staff, Permission, RolePermission, Screen } = require('../models');

const runRoleFlowTests = async () => {
  console.log('====================================================');
  console.log('STARTING ROLE CREATION & PERMISSION FLOW TESTS');
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

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://localhost:${port}`;

  const testSuffix = Date.now();
  let createdRoleId = null;
  let createdStaffId = null;

  try {
    // 1. Admin login to get admin token
    console.log('--- 1. Authenticating as Admin ---');
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'password'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    const adminToken = adminLoginData.data?.token;
    assert(adminLoginRes.status === 200 && adminToken, 'Admin login successful');

    // 2. Test Validation on Role Creation
    console.log('\n--- 2. Testing Role Creation Validations ---');
    
    // Missing role name
    const missingNameRes = await fetch(`${baseUrl}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        slug: `mgr_${testSuffix}`,
        screens: ['Product']
      })
    });
    const missingNameData = await missingNameRes.json();
    assert(missingNameRes.status === 400 && missingNameData.success === false, 'Missing role name rejected with 400');

    // Missing role slug
    const missingSlugRes = await fetch(`${baseUrl}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Role',
        screens: ['Product']
      })
    });
    const missingSlugData = await missingSlugRes.json();
    assert(missingSlugRes.status === 400 && missingSlugData.success === false, 'Missing role slug rejected with 400');

    // Invalid screen identifier
    const invalidScreenRes = await fetch(`${baseUrl}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Test Role',
        slug: `invalid_screen_role_${testSuffix}`,
        screens: ['NonExistentScreenXYZ']
      })
    });
    const invalidScreenData = await invalidScreenRes.json();
    assert(invalidScreenRes.status === 400 && invalidScreenData.success === false, 'Invalid screen rejected with 400');

    // 3. STEP 1-3: Admin creates role "Manager" with selected screens: Product, Inventory, Production, Customer Orders
    console.log('\n--- 3. Testing Role Creation (POST /api/roles) ---');
    const managerRoleSlug = `manager_${testSuffix}`;
    const createRoleRes = await fetch(`${baseUrl}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Manager',
        slug: managerRoleSlug,
        description: 'Manager role with store & production management access',
        screens: ['Product', 'Inventory', 'Production', 'Customer Orders']
      })
    });
    const createRoleData = await createRoleRes.json();
    assert(createRoleRes.status === 201 && createRoleData.success === true, 'Role created successfully with 201 Created');
    assert(createRoleData.data.name === 'Manager', 'Created role name matches "Manager"');
    assert(createRoleData.data.slug === managerRoleSlug, 'Created role slug matches');
    
    createdRoleId = createRoleData.data.id;
    const assignedPermissions = createRoleData.data.permissions || [];
    assert(assignedPermissions.length > 0, `Role has ${assignedPermissions.length} permissions assigned`);

    const assignedScreenSlugs = new Set(assignedPermissions.map(p => p.screen?.slug || p.slug.split('.')[0]));
    assert(
      assignedScreenSlugs.has('products') &&
      assignedScreenSlugs.has('inventory') &&
      assignedScreenSlugs.has('production') &&
      assignedScreenSlugs.has('orders'),
      'Assigned permissions include Product, Inventory, Production, and Orders screens'
    );
    assert(!assignedScreenSlugs.has('cart'), 'Manager role does NOT have Cart screen');
    assert(!assignedScreenSlugs.has('expenses'), 'Manager role does NOT have Expenses screen');

    // Duplicate slug check (409)
    const duplicateSlugRes = await fetch(`${baseUrl}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Manager Duplicate',
        slug: managerRoleSlug,
        screens: ['Product']
      })
    });
    assert(duplicateSlugRes.status === 409, 'Duplicate role slug rejected with 409 Conflict');

    // 4. STEP 4: Create a staff member with Manager role
    console.log('\n--- 4. Assigning Staff Member to Manager Role ---');
    const managerEmail = `manager_${testSuffix}@company.com`;
    const createStaffRes = await fetch(`${baseUrl}/api/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        first_name: 'Alice',
        last_name: 'Manager',
        email: managerEmail,
        password: 'password123',
        role_id: createdRoleId
      })
    });
    const createStaffData = await createStaffRes.json();
    assert(createStaffRes.status === 201 && createStaffData.success === true, 'Staff member created and assigned to Manager role');
    createdStaffId = createStaffData.data.id;

    // 5. STEP 5 & 6: Manager logs in & receives assigned screens
    console.log('\n--- 5. Testing Manager Login & Screen Resolution ---');
    const managerLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: managerEmail,
        password: 'password123'
      })
    });
    const managerLoginData = await managerLoginRes.json();
    assert(managerLoginRes.status === 200, 'Manager login returns 200 OK');
    
    const managerScreens = managerLoginData.data.screens || [];
    const managerScreenNames = managerScreens.map(s => s.name);
    const managerScreenSlugs = managerScreens.map(s => s.slug);
    console.log('Manager Screens Received:', managerScreenNames);

    assert(managerScreenSlugs.includes('products'), 'Manager login includes Products screen');
    assert(managerScreenSlugs.includes('inventory'), 'Manager login includes Inventory screen');
    assert(managerScreenSlugs.includes('production'), 'Manager login includes Production screen');
    assert(managerScreenSlugs.includes('orders'), 'Manager login includes Orders screen');

    assert(!managerScreenSlugs.includes('cart'), 'Manager login does NOT include Cart screen');
    assert(!managerScreenSlugs.includes('expenses'), 'Manager login does NOT include Expenses screen');
    assert(!managerScreenSlugs.includes('inspection'), 'Manager login does NOT include Inspection screen');
    assert(!managerScreenSlugs.includes('deliveries'), 'Manager login does NOT include Deliveries screen');

    const managerToken = managerLoginData.data.token;
    assert(managerToken && managerToken.length > 20, 'Manager JWT token obtained');

    // 6. STEP 7: Manager can access permitted module APIs
    console.log('\n--- 6. Testing Permitted API Access for Manager ---');
    const productAccessRes = await fetch(`${baseUrl}/api/products`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(productAccessRes.status === 200, 'Manager can access GET /api/products (200 OK)');

    const inventoryAccessRes = await fetch(`${baseUrl}/api/inventory`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(inventoryAccessRes.status === 200, 'Manager can access GET /api/inventory (200 OK)');

    const productionAccessRes = await fetch(`${baseUrl}/api/production`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(productionAccessRes.status === 200, 'Manager can access GET /api/production (200 OK)');

    const ordersAccessRes = await fetch(`${baseUrl}/api/orders`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(ordersAccessRes.status === 200, 'Manager can access GET /api/orders (200 OK)');

    // 7. STEP 8: Manager is BLOCKED from unassigned module APIs
    console.log('\n--- 7. Testing Forbidden API Access for Manager ---');
    const cartAccessRes = await fetch(`${baseUrl}/api/cart`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(cartAccessRes.status === 403, 'Manager is blocked from GET /api/cart (403 Forbidden)');

    const expensesAccessRes = await fetch(`${baseUrl}/api/expenses`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(expensesAccessRes.status === 403, 'Manager is blocked from GET /api/expenses (403 Forbidden)');

    const inspectionAccessRes = await fetch(`${baseUrl}/api/inspections`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(inspectionAccessRes.status === 403, 'Manager is blocked from GET /api/inspections (403 Forbidden)');

    const deliveriesAccessRes = await fetch(`${baseUrl}/api/deliveries`, {
      headers: { 'Authorization': `Bearer ${managerToken}` }
    });
    assert(deliveriesAccessRes.status === 403, 'Manager is blocked from GET /api/deliveries (403 Forbidden)');

    // 8. STEP 9: Test Cart Permission Separately
    console.log('\n--- 8. Testing Cart Permissions Separately ---');
    // Create a role with ONLY Cart screen
    const cartRoleSlug = `cart_user_${testSuffix}`;
    const createCartRoleRes = await fetch(`${baseUrl}/api/roles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        name: 'Cart Specialist',
        slug: cartRoleSlug,
        screens: ['Cart']
      })
    });
    const createCartRoleData = await createCartRoleRes.json();
    assert(createCartRoleRes.status === 201, 'Cart Specialist role created');

    const cartStaffEmail = `cart_staff_${testSuffix}@company.com`;
    const createCartStaffRes = await fetch(`${baseUrl}/api/staff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        first_name: 'Charlie',
        last_name: 'Cart',
        email: cartStaffEmail,
        password: 'password123',
        role_id: createCartRoleData.data.id
      })
    });
    const createCartStaffData = await createCartStaffRes.json();
    assert(createCartStaffRes.status === 201, 'Cart staff created');

    const cartLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: cartStaffEmail,
        password: 'password123'
      })
    });
    const cartLoginData = await cartLoginRes.json();
    const cartUserToken = cartLoginData.data?.token;
    assert(cartLoginRes.status === 200, 'Cart staff login successful');
    assert(cartLoginData.data.screens.some(s => s.slug === 'cart'), 'Cart staff receives Cart screen');

    // Cart user CAN access GET /api/cart
    const cartGetRes = await fetch(`${baseUrl}/api/cart`, {
      headers: { 'Authorization': `Bearer ${cartUserToken}` }
    });
    assert(cartGetRes.status === 200, 'Cart staff CAN access GET /api/cart (200 OK)');

    // Cart user CANNOT access GET /api/products
    const cartUserProductRes = await fetch(`${baseUrl}/api/products`, {
      headers: { 'Authorization': `Bearer ${cartUserToken}` }
    });
    assert(cartUserProductRes.status === 403, 'Cart staff CANNOT access GET /api/products (403 Forbidden)');

    // 9. Clean up test records
    console.log('\n--- 9. Cleaning up test records ---');
    if (createdStaffId) await Staff.destroy({ where: { id: createdStaffId } });
    if (createCartStaffData.data?.id) await Staff.destroy({ where: { id: createCartStaffData.data.id } });
    if (createdRoleId) {
      await RolePermission.destroy({ where: { role_id: createdRoleId } });
      await Role.destroy({ where: { id: createdRoleId } });
    }
    if (createCartRoleData.data?.id) {
      await RolePermission.destroy({ where: { role_id: createCartRoleData.data.id } });
      await Role.destroy({ where: { id: createCartRoleData.data.id } });
    }
    console.log('Cleanup completed successfully.');

    console.log('\n====================================================');
    console.log(`ROLE FLOW TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    server.close();
    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed:', err);
    server.close();
    process.exit(1);
  }
};

runRoleFlowTests();
