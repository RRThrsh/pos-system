const { Router } = require('express')
const reportController = require('../controllers/reportController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/sales', authenticate, authorize('admin'), reportController.salesReport)
router.get('/inventory', authenticate, authorize('admin'), reportController.inventoryReport)
router.get('/profits', authenticate, authorize('admin'), reportController.profitsReport)

module.exports = router
