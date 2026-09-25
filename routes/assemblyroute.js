const express = require("express");
const router = express.Router();
const assemblyController = require("../controllers/assemblycontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager", "operator"), assemblyController.create);
router.get("/", authenticate, assemblyController.getAll);
router.get("/:id", authenticate, assemblyController.getById);
router.put("/:id", authenticate, authorize("admin", "manager", "operator"), assemblyController.update);
router.put("/:id/status", authenticate, authorize("admin", "manager", "operator"), assemblyController.updateStatus);
router.put("/:id/assign", authenticate, authorize("admin", "manager"), assemblyController.assignOperator);

module.exports = router;
