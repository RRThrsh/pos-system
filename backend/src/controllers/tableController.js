const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const tables = await client.query(ref("tables:list"))
  res.json(tables)
}

exports.create = async (req, res) => {
  const { number, floor, capacity } = req.body
  if (!number || !floor || !capacity) return res.status(400).json({ message: "Number, floor, and capacity are required" })
  const id = await client.mutation(ref("tables:create"), { number, floor, capacity: Number(capacity) })
  await audit.log("create_table", req, { details: `Table ${number} (${floor})`, itemName: number })
  res.status(201).json({ id })
}

exports.updateStatus = async (req, res) => {
  const { status, currentSaleId } = req.body
  const updated = await client.mutation(ref("tables:updateStatus"), { id: req.params.id, status, currentSaleId })
  await audit.log("update_table", req, { details: `Table ${updated.number} → ${status}`, itemName: updated.number })
  res.json(updated)
}

exports.remove = async (req, res) => {
  await client.mutation(ref("tables:remove"), { id: req.params.id })
  await audit.log("delete_table", req, { details: `Deleted table ${req.params.id}` })
  res.json({ message: "Table deleted" })
}
