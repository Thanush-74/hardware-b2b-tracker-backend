const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cartController');
const authMiddleware = require('../middlewares/authMiddleware');

// All cart routes require authentication
router.use(authMiddleware);

// Get cart contents and total
router.get('/', cartController.getCart);

// Add item to cart
router.post('/', cartController.addToCart);

// Clear entire cart
router.delete('/', cartController.clearCart);
router.post('/clear', cartController.clearCart);

// Update specific item quantity
router.put('/:id', cartController.updateCartItem);

// Remove specific item from cart
router.delete('/:id', cartController.removeCartItem);

module.exports = router;
