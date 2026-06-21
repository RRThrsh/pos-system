const { client, ref } = require("../convex")

function periodMatch(saleDate, period, dateStr) {
  const target = new Date(dateStr || Date.now())
  if (period === "daily") return saleDate.toDateString() === target.toDateString()
  if (period === "weekly") {
    const start = new Date(target)
    start.setDate(start.getDate() - start.getDay())
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    return saleDate >= start && saleDate <= new Date(end.toDateString())
  }
  if (period === "monthly") return saleDate.getMonth() === target.getMonth() && saleDate.getFullYear() === target.getFullYear()
  if (period === "yearly") return saleDate.getFullYear() === target.getFullYear()
  return saleDate.toDateString() === target.toDateString()
}

function filterByPeriod(sales, period, date) {
  return sales.filter((s) => periodMatch(new Date(s.createdAt), period, date))
}

exports.salesReport = async (req, res) => {
  const { period = "daily", date } = req.query
  const result = await client.query(ref("sales:list"), {})
  const filtered = filterByPeriod(result.data, period, date)

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

exports.summary = async (req, res) => {
  const [allSales, allProducts, users] = await Promise.all([
    client.query(ref("sales:list"), { limit: 99999 }),
    client.query(ref("products:list"), { limit: 99999 }),
    client.query(ref("users:list")),
  ])

  const salesData = allSales.data
  const productsData = allProducts.data

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todaySales = salesData.filter((s) => new Date(s.createdAt) >= today)
  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
  const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0)
  const lowStockCount = productsData.filter((p) => p.stock <= 10).length

  res.json({
    todaySales: todaySales.length,
    todayRevenue,
    totalSales: allSales.total,
    totalRevenue,
    totalProducts: allProducts.total,
    lowStockCount,
    totalUsers: users.length,
  })
}

exports.bestSellers = async (req, res) => {
  const { period = "daily", date, limit = 20 } = req.query
  const result = await client.query(ref("sales:list"), {})
  const filtered = filterByPeriod(result.data, period, date)

  const productMap = {}
  for (const sale of filtered) {
    for (const item of sale.items || []) {
      const id = item.productId
      if (!productMap[id]) productMap[id] = { productId: id, productName: item.productName || item.name || 'Unknown', qty: 0, revenue: 0 }
      productMap[id].qty += item.qty || item.quantity || 0
      productMap[id].revenue += item.total || (item.price * (item.qty || item.quantity || 0))
    }
  }

  const sorted = Object.values(productMap).sort((a, b) => b.qty - a.qty).slice(0, Number(limit))
  res.json({ bestSellers: sorted })
}

exports.dailySummaries = async (req, res) => {
  const { period = "daily", date } = req.query
  const result = await client.query(ref("sales:list"), {})
  const filtered = filterByPeriod(result.data, period, date)

  const dayMap = {}
  for (const sale of filtered) {
    const day = new Date(sale.createdAt).toDateString()
    if (!dayMap[day]) dayMap[day] = { date: day, sales: 0, revenue: 0, orders: 0 }
    dayMap[day].sales++
    dayMap[day].revenue += sale.total || 0
    dayMap[day].orders += (sale.items || []).reduce((s, i) => s + (i.qty || i.quantity || 0), 0)
  }

  const sorted = Object.values(dayMap).sort((a, b) => new Date(b.date) - new Date(a.date))
  res.json({ dailySummaries: sorted })
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
