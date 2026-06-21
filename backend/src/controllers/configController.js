const XLSX = require("xlsx")
const { client, ref } = require("../convex")
const audit = require("../services/audit")

exports.getAll = async (req, res) => {
  const configs = await client.query(ref("config:list"))
  const obj = {}
  for (const c of configs) obj[c.key] = c.value
  res.json(obj)
}

exports.get = async (req, res) => {
  const config = await client.query(ref("config:get"), { key: req.params.key })
  if (!config) return res.status(404).json({ message: "Config key not found." })
  res.json(config)
}

exports.set = async (req, res) => {
  const { key, value } = req.body
  if (!key) return res.status(400).json({ message: "Key is required." })
  await client.mutation(ref("config:set"), { key, value })
  await audit.log("update_config", req, { details: `Set config ${key} = ${value}`, itemName: key })
  res.json({ key, value, message: "Config updated." })
}

exports.resetAuditLogs = async (req, res) => {
  await client.mutation(ref("auditLogs:clearAll"))
  await audit.log("reset_audit_logs", req, { details: "All audit logs cleared" })
  res.json({ message: "All audit logs cleared." })
}

exports.systemInfo = async (req, res) => {
  const [users, products, sales, auditResult] = await Promise.all([
    client.query(ref("users:list")),
    client.query(ref("products:list"), { page: 1, limit: 1 }),
    client.query(ref("sales:list"), { page: 1, limit: 1 }),
    client.query(ref("auditLogs:list"), { limit: 1, offset: 0 }),
  ])
  res.json({
    nodeVersion: process.version,
    platform: process.platform,
    uptime: Math.floor(process.uptime()),
    totalUsers: users.length,
    totalProducts: products.total,
    totalSales: sales.total,
    auditLogCount: auditResult.total,
    timestamp: new Date().toISOString(),
  })
}

exports.backup = async (req, res) => {
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const isRecent = (item) => {
    const d = item.createdAt || item.updatedAt
    return d && d >= sevenDaysAgo
  }

  const [users, productsRes, categories, salesRes, suppliersRes, inventory, auditRes, configs] = await Promise.all([
    client.query(ref("users:list")),
    client.query(ref("products:list"), { page: 1, limit: 50000 }),
    client.query(ref("categories:list")),
    client.query(ref("sales:list"), { page: 1, limit: 50000 }),
    client.query(ref("suppliers:list"), { page: 1, limit: 50000 }),
    client.query(ref("inventory:list")),
    client.query(ref("auditLogs:list"), { limit: 50000, offset: 0 }),
    client.query(ref("config:list")),
  ])

  const sanitized = users.filter(isRecent).map(({ password, ...u }) => u)
  const products = (productsRes.data || []).filter(isRecent)
  const sales = (salesRes.data || []).filter(isRecent)
  const suppliers = (suppliersRes.data || []).filter(isRecent)
  const auditLogs = (auditRes.data || []).filter(isRecent)
  const movements = (inventory || []).filter(isRecent)
  const cats = (categories || []).filter(isRecent)
  const cfg = (configs || []).filter(isRecent)

  const wb = XLSX.utils.book_new()

  const sheets = {
    Users: sanitized,
    Products: products,
    Sales: sales,
    Categories: cats,
    Suppliers: suppliers,
    Inventory: movements,
    AuditLogs: auditLogs,
    Config: cfg,
  }

  for (const [name, data] of Object.entries(sheets)) {
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, name)
  }

  await audit.log("backup", req, { details: "7-day backup exported as Excel" })

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" })
  const filename = `pos-backup-7day-${new Date().toISOString().slice(0, 10)}.xlsx`
  res.set("Content-Disposition", `attachment; filename="${filename}"`)
  res.set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
  res.send(buf)
}
