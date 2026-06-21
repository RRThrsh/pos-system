const { Router } = require('express')
const userController = require('../controllers/userController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Users', 'read'), userController.getAll)
router.post('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Users', 'write'), userController.create)
router.patch('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Users', 'write'), userController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Users', 'execute'), userController.remove)

module.exports = router
