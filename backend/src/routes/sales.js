const { Router } = require('express')
const saleController = require('../controllers/saleController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, saleController.getAll)
router.get('/:id', authenticate, saleController.getById)
router.post('/', authenticate, checkPermission('Sales', 'write'), saleController.create)
router.post('/:id/void', authenticate, authorize('admin', 'superadmin'), checkPermission('Sales', 'execute'), saleController.voidSale)
router.post('/:id/partial-void', authenticate, authorize('admin', 'superadmin'), checkPermission('Sales', 'execute'), saleController.partialVoid)

module.exports = router
