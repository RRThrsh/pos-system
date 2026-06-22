const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const { dateFrom, dateTo, category, page, limit } = req.query
  const result = await client.query(ref("expenses:list"), { dateFrom, dateTo, category, page: Number(page) || 1, limit: Number(limit) || 20 })
  res.json(result)
}

exports.create = async (req, res) => {
  const { description, amount, category, paymentMethod, reference } = req.body
  if (!description || !amount || !category || !paymentMethod) return res.status(400).json({ message: "Description, amount, category, and payment method are required" })
  const id = await client.mutation(ref("expenses:create"), { description, amount: Number(amount), category, paymentMethod, reference, createdBy: req.user.id })
  await audit.log("create_expense", req, { details: `Expense ${description} - ${amount}`, itemName: description })
  res.status(201).json({ id })
}

exports.remove = async (req, res) => {
  await client.mutation(ref("expenses:remove"), { id: req.params.id })
  await audit.log("delete_expense", req, { details: `Deleted expense ${req.params.id}` })
  res.json({ message: "Expense deleted" })
}
