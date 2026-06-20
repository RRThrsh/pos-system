const { client, ref } = require("../convex")

exports.salesReport = async (req, res) => {
  const { period, date } = req.query
  const result = await client.query(ref("sales:list"), {})
  let filtered = result.data
  const { dateFrom, dateTo } = req.query

  if (date) {
    const target = new Date(date)
    filtered = result.data.filter((s) => {
      const saleDate = new Date(s.createdAt)
      if (period === "daily") return saleDate.toDateString() === target.toDateString()
      if (period === "monthly") return saleDate.getMonth() === target.getMonth() && saleDate.getFullYear() === target.getFullYear()
      if (period === "yearly") return saleDate.getFullYear() === target.getFullYear()
      return saleDate.toDateString() === target.toDateString()
    })
  }

  if (dateFrom) filtered = filtered.filter((s) => new Date(s.createdAt) >= new Date(dateFrom))
  if (dateTo) filtered = filtered.filter((s) => new Date(s.createdAt) <= new Date(dateTo))

  const revenue = filtered.reduce((sum, s) => sum + s.total, 0)
  res.json({ sales: filtered, summary: { totalSales: filtered.length, revenue } })
}

exports.inventoryReport = async (req, res) => {
  const products = await client.query(ref("products:list"), {})
  const lowStock = products.data.filter((p) => p.stock <= 10)
  res.json({
    lowStock,
    summary: {
      totalProducts: products.total,
      lowStockCount: lowStock.length,
      totalValue: products.data.reduce((sum, p) => sum + p.price * p.stock, 0),
    },
  })
}

exports.profitsReport = async (req, res) => {
  const { dateFrom, dateTo } = req.query
  const result = await client.query(ref("sales:list"), { dateFrom, dateTo })
  let filtered = result.data

  const productCosts = {}
  const products = await client.query(ref("products:list"), {})
  products.data.forEach((p) => { productCosts[p._id] = p.cost || 0 })

  let revenue = 0
  let cost = 0
  for (const sale of filtered) {
    for (const item of sale.items) {
      revenue += item.total
      cost += (productCosts[item.productId] || 0) * item.qty
    }
  }

  res.json({ revenue, cost, profit: revenue - cost, totalSales: filtered.length })
}
