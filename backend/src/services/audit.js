const { client, ref } = require("../convex")

async function log(action, req, extra = {}) {
  const user = req.user || {}
  const details = [extra.details || ""]
  if (extra.itemName) details.push(`item: ${extra.itemName}`)
  if (extra.itemId) details.push(`id: ${extra.itemId}`)

  try {
    await client.mutation(ref("auditLogs:create"), {
      userId: user.id || undefined,
      username: user.username || extra.username || "system",
      action,
      details: details.filter(Boolean).join(" | ") || undefined,
      ip: req.ip || req.connection?.remoteAddress || "",
    })
  } catch (err) {
    console.error("Audit log failed:", err.message)
  }
}

module.exports = { log }
