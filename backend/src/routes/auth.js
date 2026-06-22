const { Router } = require('express')
const authController = require('../controllers/authController')
const { authenticate } = require('../middleware/auth')

const router = Router()

router.post('/register', authController.register)
router.post('/login', authController.login)
router.post('/logout', authenticate, authController.logout)
router.get('/me', authenticate, authController.getMe)
router.post('/forgot-password', authController.forgotPassword)

module.exports = router
