const { Router } = require('express')
const paymentMethodController = require('../controllers/paymentMethodController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, paymentMethodController.getAll)
router.post('/', authenticate, authorize('admin', 'superadmin'), checkPermission('Payment Methods', 'write'), paymentMethodController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Payment Methods', 'write'), paymentMethodController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), checkPermission('Payment Methods', 'execute'), paymentMethodController.remove)

module.exports = router
