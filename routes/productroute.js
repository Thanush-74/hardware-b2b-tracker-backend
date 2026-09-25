const express = require("express");
const router = express.Router();
const productController = require("../controllers/productcontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager"), productController.create);
router.get("/", productController.getAll);
router.get("/category/:category", productController.getByCategory);
router.get("/:id", productController.getById);
router.put("/:id", authenticate, authorize("admin", "manager"), productController.update);
router.delete("/:id", authenticate, authorize("admin"), productController.remove);

module.exports = router;
