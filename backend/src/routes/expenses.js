const express = require("express")
const router = express.Router()
const expenseController = require("../controllers/expenseController")
const { authenticate, authorize } = require("../middleware/auth")
const { checkPermission } = require("../middleware/auth")

router.use(authenticate)
router.get("/", authorize("admin", "superadmin"), checkPermission("Expenses", "read"), expenseController.getAll)
router.post("/", authorize("admin", "superadmin"), checkPermission("Expenses", "write"), expenseController.create)
router.delete("/:id", authorize("admin", "superadmin"), checkPermission("Expenses", "execute"), expenseController.remove)

module.exports = router
