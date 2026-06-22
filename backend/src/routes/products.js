const { Router } = require('express')
const productController = require('../controllers/productController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, productController.getAll)
router.get('/:id', authenticate, productController.getById)
router.post('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Products', 'write'), productController.create)
router.post('/bulk-import', authenticate, authorize('admin', 'superadmin'), checkPermission('Products', 'write'), productController.bulkImport)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Products', 'write'), productController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Products', 'execute'), productController.remove)

module.exports = router
