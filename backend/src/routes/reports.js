const { Router } = require('express')
const reportController = require('../controllers/reportController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/sales', authenticate, authorize('admin', 'superadmin'), reportController.salesReport)
router.get('/inventory', authenticate, authorize('admin', 'superadmin'), reportController.inventoryReport)
router.get('/profits', authenticate, authorize('admin', 'superadmin'), reportController.profitsReport)
router.get('/summary', authenticate, authorize('admin', 'superadmin'), reportController.summary)

module.exports = router
