const { client, ref } = require("../convex")
const audit = require("../services/audit")
const { clearPermCache } = require("../middleware/auth")

exports.getAll = async (req, res) => {
  const perms = await client.query(ref("permissions:list"))
  res.json(perms)
}

exports.getByRole = async (req, res) => {
  const { role } = req.params
  if (!["admin", "cashier"].includes(role)) {
    return res.status(400).json({ message: "Invalid role." })
  }
  const perms = await client.query(ref("permissions:getByRole"), { role })
  res.json(perms)
}

exports.getByRoleAndPage = async (req, res) => {
  const { role, page } = req.params
  const perm = await client.query(ref("permissions:getByRoleAndPage"), { role, page })
  if (!perm) return res.status(404).json({ message: "Permission not found." })
  res.json(perm)
}

exports.getMyPermissions = async (req, res) => {
  const role = req.user.role
  if (role === 'superadmin') {
    const ALL_PAGES = [
      "Dashboard", "Products", "Categories", "Sales",
      "Inventory", "Reports", "Users", "Suppliers", "Returns",
      "Audit Logs", "Config", "Permissions", "Monitoring",
      "Snapshots", "Analytics",
    ]
    return res.json(ALL_PAGES.map((p) => ({ page: p, canRead: true, canWrite: true, canExecute: true })))
  }
  const perms = await client.query(ref("permissions:getByRole"), { role })
  res.json(perms)
}

exports.set = async (req, res) => {
  const { role, page, canRead, canWrite, canExecute } = req.body
  if (!role || !page) return res.status(400).json({ message: "Role and page are required." })
  if (role === "superadmin") return res.status(403).json({ message: "Superadmin permissions are fixed." })
  await client.mutation(ref("permissions:set"), { role, page, canRead, canWrite, canExecute })
  clearPermCache()
  await audit.log("update_permission", req, { details: `Set ${role} ${page} R:${canRead} W:${canWrite} X:${canExecute}`, itemName: `${role}/${page}` })
  res.json({ message: "Permission updated." })
}

exports.seedDefaults = async (req, res) => {
  const result = await client.mutation(ref("permissions:seedDefaults"))
  clearPermCache()
  await audit.log("seed_permissions", req, { details: `Seeded ${result.count} default permissions` })
  res.json(result)
}
