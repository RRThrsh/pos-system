const { Router } = require('express')
const reportController = require('../controllers/reportController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/sales', authenticate, authorize('admin', 'superadmin'), reportController.salesReport)
router.get('/inventory', authenticate, authorize('admin', 'superadmin'), reportController.inventoryReport)
router.get('/profits', authenticate, authorize('admin', 'superadmin'), reportController.profitsReport)
router.get('/summary', authenticate, authorize('admin', 'superadmin'), reportController.summary)
router.get('/best-sellers', authenticate, authorize('admin', 'superadmin'), reportController.bestSellers)
router.get('/daily-summaries', authenticate, authorize('admin', 'superadmin'), reportController.dailySummaries)
router.get('/payment-methods', authenticate, authorize('admin', 'superadmin'), reportController.paymentMethods)
router.get('/hourly-sales', authenticate, authorize('admin', 'superadmin'), reportController.hourlySales)
router.get('/active-users', authenticate, authorize('admin', 'superadmin'), reportController.activeUsersToday)

module.exports = router
