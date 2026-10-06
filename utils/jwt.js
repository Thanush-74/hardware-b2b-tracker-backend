const jwt = require('jsonwebtoken');
require('dotenv').config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL CONFIGURATION ERROR: JWT_SECRET environment variable is required in production mode.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || 'hardware_b2b_tracker_jwt_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

/**
 * Generate a JWT token for a given staff payload
 * @param {object} payload - e.g. { staff_id, role_id }
 * @returns {string}
 */
const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN
  });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} decoded token payload
 */
const verifyToken = (token) => {
  return jwt.verify(token, JWT_SECRET);
};

module.exports = {
  generateToken,
  verifyToken
};
