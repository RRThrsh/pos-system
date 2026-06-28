const { Router } = require('express')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')
const configController = require('../controllers/configController')

const router = Router()

router.use(authenticate)

router.get('/', authorize('admin', 'superadmin', 'cashier'), configController.getAll)
router.get('/system-info', authorize('admin', 'superadmin'), configController.systemInfo)
router.get('/:key', authorize('admin', 'superadmin', 'cashier'), configController.get)
router.post('/set', authorize('admin', 'superadmin'), checkPermission('Config', 'write'), configController.set)
router.post('/reset-audit-logs', authorize('admin', 'superadmin'), checkPermission('Config', 'execute'), configController.resetAuditLogs)
router.post('/backup', authorize('admin', 'superadmin'), checkPermission('Config', 'execute'), configController.backup)

module.exports = router
