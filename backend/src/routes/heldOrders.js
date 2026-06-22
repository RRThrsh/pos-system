const express = require("express")
const router = express.Router()
const heldOrderController = require("../controllers/heldOrderController")
const { authenticate } = require("../middleware/auth")

router.use(authenticate)
router.get("/", heldOrderController.getAll)
router.get("/:id", heldOrderController.getById)
router.post("/", heldOrderController.create)
router.delete("/:id", heldOrderController.remove)

module.exports = router
