const { Router } = require('express')
const { authenticate, authorize } = require('../middleware/auth')
const permissionController = require('../controllers/permissionController')

const router = Router()

router.use(authenticate)

router.get('/my', permissionController.getMyPermissions)

router.use(authorize('superadmin'))

router.get('/', permissionController.getAll)
router.get('/:role', permissionController.getByRole)
router.get('/:role/:page', permissionController.getByRoleAndPage)
router.post('/set', permissionController.set)
router.post('/seed', permissionController.seedDefaults)

module.exports = router
