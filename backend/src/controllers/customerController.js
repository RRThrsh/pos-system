const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const customers = await client.query(ref("customers:list"))
  res.json(customers)
}

exports.search = async (req, res) => {
  const { q } = req.query
  if (!q) return res.json([])
  const results = await client.query(ref("customers:search"), { query: q })
  res.json(results)
}

exports.getById = async (req, res) => {
  const customer = await client.query(ref("customers:getById"), { id: req.params.id })
  if (!customer) return res.status(404).json({ message: "Customer not found" })
  res.json(customer)
}

exports.create = async (req, res) => {
  const { name, phone, email, address, birthdate, notes } = req.body
  if (!name || !phone) return res.status(400).json({ message: "Name and phone are required" })
  const id = await client.mutation(ref("customers:create"), { name, phone, email, address, birthdate, notes, createdBy: req.user?.id })
  await audit.log("create_customer", req, { details: `Created customer ${name}`, itemId: id })
  res.status(201).json({ id })
}

exports.update = async (req, res) => {
  const { name, phone, email, address, birthdate, notes } = req.body
  const customer = await client.mutation(ref("customers:update"), { id: req.params.id, name, phone, email, address, birthdate, notes })
  await audit.log("update_customer", req, { details: `Updated customer ${name || req.params.id}`, itemId: req.params.id })
  res.json(customer)
}

exports.addLoyaltyPoints = async (req, res) => {
  const { points } = req.body
  if (!points || points <= 0) return res.status(400).json({ message: "Points must be positive" })
  const customer = await client.mutation(ref("customers:addLoyaltyPoints"), { id: req.params.id, points })
  res.json(customer)
}

exports.remove = async (req, res) => {
  await client.mutation(ref("customers:remove"), { id: req.params.id })
  await audit.log("delete_customer", req, { details: `Deleted customer ${req.params.id}` })
  res.json({ message: "Customer deleted" })
}
