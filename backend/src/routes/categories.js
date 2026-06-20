const { Router } = require('express')
const categoryController = require('../controllers/categoryController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, categoryController.getAll)
router.post('/', authenticate, authorize('admin', 'superadmin'), categoryController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), categoryController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), categoryController.remove)

module.exports = router
