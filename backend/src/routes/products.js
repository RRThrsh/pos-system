const { Router } = require('express')
const productController = require('../controllers/productController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, productController.getAll)
router.get('/:id', authenticate, productController.getById)
router.post('/', authenticate, authorize('admin', 'superadmin'), productController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), productController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), productController.remove)

module.exports = router
