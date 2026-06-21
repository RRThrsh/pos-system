const { Router } = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const configController = require('../controllers/configController')

const router = Router()

router.use(authenticate, authorize('admin', 'superadmin'))

router.get('/', configController.getAll)
router.get('/system-info', configController.systemInfo)
router.get('/:key', configController.get)
router.post('/set', configController.set)
router.post('/reset-audit-logs', configController.resetAuditLogs)
router.post('/backup', configController.backup)

module.exports = router
