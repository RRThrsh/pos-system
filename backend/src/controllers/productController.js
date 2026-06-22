const { client, ref } = require("../convex")
const audit = require("../services/audit")

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
  const { name, sku, price, cost, category, stock, barcode, unitValue, unit, image } = req.body
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
      unitValue: unitValue !== undefined ? Number(unitValue) : undefined,
      unit: unit || undefined,
      image: image || undefined,
    })
    const product = await client.query(ref("products:getById"), { id })
    await audit.log("create_product", req, { details: `Created product: ${product.name} (${product.sku})`, itemName: product.name })
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
      ...(req.body.unitValue !== undefined && { unitValue: Number(req.body.unitValue) }),
    })
    await audit.log("update_product", req, { details: `Updated product: ${updated?.name || req.params.id}`, itemName: updated?.name })
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

exports.bulkImport = async (req, res) => {
  const { products } = req.body
  if (!Array.isArray(products) || products.length === 0) return res.status(400).json({ message: "Products array is required" })
  const results = { created: 0, errors: [] }
  for (const p of products) {
    if (!p.name || !p.sku) { results.errors.push({ row: p, error: "Name and SKU required" }); continue }
    try {
      await client.mutation(ref("products:create"), {
        name: p.name, sku: p.sku, price: Number(p.price || 0), cost: Number(p.cost || 0),
        category: p.category || "Uncategorized", stock: Number(p.stock || 0),
        barcode: p.barcode || "", unitValue: p.unitValue ? Number(p.unitValue) : undefined,
        unit: p.unit || undefined, image: p.image || undefined,
      })
      results.created++
    } catch (e) { results.errors.push({ row: p, error: e.message }) }
  }
  await audit.log("bulk_import_products", req, { details: `Imported ${results.created} products, ${results.errors.length} errors`, itemName: `${results.created} products` })
  res.json(results)
}

exports.bulkUpdatePrice = async (req, res) => {
  const { productIds, price, percentageAdjustment } = req.body
  if (!productIds || !productIds.length) return res.status(400).json({ message: "Product IDs required" })
  try {
    await client.mutation(ref("products:bulkUpdatePrice"), { productIds, price, percentageAdjustment })
    await audit.log("bulk_price_update", req, { details: `Bulk price update on ${productIds.length} products` })
    res.json({ message: `Updated ${productIds.length} products` })
  } catch (error) { throw error }
}

exports.remove = async (req, res) => {
  try {
    await client.mutation(ref("products:remove"), { id: req.params.id })
    await audit.log("delete_product", req, { details: `Deleted product ${req.params.id}` })
    res.json({ message: "Product deleted." })
  } catch (error) {
    if (error.message === "Product not found") {
      return res.status(404).json({ message: "Product not found." })
    }
    throw error
  }
}
