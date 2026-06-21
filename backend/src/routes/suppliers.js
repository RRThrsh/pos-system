const { Router } = require('express')
const supplierController = require('../controllers/supplierController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, supplierController.getAll)
router.get('/:id', authenticate, supplierController.getById)
router.post('/', authenticate, authorize('admin', 'superadmin'), supplierController.create)
router.put('/:id', authenticate, authorize('admin', 'superadmin'), supplierController.update)
router.delete('/:id', authenticate, authorize('admin', 'superadmin'), supplierController.remove)

module.exports = router
