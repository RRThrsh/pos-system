const path = require('path')
require('dotenv').config()
require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env.local'), override: true })

const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'pos-system-secret-key',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
}

module.exports = config
