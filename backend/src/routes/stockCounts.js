const { Router } = require('express')
const stockCountController = require("../controllers/stockCountController")
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()
router.get("/", authenticate, authorize("admin", "superadmin"), stockCountController.getAll)
router.get("/:id", authenticate, authorize("admin", "superadmin"), stockCountController.getById)
router.post("/", authenticate, authorize("admin", "superadmin"), stockCountController.create)
router.delete("/:id", authenticate, authorize("admin", "superadmin"), stockCountController.remove)

module.exports = router
