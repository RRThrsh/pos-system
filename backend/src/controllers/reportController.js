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
  const lowStock = products.data.filter((p) => p.reorderPoint ? p.stock <= p.reorderPoint : p.stock <= 10)
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
  const [allSales, allProducts, users, allCategories] = await Promise.all([
    client.query(ref("sales:list"), { limit: 99999 }),
    client.query(ref("products:list"), { limit: 99999 }),
    client.query(ref("users:list")),
    client.query(ref("categories:list")),
  ])

  const salesData = allSales.data
  const productsData = allProducts.data

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const todaySales = salesData.filter((s) => new Date(s.createdAt) >= today)
  const yesterdaySales = salesData.filter((s) => {
    const d = new Date(s.createdAt)
    return d >= yesterday && d < today
  })

  const todayRevenue = todaySales.reduce((sum, s) => sum + s.total, 0)
  const yesterdayRevenue = yesterdaySales.reduce((sum, s) => sum + s.total, 0)
  const totalRevenue = salesData.reduce((sum, s) => sum + s.total, 0)
  const lowStockCount = productsData.filter((p) => p.reorderPoint ? p.stock <= p.reorderPoint : p.stock <= 10).length
  const voidedCount = salesData.filter((s) => s.status === "voided").length
  const todayVoidedCount = todaySales.filter((s) => s.status === "voided").length
  const todayDiscAmount = todaySales.reduce((sum, s) => sum + (s.discount || 0), 0)
  const todayItems = todaySales.reduce((sum, s) => sum + (s.items || []).reduce((a, i) => a + (i.qty || i.quantity || 0), 0), 0)
  const invValue = productsData.reduce((sum, p) => sum + p.price * p.stock, 0)

  res.json({
    todaySales: todaySales.length,
    todayRevenue,
    yesterdaySales: yesterdaySales.length,
    yesterdayRevenue,
    totalSales: allSales.total,
    totalRevenue,
    totalProducts: allProducts.total,
    lowStockCount,
    totalUsers: users.length,
    voidedCount,
    todayVoidedCount,
    todayDiscAmount,
    todayItems,
    inventoryValue: invValue,
    totalCategories: allCategories.length,
  })
}

