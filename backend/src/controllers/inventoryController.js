const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getMovements = async (req, res) => {
  const { productId, type } = req.query
  const movements = await client.query(ref("inventory:list"), { productId, type })
  res.json(movements)
}

exports.adjust = async (req, res) => {
  const { productId, quantity, type, reason } = req.body

  if (!productId || quantity === undefined || !type) {
    return res.status(400).json({ message: "productId, quantity, and type are required." })
  }

  if (!["in", "out"].includes(type)) {
    return res.status(400).json({ message: 'Type must be "in" or "out".' })
  }

  try {
    const movementId = await client.mutation(ref("inventory:adjust"), {
      productId,
      quantity: Number(quantity),
      type,
      reason: reason || "",
    })
    const product = await client.query(ref("products:getById"), { id: productId })
    await audit.log("adjust_inventory", req, { details: `${type === "in" ? "Added" : "Removed"} ${quantity} of ${product.name} (${reason || "no reason"})`, itemName: product.name })
    res.json({ product, movementId })
  } catch (error) {
    if (error.message === "Product not found") {
      return res.status(404).json({ message: "Product not found." })
    }
    if (error.message === "Insufficient stock") {
      return res.status(400).json({ message: "Insufficient stock." })
    }
    throw error
  }
}
