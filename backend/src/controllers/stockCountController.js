const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const counts = await client.query(ref("stockCounts:list"))
  res.json(counts)
}

exports.getById = async (req, res) => {
  const entry = await client.query(ref("stockCounts:getById"), { id: req.params.id })
  if (!entry) return res.status(404).json({ message: "Stock count not found" })
  res.json(entry)
}

exports.create = async (req, res) => {
  const { items, notes } = req.body
  if (!items || !Array.isArray(items) || items.length === 0)
    return res.status(400).json({ message: "At least one item required" })

  const created = []
  for (const item of items) {
    if (!item.productId || item.actualQty === undefined) continue
    const id = await client.mutation(ref("stockCounts:create"), {
      productId: item.productId,
      productName: item.productName || "",
      expectedStock: item.expectedQty || 0,
      actualStock: item.actualQty,
      countedBy: req.user?.id,
      notes: notes || "",
    })
    const entry = await client.query(ref("stockCounts:getById"), { id })
    created.push(entry)
    if (entry && entry.variance !== 0) {
      await client.mutation(ref("notifications:create"), {
        type: "stock_count_discrepancy",
        title: "Stock Count Variance",
        message: `${entry.productName}: expected ${entry.expectedStock}, counted ${entry.actualStock} (${entry.variance > 0 ? '+' : ''}${entry.variance})`,
        userId: req.user?.id,
      }).catch(() => {})
      await audit.log("stock_count", req, { details: `Counted ${entry.productName}: ${entry.actualStock} (expected ${entry.expectedStock})`, itemId: id })
    }
  }
  res.status(201).json({ items: created, totalItems: created.length })
}

exports.remove = async (req, res) => {
  await client.mutation(ref("stockCounts:remove"), { id: req.params.id })
  res.json({ message: "Stock count entry removed" })
}
