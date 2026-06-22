const jwt = require('jsonwebtoken')
const config = require('../config')
const { client, ref } = require('../convex')

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

const permCache = {}

function checkPermission(page, action) {
  return async (req, res, next) => {
    if (req.user.role === 'superadmin') return next()
    const key = `${req.user.role}-${page}`
    if (!permCache[key]) {
      try {
        const perm = await client.query(ref('permissions:getByRoleAndPage'), { role: req.user.role, page })
        permCache[key] = perm || { canRead: true, canWrite: true, canExecute: true }
      } catch {
        permCache[key] = { canRead: true, canWrite: true, canExecute: true }
      }
    }
    const p = permCache[key]
    const actionMap = { read: 'canRead', write: 'canWrite', execute: 'canExecute' }
    if (!p[actionMap[action]]) {
      return res.status(403).json({ message: 'Forbidden. Insufficient permissions.' })
    }
    next()
  }
}

function clearPermCache() {
  Object.keys(permCache).forEach((k) => delete permCache[k])
}

module.exports = { authenticate, authorize, checkPermission, clearPermCache }
