const { Router } = require('express')
const paymentController = require('../controllers/paymentController')
const { authenticate } = require('../middleware/auth')

const router = Router()

router.post('/create-payment-intent', authenticate, paymentController.createPaymentIntent)
router.post('/confirm-payment', authenticate, paymentController.confirmPayment)
router.post('/process', authenticate, paymentController.processPayment)
router.post('/check-status', authenticate, paymentController.checkPaymentStatus)
router.post('/refund', authenticate, paymentController.refundPayment)
router.post('/hitpay-callback', paymentController.hitpayCallback)
router.post('/hitpay-webhook', paymentController.hitpayWebhook)

module.exports = router
