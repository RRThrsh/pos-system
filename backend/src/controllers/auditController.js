const { client, ref } = require("../convex")

exports.getAll = async (req, res) => {
  const { limit = 50, offset = 0, action, dateFrom, dateTo } = req.query
  const result = await client.query(ref("auditLogs:list"), {
    limit: Number(limit),
    offset: Number(offset),
    action,
    dateFrom,
    dateTo,
  })
  res.json(result)
}
