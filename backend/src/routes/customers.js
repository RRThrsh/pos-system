const { Router } = require('express')
const customerController = require("../controllers/customerController")
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()
router.get("/", authenticate, authorize("admin", "superadmin", "cashier"), customerController.getAll)
router.get("/search", authenticate, authorize("admin", "superadmin", "cashier"), customerController.search)
router.get("/:id", authenticate, authorize("admin", "superadmin", "cashier"), customerController.getById)
router.post("/", authenticate, authorize("admin", "superadmin"), customerController.create)
router.put("/:id", authenticate, authorize("admin", "superadmin"), customerController.update)
router.post("/:id/loyalty", authenticate, authorize("admin", "superadmin", "cashier"), customerController.addLoyaltyPoints)
router.delete("/:id", authenticate, authorize("admin", "superadmin"), customerController.remove)

module.exports = router
