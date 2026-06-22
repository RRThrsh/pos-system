const express = require("express")
const router = express.Router()
const tableController = require("../controllers/tableController")
const { authenticate, authorize } = require("../middleware/auth")
const { checkPermission } = require("../middleware/auth")

router.use(authenticate)
router.get("/", authorize("admin", "superadmin", "cashier"), tableController.getAll)
router.post("/", authorize("admin", "superadmin"), checkPermission("Tables", "write"), tableController.create)
router.patch("/:id/status", authorize("admin", "superadmin", "cashier"), tableController.updateStatus)
router.delete("/:id", authorize("admin", "superadmin"), checkPermission("Tables", "execute"), tableController.remove)

module.exports = router
