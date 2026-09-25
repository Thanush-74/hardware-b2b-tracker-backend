const express = require("express");
const router = express.Router();
const manufacturingController = require("../controllers/manufactouringcontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager"), manufacturingController.create);
router.get("/", authenticate, manufacturingController.getAll);
router.get("/:id", authenticate, manufacturingController.getById);
router.put("/:id/status", authenticate, authorize("admin", "manager", "operator"), manufacturingController.updateStatus);
router.post("/:id/output", authenticate, authorize("admin", "manager", "operator"), manufacturingController.recordOutput);
router.put("/:id/assign", authenticate, authorize("admin", "manager"), manufacturingController.assign);

module.exports = router;
