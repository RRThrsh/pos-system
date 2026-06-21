const { Router } = require('express')
const saleController = require('../controllers/saleController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, saleController.getAll)
router.get('/:id', authenticate, saleController.getById)
router.post('/', authenticate, saleController.create)
router.post('/:id/void', authenticate, authorize('admin', 'superadmin'), saleController.voidSale)

module.exports = router
