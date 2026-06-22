const { Router } = require('express')
const reportController = require('../controllers/reportController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/sales', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.salesReport)
router.get('/inventory', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.inventoryReport)
router.get('/profits', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.profitsReport)
router.get('/summary', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.summary)
router.get('/best-sellers', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.bestSellers)
router.get('/daily-summaries', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.dailySummaries)
router.get('/payment-methods', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.paymentMethods)
router.get('/hourly-sales', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.hourlySales)
router.get('/active-users', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.activeUsersToday)
router.get('/category-sales', authenticate, authorize('admin', 'superadmin'), checkPermission('Reports', 'read'), reportController.categorySales)

module.exports = router
