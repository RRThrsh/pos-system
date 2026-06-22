const { Router } = require('express')
const categoryController = require('../controllers/categoryController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, categoryController.getAll)
router.post('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Categories', 'write'), categoryController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Categories', 'write'), categoryController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Categories', 'execute'), categoryController.remove)

module.exports = router