exports.categorySales = async (req, res) => {
  const { period = "daily", date } = req.query
  const [salesRes, productsRes] = await Promise.all([
    client.query(ref("sales:list"), { limit: 99999 }),
    client.query(ref("products:list"), { limit: 99999 }),
  ])

  const productMap = {}
  for (const p of productsRes.data) {
    productMap[p._id] = p.category || "Uncategorized"
  }

  const filtered = filterByPeriod(salesRes.data, period, date)
  const catMap = {}
  for (const sale of filtered) {
    for (const item of sale.items || []) {
      const cat = productMap[item.productId] || "Uncategorized"
      if (!catMap[cat]) catMap[cat] = { category: cat, revenue: 0, count: 0 }
      catMap[cat].revenue += item.total || (item.price * (item.qty || item.quantity || 0))
      catMap[cat].count += item.qty || item.quantity || 0
    }
  }

  res.json({ categories: Object.values(catMap).sort((a, b) => b.revenue - a.revenue) })
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

exports.paymentMethods = async (req, res) => {
  const { period = "daily", date } = req.query
  const result = await client.query(ref("sales:list"), {})
  const filtered = filterByPeriod(result.data, period, date)

  const groups = {}
  for (const sale of filtered) {
    const method = sale.paymentMethod || "unknown"
    if (!groups[method]) groups[method] = { method, count: 0, revenue: 0 }
    groups[method].count++
    groups[method].revenue += sale.total || 0
  }

  res.json({ paymentMethods: Object.values(groups) })
}

exports.hourlySales = async (req, res) => {
  const { period = "daily", date } = req.query
  const result = await client.query(ref("sales:list"), {})
  const filtered = filterByPeriod(result.data, period, date)

  const hours = {}
  for (const sale of filtered) {
    const hour = new Date(sale.createdAt).getHours()
    if (!hours[hour]) hours[hour] = { hour, sales: 0, revenue: 0 }
    hours[hour].sales++
    hours[hour].revenue += sale.total || 0
  }

  const sorted = Array.from({ length: 24 }, (_, i) => hours[i] || { hour: i, sales: 0, revenue: 0 })
  res.json({ hourlySales: sorted })
}

exports.activeUsersToday = async (req, res) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const result = await client.query(ref("auditLogs:list"), {
    dateFrom: today.toISOString(),
    limit: 99999,
  })

  const unique = new Set()
  for (const log of result.data || []) {
    if (log.username) unique.add(log.username)
  }

  const now = new Date()
  const activeToday = Array.from(unique).map((username) => ({
    username,
    lastSeen: result.data.filter((l) => l.username === username).pop()?.createdAt || now.toISOString(),
  }))

  res.json({ count: activeToday.length, users: activeToday })
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

exports.profitAndLoss = async (req, res) => {
  const { dateFrom, dateTo } = req.query
  const [salesRes, expensesRes] = await Promise.all([
    client.query(ref("sales:list"), { dateFrom, dateTo }),
    client.query(ref("expenses:list"), { dateFrom, dateTo }),
  ])
  const sales = salesRes.data || []
  const expenses = expensesRes.data || []

  const totalRevenue = sales.reduce((s, sale) => s + sale.total, 0)
  const productCosts = {}
  const products = await client.query(ref("products:list"), {})
  products.data.forEach((p) => { productCosts[p._id] = p.cost || 0 })
  const cogs = sales.reduce((s, sale) => {
    return s + (sale.items || []).reduce((si, item) => si + (productCosts[item.productId] || 0) * item.qty, 0)
  }, 0)
  const grossProfit = totalRevenue - cogs
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)
  const netProfit = grossProfit - totalExpenses
  const voidedSales = sales.filter((s) => s.status === "voided").reduce((s, sale) => s + sale.total, 0)
  const totalDiscounts = sales.reduce((s, sale) => s + (sale.discount || 0), 0)

  const byCategory = {}
  for (const e of expenses) {
    const cat = e.category || "Other"
    if (!byCategory[cat]) byCategory[cat] = 0
    byCategory[cat] += e.amount
  }

  res.json({
    period: { dateFrom, dateTo },
    totalRevenue,
    cogs,
    grossProfit,
    grossMargin: totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0,
    totalExpenses,
    expensesByCategory: byCategory,
    netProfit,
    netMargin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
    totalTransactions: sales.length,
    voidedSales,
    totalDiscounts,
  })
}

exports.slowMoving = async (req, res) => {
  const { days = 90 } = req.query
  const threshold = Number(days)
  const [productsRes, salesRes] = await Promise.all([
    client.query(ref("products:list"), { limit: 99999 }),
    client.query(ref("sales:list"), { limit: 99999 }),
  ])
  const products = productsRes.data || []
  const sales = salesRes.data || []

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - threshold)

  const soldProductIds = new Set()
  for (const sale of sales) {
    if (new Date(sale.createdAt) >= cutoff) {
      for (const item of sale.items || []) {
        soldProductIds.add(item.productId)
      }
    }
  }

  const slowMovers = products
    .filter((p) => !soldProductIds.has(p._id) && p.stock > 0)
    .map((p) => ({
      productId: p._id,
      productName: p.name,
      sku: p.sku,
      stock: p.stock,
      price: p.price,
      cost: p.cost,
      value: p.price * p.stock,
      daysWithoutSale: threshold,
      category: p.category,
    }))
    .sort((a, b) => b.value - a.value)

  const deadStock = slowMovers.filter((p) => p.stock > 0)
  const totalValue = deadStock.reduce((s, p) => s + p.value, 0)

  res.json({ slowMovers, totalValue, totalItems: deadStock.length, thresholdDays: threshold })
}


