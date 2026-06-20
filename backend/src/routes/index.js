const { Router } = require('express')

const authRoutes = require('./auth')
const productRoutes = require('./products')
const categoryRoutes = require('./categories')
const customerRoutes = require('./customers')
const saleRoutes = require('./sales')
const userRoutes = require('./users')
const inventoryRoutes = require('./inventory')
const reportRoutes = require('./reports')

const router = Router()

router.use('/auth', authRoutes)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)
router.use('/customers', customerRoutes)
router.use('/sales', saleRoutes)
router.use('/users', userRoutes)
router.use('/inventory', inventoryRoutes)
router.use('/reports', reportRoutes)

module.exports = router
