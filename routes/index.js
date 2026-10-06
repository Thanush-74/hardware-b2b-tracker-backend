const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const staffRoutes = require('./staffRoutes');
const roleRoutes = require('./roleRoutes');
const screenRoutes = require('./screenRoutes');
const permissionRoutes = require('./permissionRoutes');
const productRoutes = require('./productRoutes');
const cartRoutes = require('./cartRoutes');
const inventoryRoutes = require('./inventoryRoutes');
const productionRoutes = require('./productionRoutes');
const orderRoutes = require('./orderRoutes');
const deliveryRoutes = require('./deliveryRoutes');
const returnRoutes = require('./returnRoutes');
const manufacturingRoutes = require('./manufacturingRoutes');
const expenseRoutes = require('./expenseRoutes');
const inspectionRoutes = require('./inspectionRoutes');
const searchRoutes = require('./searchRoutes');
const notificationRoutes = require('./notificationRoutes');

// Mount sub-routes
router.use('/auth', authRoutes);
router.use('/staff', staffRoutes);
router.use('/roles', roleRoutes);
router.use('/screens', screenRoutes);
router.use('/permissions', permissionRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/production', productionRoutes);
router.use('/orders', orderRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/returns', returnRoutes);
router.use('/manufacturing', manufacturingRoutes);
router.use('/expenses', expenseRoutes);
router.use('/inspections', inspectionRoutes);
router.use('/search', searchRoutes);
router.use('/notifications', notificationRoutes);

module.exports = router;
