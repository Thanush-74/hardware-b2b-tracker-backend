const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All cart routes require authentication
router.use(authMiddleware);

// Get cart contents and total (requires cart.view permission)
router.get('/', requirePermission('cart.view'), cartController.getCart);

// Add item to cart (requires cart.edit permission)
router.post('/', requirePermission('cart.edit'), cartController.addToCart);

// Clear entire cart (requires cart.edit permission)
router.delete('/', requirePermission('cart.edit'), cartController.clearCart);
router.post('/clear', requirePermission('cart.edit'), cartController.clearCart);

// Update specific item quantity (requires cart.edit permission)
router.put('/:id', requirePermission('cart.edit'), cartController.updateCartItem);

// Remove specific item from cart (requires cart.edit permission)
router.delete('/:id', requirePermission('cart.edit'), cartController.removeCartItem);

module.exports = router;
