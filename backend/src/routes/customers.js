const { Router } = require('express')
const customerController = require('../controllers/customerController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, customerController.getAll)
router.get('/:id', authenticate, customerController.getById)
router.post('/', authenticate, customerController.create)
router.put('/:id', authenticate, customerController.update)
router.delete('/:id', authenticate, authorize('admin'), customerController.remove)

module.exports = router
