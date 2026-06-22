const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const orders = await client.query(ref("heldOrders:list"))
  res.json(orders)
}

exports.getById = async (req, res) => {
  const order = await client.query(ref("heldOrders:getById"), { id: req.params.id })
  if (!order) return res.status(404).json({ message: "Held order not found" })
  res.json(order)
}

exports.create = async (req, res) => {
  const { items, subtotal, notes } = req.body
  if (!items || !items.length) return res.status(400).json({ message: "Order must have items" })
  const id = await client.mutation(ref("heldOrders:create"), {
    items: items.map((i) => ({
      productId: i.productId || i._id || i.id,
      productName: i.productName || i.name,
      price: i.price,
      qty: i.qty || i.quantity,
      total: (i.price || 0) * (i.qty || i.quantity || 0),
    })),
    subtotal,
    notes,
    createdBy: req.user?.id,
  })
  res.status(201).json({ id })
}

exports.remove = async (req, res) => {
  await client.mutation(ref("heldOrders:remove"), { id: req.params.id })
  res.json({ message: "Held order removed" })
}
