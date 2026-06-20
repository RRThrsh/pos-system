const jwt = require('jsonwebtoken')
const config = require('../config')

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. No token provided.' })
  }

  try {
    const token = header.split(' ')[1]
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ message: 'Invalid or expired token.' })
  }
}

function authorize(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' })
    }
    next()
  }
}

module.exports = { authenticate, authorize }
