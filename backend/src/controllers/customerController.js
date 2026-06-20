const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query
  const result = await client.query(ref("customers:list"), {
    search,
    page: Number(page),
    limit: Number(limit),
  })
  res.json(result)
}

exports.getById = async (req, res) => {
  const customer = await client.query(ref("customers:getById"), { id: req.params.id })
  if (!customer) return res.status(404).json({ message: "Customer not found." })
  res.json(customer)
}

exports.create = async (req, res) => {
  const { name, phone, email, address } = req.body
  if (!name) return res.status(400).json({ message: "Customer name is required." })

  const id = await client.mutation(ref("customers:create"), {
    name,
    phone: phone || "",
    email: email || "",
    address: address || "",
  })
  const customer = await client.query(ref("customers:getById"), { id })
  res.status(201).json(customer)
}

exports.update = async (req, res) => {
  try {
    const updated = await client.mutation(ref("customers:update"), { id: req.params.id, ...req.body })
    res.json(updated)
  } catch (error) {
    if (error.message === "Customer not found") {
      return res.status(404).json({ message: "Customer not found." })
    }
    throw error
  }
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("customers:remove"), { id: req.params.id })
    res.json({ message: "Customer deleted." })
  } catch (error) {
    if (error.message === "Customer not found") {
      return res.status(404).json({ message: "Customer not found." })
    }
    throw error
  }
}
