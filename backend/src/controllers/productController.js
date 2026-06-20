const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const { category, search, page = 1, limit = 20 } = req.query
  const result = await client.query(ref("products:list"), {
    category,
    search,
    page: Number(page),
    limit: Number(limit),
  })
  res.json(result)
}

exports.getById = async (req, res) => {
  const product = await client.query(ref("products:getById"), { id: req.params.id })
  if (!product) return res.status(404).json({ message: "Product not found." })
  res.json(product)
}

exports.create = async (req, res) => {
  const { name, sku, price, cost, category, stock, barcode } = req.body
  if (!name || !sku || price === undefined) {
    return res.status(400).json({ message: "Name, SKU, and price are required." })
  }

  try {
    const id = await client.mutation(ref("products:create"), {
      name,
      sku,
      price: Number(price),
      cost: cost ? Number(cost) : 0,
      category: category || "Uncategorized",
      stock: stock !== undefined ? Number(stock) : 0,
      barcode: barcode || "",
    })
    const product = await client.query(ref("products:getById"), { id })
    res.status(201).json(product)
  } catch (error) {
    if (error.message === "SKU already exists") {
      return res.status(400).json({ message: "SKU already exists." })
    }
    throw error
  }
}

exports.update = async (req, res) => {
  try {
    const updated = await client.mutation(ref("products:update"), {
      id: req.params.id,
      ...req.body,
      ...(req.body.price !== undefined && { price: Number(req.body.price) }),
      ...(req.body.cost !== undefined && { cost: Number(req.body.cost) }),
      ...(req.body.stock !== undefined && { stock: Number(req.body.stock) }),
    })
    res.json(updated)
  } catch (error) {
    if (error.message === "Product not found") {
      return res.status(404).json({ message: "Product not found." })
    }
    if (error.message === "SKU already exists") {
      return res.status(400).json({ message: "SKU already exists." })
    }
    throw error
  }
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("products:remove"), { id: req.params.id })
    res.json({ message: "Product deleted." })
  } catch (error) {
    if (error.message === "Product not found") {
      return res.status(404).json({ message: "Product not found." })
    }
    throw error
  }
}
