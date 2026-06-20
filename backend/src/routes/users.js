const { Router } = require('express')
const userController = require('../controllers/userController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, authorize('admin'), userController.getAll)
router.post('/', authenticate, authorize('admin'), userController.create)
router.put('/:id', authenticate, authorize('admin'), userController.update)
router.delete('/:id', authenticate, authorize('admin'), userController.remove)

module.exports = router
