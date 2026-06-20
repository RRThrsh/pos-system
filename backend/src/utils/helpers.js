function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

function formatDate(date = new Date()) {
  return date.toISOString()
}

function paginate(array, page = 1, limit = 20) {
  const start = (page - 1) * limit
  const end = start + limit
  return {
    data: array.slice(start, end),
    total: array.length,
    page: Number(page),
    limit: Number(limit),
    totalPages: Math.ceil(array.length / limit),
  }
}

module.exports = { generateId, formatDate, paginate }
