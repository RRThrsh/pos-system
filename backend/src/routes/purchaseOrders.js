const express = require("express")
const router = express.Router()
const purchaseOrderController = require("../controllers/purchaseOrderController")
const { authenticate, authorize } = require("../middleware/auth")
const { checkPermission } = require("../middleware/auth")

router.use(authenticate)
router.get("/", authorize("admin", "superadmin", "cashier"), purchaseOrderController.getAll)
router.get("/:id", authorize("admin", "superadmin", "cashier"), purchaseOrderController.getById)
router.post("/", authorize("admin", "superadmin"), checkPermission("Purchase Orders", "write"), purchaseOrderController.create)
router.patch("/:id/status", authorize("admin", "superadmin"), checkPermission("Purchase Orders", "execute"), purchaseOrderController.updateStatus)
router.post("/:id/receive", authorize("admin", "superadmin"), checkPermission("Purchase Orders", "execute"), purchaseOrderController.partialReceive)
router.delete("/:id", authorize("admin", "superadmin"), checkPermission("Purchase Orders", "execute"), purchaseOrderController.remove)

module.exports = router
