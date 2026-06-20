const { Router } = require('express')
const categoryController = require('../controllers/categoryController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, categoryController.getAll)
router.post('/', authenticate, authorize('admin'), categoryController.create)
router.put('/:id', authenticate, authorize('admin'), categoryController.update)
router.delete('/:id', authenticate, authorize('admin'), categoryController.remove)

module.exports = router
