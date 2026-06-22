const express = require("express")
const router = express.Router()
const notificationController = require("../controllers/notificationController")
const { authenticate } = require("../middleware/auth")

router.use(authenticate)
router.get("/", notificationController.getAll)
router.get("/unread-count", notificationController.countUnread)
router.post("/:id/read", notificationController.markRead)
router.post("/read-all", notificationController.markAllRead)

module.exports = router
