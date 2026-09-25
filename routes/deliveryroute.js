const express = require("express");
const router = express.Router();
const deliveryController = require("../controllers/deliverycontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager"), deliveryController.create);
router.get("/track/:trackingNumber", deliveryController.getByTracking);
router.get("/", authenticate, deliveryController.getAll);
router.get("/:id", authenticate, deliveryController.getById);
router.put("/:id/status", authenticate, authorize("admin", "manager", "driver"), deliveryController.updateStatus);
router.put("/:id/assign-driver", authenticate, authorize("admin", "manager"), deliveryController.assignDriver);

module.exports = router;
