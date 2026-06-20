const { Router } = require('express')
const userController = require('../controllers/userController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, authorize('admin', 'superadmin'), userController.getAll)
router.post('/', authenticate, authorize('admin', 'superadmin'), userController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), userController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), userController.remove)

module.exports = router
