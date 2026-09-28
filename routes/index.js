const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const staffRoutes = require('./staffRoutes');
const roleRoutes = require('./roleRoutes');
const screenRoutes = require('./screenRoutes');
const permissionRoutes = require('./permissionRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/roles', roleRoutes);
router.use('/screens', screenRoutes);
router.use('/permissions', permissionRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);

module.exports = router;
