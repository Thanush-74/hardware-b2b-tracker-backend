const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All order routes require authentication
router.use(authMiddleware);

// Create new customer order (requires orders.create)
router.post('/', requirePermission('orders.create'), orderController.createOrder);

// View all customer orders (requires orders.view)
router.get('/', requirePermission('orders.view'), orderController.getAllOrders);

// View single customer order by ID or order_number (requires orders.view)
router.get('/:id', requirePermission('orders.view'), orderController.getOrderById);

// Update general order info (requires orders.edit)
router.put('/:id', requirePermission('orders.edit'), orderController.updateOrder);

// Update order status (requires orders.edit)
router.patch('/:id/status', requirePermission('orders.edit'), orderController.updateOrderStatus);

// Update payment status (requires orders.edit)
router.patch('/:id/payment', requirePermission('orders.edit'), orderController.updatePaymentStatus);

module.exports = router;
