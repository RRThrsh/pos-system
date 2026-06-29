const { Router } = require('express')
const paymentController = require('../controllers/paymentController')
const { authenticate } = require('../middleware/auth')

const router = Router()

router.post('/create-payment-intent', authenticate, paymentController.createPaymentIntent)
router.post('/confirm-payment', authenticate, paymentController.confirmPayment)
router.post('/process', authenticate, paymentController.processPayment)

module.exports = router
