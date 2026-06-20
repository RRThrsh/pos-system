const { Router } = require('express')
const inventoryController = require('../controllers/inventoryController')
const { authenticate, authorize } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, inventoryController.getMovements)
router.post('/adjust', authenticate, authorize('admin', 'superadmin'), inventoryController.adjust)

module.exports = router
