const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const { status, page, limit } = req.query
  const result = await client.query(ref("purchaseOrders:list"), { status, page: Number(page) || 1, limit: Number(limit) || 20 })
  res.json(result)
}

exports.getById = async (req, res) => {
  const order = await client.query(ref("purchaseOrders:getById"), { id: req.params.id })
  if (!order) return res.status(404).json({ message: "Purchase order not found" })
  res.json(order)
}

exports.create = async (req, res) => {
  const { supplierId, supplierName, items, subtotal, notes } = req.body
  if (!supplierId || !items || !items.length) return res.status(400).json({ message: "Supplier and items are required" })
  const id = await client.mutation(ref("purchaseOrders:create"), { supplierId, supplierName, items, subtotal, notes, createdBy: req.user.id })
  await audit.log("create_purchase_order", req, { details: `Created PO for ${supplierName}`, itemName: supplierName })
  res.status(201).json({ id })
}

exports.updateStatus = async (req, res) => {
  const { status } = req.body
  if (!["pending", "ordered", "received", "cancelled"].includes(status)) return res.status(400).json({ message: "Invalid status" })
  const updated = await client.mutation(ref("purchaseOrders:updateStatus"), { id: req.params.id, status })
  await audit.log("update_purchase_order", req, { details: `PO ${status}`, itemName: req.params.id })
  res.json(updated)
}

exports.partialReceive = async (req, res) => {
  const { receiveItems } = req.body
  if (!receiveItems || !receiveItems.length) return res.status(400).json({ message: "Receive items required" })
  try {
    const updated = await client.mutation(ref("purchaseOrders:partialReceive"), { id: req.params.id, receiveItems })
    await audit.log("partial_receive_po", req, { details: `Partial receive on PO ${req.params.id}`, itemName: req.params.id })
    res.json(updated)
  } catch (error) {
    if (error.message?.startsWith("Purchase order")) return res.status(404).json({ message: error.message })
    if (error.message?.includes("completed")) return res.status(400).json({ message: error.message })
    throw error
  }
}

exports.remove = async (req, res) => {
  await client.mutation(ref("purchaseOrders:remove"), { id: req.params.id })
  await audit.log("delete_purchase_order", req, { details: `Deleted PO ${req.params.id}` })
  res.json({ message: "Purchase order deleted" })
}
