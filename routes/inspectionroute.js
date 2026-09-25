const express = require("express");
const router = express.Router();
const inspectionController = require("../controllers/inspectioncontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager", "inspector"), inspectionController.create);
router.get("/", authenticate, inspectionController.getAll);
router.get("/entity/:entity_type/:entity_id", authenticate, inspectionController.getByEntity);
router.get("/:id", authenticate, inspectionController.getById);
router.put("/:id/status", authenticate, authorize("admin", "manager", "inspector"), inspectionController.updateStatus);

module.exports = router;
