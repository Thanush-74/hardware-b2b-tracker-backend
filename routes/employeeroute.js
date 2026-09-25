const express = require("express");
const router = express.Router();
const employeeController = require("../controllers/employeecontroller");
const { authenticate, authorize } = require("../middlewares/authMiddleware");

router.post("/", authenticate, authorize("admin", "manager"), employeeController.create);
router.get("/", authenticate, employeeController.getAll);
router.get("/department/:department", authenticate, employeeController.getByDepartment);
router.get("/:id", authenticate, employeeController.getById);
router.put("/:id", authenticate, authorize("admin", "manager"), employeeController.update);
router.delete("/:id", authenticate, authorize("admin"), employeeController.remove);

module.exports = router;
