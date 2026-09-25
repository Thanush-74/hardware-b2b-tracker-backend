const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartcontroller");
const { authenticate } = require("../middlewares/authMiddleware");

router.get("/", authenticate, cartController.getCart);
router.post("/", authenticate, cartController.addItem);
router.put("/:id", authenticate, cartController.updateItem);
router.delete("/:id", authenticate, cartController.removeItem);
router.delete("/", authenticate, cartController.clear);

module.exports = router;
