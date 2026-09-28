const { sequelize, Staff, Role, Screen, Permission, RolePermission } = require('../models');
const { hashPassword } = require('../utils/password');
const { generateToken, verifyToken } = require('../utils/jwt');
const requirePermission = require('../middlewares/permissionMiddleware');

const BASE_URL = 'http://localhost:3000';

const runTests = async () => {
  console.log('====================================================');
  console.log('STARTING LOGIN BACKEND FOUNDATION TESTS');
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
    // 1. Health check endpoint (GET /)
    console.log('\n--- 1. Testing GET / Root Health Check ---');
    const healthRes = await fetch(`${BASE_URL}/`);
    const healthData = await healthRes.json();
    assert(
      healthRes.status === 200 &&
      healthData.success === true &&
      healthData.message === 'Hardware B2B Tracker Backend is running',
      'GET / returns expected 200 response with status and message',
      JSON.stringify(healthData)
    );

    // 2. Admin Login - Successful
    console.log('\n--- 2. Testing Admin Login (POST /api/auth/login) ---');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'password'
      })
    });
    const adminLoginData = await adminLoginRes.json();
    assert(adminLoginRes.status === 200, 'Status is 200 OK');
    assert(adminLoginData.success === true, 'Response success is true');
    assert(adminLoginData.message === 'Login successful', 'Response message is "Login successful"');
    assert(typeof adminLoginData.data.token === 'string' && adminLoginData.data.token.length > 20, 'JWT token is generated and returned');
    assert(adminLoginData.data.user && adminLoginData.data.user.email === 'admin@company.com', 'User object contains email');
    assert(adminLoginData.data.user.role && adminLoginData.data.user.role.slug === 'admin', 'User role is Admin');
    assert(Array.isArray(adminLoginData.data.permissions) && adminLoginData.data.permissions.length > 0, `Permissions array returned (${adminLoginData.data.permissions.length} permissions)`);
    assert(Array.isArray(adminLoginData.data.screens) && adminLoginData.data.screens.length > 0, `Screens array returned (${adminLoginData.data.screens.length} screens)`);
    
    // Security checks on response
    assert(adminLoginData.data.user.password_hash === undefined, 'password_hash is NOT returned in user object');
    assert(JSON.stringify(adminLoginData).includes('password_hash') === false, 'password_hash is completely absent from entire response');
    assert(JSON.stringify(adminLoginData).includes('super_secret') === false, 'JWT secret is NOT exposed');

    // Structure of permission items
    const samplePerm = adminLoginData.data.permissions[0];
    assert(
      samplePerm && samplePerm.id !== undefined && samplePerm.name && samplePerm.slug && samplePerm.action,
      'Permission object has id, name, slug, and action fields',
      JSON.stringify(samplePerm)
    );

    // Structure of screen items
    const sampleScreen = adminLoginData.data.screens[0];
    assert(
      sampleScreen && sampleScreen.id !== undefined && sampleScreen.name && sampleScreen.slug && sampleScreen.route,
      'Screen object has id, name, slug, and route fields',
      JSON.stringify(sampleScreen)
    );

    // Verify JWT payload contents
    const decodedToken = verifyToken(adminLoginData.data.token);
    assert(decodedToken.staff_id !== undefined && decodedToken.role_id !== undefined, 'JWT payload contains staff_id and role_id');
    assert(decodedToken.permissions === undefined, 'JWT payload does NOT bloatedly contain permissions array');

    // 3. Invalid Email
    console.log('\n--- 3. Testing Invalid Email ---');
    const invalidEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'doesnotexist@company.com',
        password: 'password'
      })
    });
    const invalidEmailData = await invalidEmailRes.json();
    assert(invalidEmailRes.status === 401 && invalidEmailData.success === false, 'Invalid email returns 401 Unauthorized');

    // 4. Invalid Password
    console.log('\n--- 4. Testing Invalid Password ---');
    const invalidPasswordRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com',
        password: 'IncorrectPassword123!'
      })
    });
    const invalidPasswordData = await invalidPasswordRes.json();
    assert(invalidPasswordRes.status === 401 && invalidPasswordData.success === false, 'Invalid password returns 401 Unauthorized');

    // 5. Missing Fields Validation
    console.log('\n--- 5. Testing Missing Field Validations ---');
    const missingEmailRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        password: 'password'
      })
    });
    const missingEmailData = await missingEmailRes.json();
    assert(missingEmailRes.status === 400 && missingEmailData.success === false, 'Missing email returns 400 Bad Request');

    const missingPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@company.com'
      })
    });
    const missingPassData = await missingPassRes.json();
    assert(missingPassRes.status === 400 && missingPassData.success === false, 'Missing password returns 400 Bad Request');

    // 6. Inactive Staff Member Login Block (403)
    console.log('\n--- 6. Testing Inactive Staff Login (403 Forbidden) ---');
    const roles = await Role.findAll();
    const deliveryRole = roles.find(r => r.slug === 'delivery') || roles[0];

    const inactiveEmail = `inactive_staff_${Date.now()}@company.com`;
    const passwordHash = await hashPassword('password123');
    const inactiveStaff = await Staff.create({
      first_name: 'Inactive',
      last_name: 'User',
      email: inactiveEmail,
      password_hash: passwordHash,
      role_id: deliveryRole.id,
      is_active: false
    });

    const inactiveLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: inactiveEmail,
        password: 'password123'
      })
    });
    const inactiveLoginData = await inactiveLoginRes.json();
    assert(inactiveLoginRes.status === 403 && inactiveLoginData.success === false, 'Inactive staff login is rejected with 403 Forbidden');

    // Clean up temporary inactive staff test record
    await inactiveStaff.destroy();

    // 7. Testing Delivery Role Login & Screen / Permission Filtering
    console.log('\n--- 7. Testing Non-Admin Role Permissions & Screen Resolution ---');
    const activeDeliveryEmail = `delivery_test_${Date.now()}@company.com`;
    const deliveryStaff = await Staff.create({
      first_name: 'David',
      last_name: 'Delivery',
      email: activeDeliveryEmail,
      password_hash: passwordHash,
      role_id: deliveryRole.id,
      is_active: true
    });

    const deliveryLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: activeDeliveryEmail,
        password: 'password123'
      })
    });
    const deliveryLoginData = await deliveryLoginRes.json();
    assert(deliveryLoginRes.status === 200, 'Delivery staff login successful');
    assert(deliveryLoginData.data.user.role.slug === 'delivery', 'Role slug is delivery');
    
    const deliveryPermSlugs = deliveryLoginData.data.permissions.map(p => p.slug);
    assert(deliveryPermSlugs.includes('deliveries.view'), 'Delivery user has deliveries.view permission');
    assert(!deliveryPermSlugs.includes('staff.view'), 'Delivery user does NOT have staff.view permission');
    
    const deliveryScreenSlugs = deliveryLoginData.data.screens.map(s => s.slug);
    assert(deliveryScreenSlugs.includes('deliveries'), 'Delivery user received Deliveries screen');
    assert(!deliveryScreenSlugs.includes('staff'), 'Delivery user did NOT receive Staff screen');

    // Clean up test staff
    await deliveryStaff.destroy();

    // 8. Test Middleware Units
    console.log('\n--- 8. Testing Middleware Units ---');
    // Unit test permissionMiddleware logic
    const reqMockAdmin = { user: { role: { slug: 'admin' } }, permissionSlugs: [] };
    let nextCalled = false;
    const nextMock = () => { nextCalled = true; };
    const permMiddleware = requirePermission('inventory.view');
    permMiddleware(reqMockAdmin, {}, nextMock);
    assert(nextCalled === true, 'requirePermission middleware allows admin to bypass check');

    const reqMockNormalNoPerm = { user: { role: { slug: 'delivery' } }, permissionSlugs: ['deliveries.view'] };
    let forbiddenStatus = null;
    let forbiddenBody = null;
    const resMock = {
      status: (code) => {
        forbiddenStatus = code;
        return {
          json: (data) => { forbiddenBody = data; }
        };
      }
    };
    nextCalled = false;
    permMiddleware(reqMockNormalNoPerm, resMock, nextMock);
    assert(forbiddenStatus === 403 && nextCalled === false, 'requirePermission middleware blocks unauthorized user with 403');

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test execution failed with error:', err);
    process.exit(1);
  }
};

runTests();
