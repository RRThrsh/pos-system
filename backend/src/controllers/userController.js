const bcrypt = require("bcryptjs")
const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const users = await client.query(ref("users:list"))
  res.json(users)
}

exports.create = async (req, res) => {
  const { firstName, lastName, username, password, role } = req.body
  if (!firstName || !lastName || !username || !password) {
    return res.status(400).json({ message: "First name, last name, username, and password are required." })
  }

  try {
    const id = await client.mutation(ref("users:create"), {
      firstName,
      lastName,
      username,
      password: bcrypt.hashSync(password, 10),
      role: role || "cashier",
    })
    const user = await client.query(ref("users:getById"), { id })
    res.status(201).json({ id: user._id, firstName: user.firstName, lastName: user.lastName, username: user.username, role: user.role })
  } catch (error) {
    if (error.message === "Username already exists") {
      return res.status(400).json({ message: "Username already exists." })
    }
    throw error
  }
}

exports.update = async (req, res) => {
  const { firstName, lastName, role, isActive, password } = req.body
  const fields = {}
  if (firstName !== undefined) fields.firstName = firstName
  if (lastName !== undefined) fields.lastName = lastName
  if (role !== undefined) fields.role = role
  if (isActive !== undefined) fields.isActive = isActive
  if (password) fields.password = bcrypt.hashSync(password, 10)

  try {
    const updated = await client.mutation(ref("users:update"), { id: req.params.id, ...fields })
    res.json({ id: updated._id, firstName: updated.firstName, lastName: updated.lastName, username: updated.username, role: updated.role, isActive: updated.isActive })
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found." })
    }
    throw error
  }
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("users:remove"), { id: req.params.id })
    res.json({ message: "User deleted." })
  } catch (error) {
    if (error.message === "User not found") {
      return res.status(404).json({ message: "User not found." })
    }
    throw error
  }
}
