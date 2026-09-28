const express = require('express');
const router = express.Router();
const screenController = require('../controllers/screenController');
const authMiddleware = require('../middlewares/authMiddleware');

// All screen routes require authentication
router.use(authMiddleware);

// Get all screens
router.get('/', screenController.getAllScreens);

module.exports = router;
