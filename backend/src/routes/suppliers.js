const { Router } = require('express')
const supplierController = require('../controllers/supplierController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, supplierController.getAll)
router.get('/:id', authenticate, supplierController.getById)
router.get('/:id/products', authenticate, supplierController.productsBySupplier)
router.get('/compare/product', authenticate, supplierController.compareByProduct)
router.post('/products/price', authenticate, authorize('admin', 'superadmin'), checkPermission('Suppliers', 'write'), supplierController.setProductPrice)
router.post('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Suppliers', 'write'), supplierController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Suppliers', 'write'), supplierController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Suppliers', 'execute'), supplierController.remove)

module.exports = router
