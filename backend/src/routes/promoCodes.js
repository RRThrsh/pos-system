const express = require("express")
const router = express.Router()
const promoCodeController = require("../controllers/promoCodeController")
const { authenticate, authorize } = require("../middleware/auth")
const { checkPermission } = require("../middleware/auth")

router.use(authenticate)
router.get("/", authorize("admin", "superadmin"), checkPermission("Promo Codes", "read"), promoCodeController.getAll)
router.get("/:code", authorize("admin", "superadmin", "cashier"), promoCodeController.getByCode)
router.post("/", authorize("admin", "superadmin"), checkPermission("Promo Codes", "write"), promoCodeController.create)
router.patch("/:id/toggle", authorize("admin", "superadmin"), checkPermission("Promo Codes", "execute"), promoCodeController.toggleActive)
router.delete("/:id", authorize("admin", "superadmin"), checkPermission("Promo Codes", "execute"), promoCodeController.remove)

module.exports = router
