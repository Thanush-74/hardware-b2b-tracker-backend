const express = require("express");
const router = express.Router();
const dashboardController = require("../controllers/dashboardcontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.get("/overview", authenticate, dashboardController.getOverview);
router.get("/manufacturing", authenticate, authorize("admin", "manager", "operator"), dashboardController.getManufacturingMetrics);
router.get("/inventory", authenticate, authorize("admin", "manager"), dashboardController.getInventoryMetrics);
router.get("/quality", authenticate, authorize("admin", "manager", "inspector"), dashboardController.getQualityMetrics);
router.get("/logistics", authenticate, authorize("admin", "manager", "driver"), dashboardController.getLogisticsMetrics);

module.exports = router;
