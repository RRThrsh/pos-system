const { Router } = require('express')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')
const configController = require('../controllers/configController')

const router = Router()

router.use(authenticate, authorize('admin', 'superadmin'))

router.get('/', configController.getAll)
router.get('/system-info', configController.systemInfo)
router.get('/:key', configController.get)
router.post('/set', checkPermission('Config', 'write'), configController.set)
router.post('/reset-audit-logs', checkPermission('Config', 'execute'), configController.resetAuditLogs)
router.post('/backup', checkPermission('Config', 'execute'), configController.backup)

module.exports = router
