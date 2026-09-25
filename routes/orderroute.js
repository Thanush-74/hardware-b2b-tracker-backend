const express = require("express");
const router = express.Router();
const orderController = require("../controllers/ordercontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/checkout", authenticate, orderController.checkout);
router.post("/", authenticate, orderController.create);
router.get("/my-orders", authenticate, orderController.getMyOrders);
router.get("/", authenticate, orderController.getAll);
router.get("/:id", authenticate, orderController.getById);
router.put("/:id/status", authenticate, authorize("admin", "manager", "operator"), orderController.updateStatus);
router.put("/:id/payment", authenticate, authorize("admin", "manager"), orderController.updatePayment);
router.post("/:id/cancel", authenticate, orderController.cancel);

module.exports = router;
