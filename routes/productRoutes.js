const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const authMiddleware = require('../middlewares/authMiddleware');
const requirePermission = require('../middlewares/permissionMiddleware');

// All product routes require authentication
router.use(authMiddleware);

// Create product (requires products.create permission)
router.post('/', requirePermission('products.create'), productController.createProduct);

// View all products (requires products.view permission)
router.get('/', requirePermission('products.view'), productController.getAllProducts);

// View single product (requires products.view permission)
router.get('/:id', requirePermission('products.view'), productController.getProductById);

// Update product (requires products.edit permission)
router.put('/:id', requirePermission('products.edit'), productController.updateProduct);

// Deactivate/delete product (requires products.delete permission)
router.delete('/:id', requirePermission('products.delete'), productController.deleteProduct);

module.exports = router;
