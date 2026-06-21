const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const { dateFrom, dateTo, page = 1, limit = 20 } = req.query
  const result = await client.query(ref("sales:list"), {
    dateFrom,
    dateTo,
    page: Number(page),
    limit: Number(limit),
  })
  res.json(result)
}

exports.getById = async (req, res) => {
  const sale = await client.query(ref("sales:getById"), { id: req.params.id })
  if (!sale) return res.status(404).json({ message: "Sale not found." })
  res.json(sale)
}

exports.create = async (req, res) => {
  const { items, transactionId, paymentMethod, amountPaid } = req.body

  if (!items || !items.length) {
    return res.status(400).json({ message: "Sale must include at least one item." })
  }

  try {
    const id = await client.mutation(ref("sales:create"), {
      items: items.map((i) => ({ productId: i.productId, qty: i.qty })),
      transactionId,
      paymentMethod: paymentMethod || "cash",
      amountPaid: amountPaid ? Number(amountPaid) : undefined,
      createdBy: req.user?.id,
    })
    const sale = await client.query(ref("sales:getById"), { id })
    await audit.log("create_sale", req, { details: `Sale #${sale.transactionId || id} - ₱${sale.total} (${items.length} items)`, itemId: id })
    res.status(201).json(sale)
  } catch (error) {
    if (error.message?.startsWith("Product") || error.message?.startsWith("Insufficient")) {
      return res.status(400).json({ message: error.message })
    }
    throw error
  }
}

exports.voidSale = async (req, res) => {
  try {
    const sale = await client.mutation(ref("sales:voidSale"), { id: req.params.id })
    await audit.log("void_sale", req, { details: `Voided sale ${req.params.id}`, itemId: req.params.id })
    res.json(sale)
  } catch (error) {
    if (error.message === "Sale not found") {
      return res.status(404).json({ message: "Sale not found." })
    }
    if (error.message === "Sale is already voided") {
      return res.status(400).json({ message: "Sale is already voided." })
    }
    throw error
  }
}
