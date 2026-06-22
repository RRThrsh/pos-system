const { Router } = require('express')
const auditController = require('../controllers/auditController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Audit Logs', 'read'), auditController.getAll)

module.exports = router
