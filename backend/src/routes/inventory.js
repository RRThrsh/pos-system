const { Router } = require('express')
const inventoryController = require('../controllers/inventoryController')
const { authenticate, authorize, checkPermission } = require('../middleware/auth')

const router = Router()

router.get('/', authenticate, inventoryController.getMovements)
router.post('/adjust', authenticate, authorize('admin', 'superadmin'), checkPermission('Inventory', 'write'), inventoryController.adjust)

module.exports = router
