const express = require("express");
const router = express.Router();
const stockController = require("../controllers/stockcontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.get("/", authenticate, stockController.getAll);
router.get("/alerts/low", authenticate, stockController.getLowStock);
router.get("/movements", authenticate, stockController.getMovements);
router.get("/product/:productId", authenticate, stockController.getByProduct);
router.post("/adjust", authenticate, authorize("admin", "manager", "operator"), stockController.adjust);

module.exports = router;
