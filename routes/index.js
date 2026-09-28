const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const staffRoutes = require('./staffRoutes');
const roleRoutes = require('./roleRoutes');
const screenRoutes = require('./screenRoutes');
const permissionRoutes = require('./permissionRoutes');

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/roles', roleRoutes);
router.use('/screens', screenRoutes);
router.use('/permissions', permissionRoutes);

module.exports = router;
