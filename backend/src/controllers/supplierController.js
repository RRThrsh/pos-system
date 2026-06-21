const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const { search, page = 1, limit = 20 } = req.query
  const result = await client.query(ref("suppliers:list"), {
    search,
    page: Number(page),
    limit: Number(limit),
  })
  res.json(result)
}

exports.getById = async (req, res) => {
  const supplier = await client.query(ref("suppliers:getById"), { id: req.params.id })
  if (!supplier) return res.status(404).json({ message: "Supplier not found." })
  res.json(supplier)
}

exports.create = async (req, res) => {
  const { name, contact, phone, email, address } = req.body
  if (!name) return res.status(400).json({ message: "Supplier name is required." })

  const id = await client.mutation(ref("suppliers:create"), {
    name,
    contact: contact || "",
    phone: phone || "",
    email: email || "",
    address: address || "",
  })
  const supplier = await client.query(ref("suppliers:getById"), { id })
  res.status(201).json(supplier)
}

exports.update = async (req, res) => {
  try {
    const updated = await client.mutation(ref("suppliers:update"), { id: req.params.id, ...req.body })
    res.json(updated)
  } catch (error) {
    if (error.message === "Supplier not found") {
      return res.status(404).json({ message: "Supplier not found." })
    }
    throw error
  }
}

exports.productsBySupplier = async (req, res) => {
  const result = await client.query(ref("supplierProducts:listBySupplier"), { supplierId: req.params.id })
  res.json(result)
}

exports.compareByProduct = async (req, res) => {
  const { productId } = req.query
  if (!productId) return res.status(400).json({ message: "productId is required." })
  const result = await client.query(ref("supplierProducts:listByProduct"), { productId })
  res.json(result)
}

exports.setProductPrice = async (req, res) => {
  const { supplierId, productId, price } = req.body
  if (!supplierId || !productId || price === undefined) {
    return res.status(400).json({ message: "supplierId, productId, and price are required." })
  }
  const result = await client.mutation(ref("supplierProducts:set"), { supplierId, productId, price })
  res.json(result)
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("suppliers:remove"), { id: req.params.id })
    res.json({ message: "Supplier deleted." })
  } catch (error) {
    if (error.message === "Supplier not found") {
      return res.status(404).json({ message: "Supplier not found." })
    }
    throw error
  }
}
