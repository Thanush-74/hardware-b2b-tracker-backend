const express = require("express");
const router = express.Router();
const authController = require("../controllers/authcontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);
router.get("/users", authenticate, authorize("admin", "manager"), authController.getUsers);
router.put("/users/:id/role", authenticate, authorize("admin"), authController.updateRole);

module.exports = router;
