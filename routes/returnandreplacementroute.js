const express = require("express");
const router = express.Router();
const returnController = require("../controllers/returnandreplacementcontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, returnController.create);
router.get("/my-returns", authenticate, returnController.getMyReturns);
router.get("/", authenticate, returnController.getAll);
router.get("/:id", authenticate, returnController.getById);
router.put("/:id/status", authenticate, authorize("admin", "manager", "inspector"), returnController.updateStatus);

module.exports = router;
