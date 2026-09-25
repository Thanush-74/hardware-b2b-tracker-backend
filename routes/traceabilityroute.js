const express = require("express");
const router = express.Router();
const traceabilityController = require("../controllers/traceabilitycontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager", "operator"), traceabilityController.create);
router.get("/", authenticate, traceabilityController.getAll);
router.get("/serial/:serialNumber", authenticate, traceabilityController.getBySerial);
router.get("/batch/:batchNumber", authenticate, traceabilityController.getByBatch);
router.post("/serial/:serialNumber/checkpoint", authenticate, authorize("admin", "manager", "operator", "inspector", "driver"), traceabilityController.addCheckpoint);

module.exports = router;
