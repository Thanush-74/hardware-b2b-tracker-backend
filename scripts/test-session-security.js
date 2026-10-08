const { generateToken, verifyToken, JWT_EXPIRES_IN } = require('../utils/jwt');
const authMiddleware = require('../middlewares/authMiddleware');
const jwt = require('jsonwebtoken');

const runSessionSecurityTests = async () => {
  console.log('====================================================');
  console.log('RUNNING JWT & SESSION SECURITY TESTS');
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
    // Test 1: JWT expiration configuration is '1d'
    assert(JWT_EXPIRES_IN === '1d', 'JWT_EXPIRES_IN default is configured to 1d', `Value: ${JWT_EXPIRES_IN}`);

    // Test 2: Generate token and verify duration is exactly 24 hours (86,400 seconds)
    const payload = { staff_id: 101, role_id: 2 };
    const token = generateToken(payload);
    const decoded = verifyToken(token);

    assert(Boolean(token && typeof token === 'string'), 'generateToken successfully produces a valid JWT');
    assert(decoded.staff_id === 101, 'Decoded token preserves staff_id claim');
    assert(decoded.role_id === 2, 'Decoded token preserves role_id claim');

    const durationSeconds = decoded.exp - decoded.iat;
    assert(
      durationSeconds === 86400,
      'JWT token lifetime is exactly 24 hours (86,400 seconds / 1 day)',
      `Actual: ${durationSeconds}s`
    );

    // Test 3: Expired token throws TokenExpiredError
    const secret = process.env.JWT_SECRET || 'hardware_b2b_tracker_jwt_secret_key';
    const expiredToken = jwt.sign({ staff_id: 101, role_id: 2 }, secret, { expiresIn: 0 });

    let expiredCaught = false;
    let expiredErrorName = '';
    try {
      verifyToken(expiredToken);
    } catch (err) {
      expiredCaught = true;
      expiredErrorName = err.name;
    }
    assert(expiredCaught && expiredErrorName === 'TokenExpiredError', 'verifyToken throws TokenExpiredError for expired token');

    // Test 4: authMiddleware handles expired token by returning 401
    const mockReqExpired = {
      headers: {
        authorization: `Bearer ${expiredToken}`
      }
    };
    let mockResStatus = null;
    let mockResJson = null;
    const mockRes = {
      status(code) {
        mockResStatus = code;
        return this;
      },
      json(body) {
        mockResJson = body;
        return this;
      }
    };
    let nextCalled = false;
    const mockNext = () => { nextCalled = true; };

    await authMiddleware(mockReqExpired, mockRes, mockNext);

    assert(mockResStatus === 401, 'authMiddleware returns HTTP 401 for expired token', `Status: ${mockResStatus}`);
    assert(
      mockResJson && mockResJson.message && mockResJson.message.includes('expired'),
      'authMiddleware returns token expiration message',
      `Message: ${JSON.stringify(mockResJson)}`
    );
    assert(!nextCalled, 'authMiddleware does not call next() for expired token');

    // Test 5: authMiddleware handles invalid/tampered token by returning 401
    const invalidToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature';
    const mockReqInvalid = {
      headers: {
        authorization: `Bearer ${invalidToken}`
      }
    };
    mockResStatus = null;
    mockResJson = null;
    await authMiddleware(mockReqInvalid, mockRes, mockNext);

    assert(mockResStatus === 401, 'authMiddleware returns HTTP 401 for invalid/tampered token');
    assert(
      mockResJson && mockResJson.message && mockResJson.message.includes('Invalid'),
      'authMiddleware returns invalid token error message'
    );

    // Test 6: authMiddleware handles missing authorization header
    const mockReqMissing = { headers: {} };
    mockResStatus = null;
    mockResJson = null;
    await authMiddleware(mockReqMissing, mockRes, mockNext);
    assert(mockResStatus === 401, 'authMiddleware returns HTTP 401 when Authorization header is missing');

    console.log('\n====================================================');
    console.log(`JWT & SECURITY TESTS SUMMARY: Passed: ${passed}, Failed: ${failed}`);
    console.log('====================================================');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('Unexpected error in test runner:', error);
    process.exit(1);
  }
};

runSessionSecurityTests();
