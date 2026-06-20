const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const config = require("../config")
const { client, ref } = require("../convex")

exports.register = async (req, res) => {
  const { username, password, confirmPassword, firstName, lastName, role } = req.body

  if (!username || !password || !confirmPassword || !firstName || !lastName) {
    return res.status(400).json({ message: "All fields are required." })
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match." })
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters." })
  }

  const validRoles = ["superadmin", "admin", "cashier"]
  const userRole = role || "cashier"
  if (!validRoles.includes(userRole)) {
    return res.status(400).json({ message: "Invalid role." })
  }

  try {
    const id = await client.mutation(ref("users:create"), {
      firstName,
      lastName,
      username,
      password: bcrypt.hashSync(password, 10),
      role: userRole,
    })
    const user = await client.query(ref("users:getById"), { id })
    res.status(201).json({
      id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      role: user.role,
    })
  } catch (error) {
    if (error.message === "Username already exists") {
      return res.status(400).json({ message: "Username already exists." })
    }
    throw error
  }
}

exports.login = async (req, res) => {
  const { username, password } = req.body
  if (!username || !password) {
    return res.status(400).json({ message: "Username and password are required." })
  }

  const user = await client.query(ref("users:getByUsername"), { username })
  if (!user) {
    return res.status(401).json({ message: "Invalid username or password." })
  }

  if (!bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ message: "Invalid username or password." })
  }

  if (!user.isActive) {
    return res.status(403).json({ message: "Account is deactivated." })
  }

  const token = jwt.sign(
    { id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  )

  res.json({
    token,
    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, role: user.role },
  })
}

exports.getMe = async (req, res) => {
  const user = await client.query(ref("users:getById"), { id: req.user.id })
  if (!user) return res.status(404).json({ message: "User not found." })
  res.json({ user: { id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, role: user.role } })
}
