const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const notifications = await client.query(ref("notifications:list"), { userId: req.query.userId || undefined, limit: Number(req.query.limit) || 20 })
  res.json(notifications)
}

exports.countUnread = async (req, res) => {
  const count = await client.query(ref("notifications:countUnread"), { userId: req.user?.id })
  res.json({ count })
}

exports.markRead = async (req, res) => {
  await client.mutation(ref("notifications:markRead"), { id: req.params.id })
  res.json({ message: "Marked as read" })
}

exports.markAllRead = async (req, res) => {
  await client.mutation(ref("notifications:markAllRead"), { userId: req.user?.id })
  res.json({ message: "All marked as read" })
}
