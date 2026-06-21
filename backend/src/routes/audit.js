const { Router } = require('express')
const auditController = require('../controllers/auditController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, authorize('admin', 'superadmin'), auditController.getAll)

module.exports = router
