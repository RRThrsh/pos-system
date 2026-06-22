const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

async function request(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  const data = await res.json()

  if (!res.ok) throw { status: res.status, message: data.message || 'Request failed' }
  return data
}

async function requestBlob(endpoint, options = {}) {
  const token = localStorage.getItem('token')
  const headers = { ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers })
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    throw { status: res.status, message: data.message || 'Request failed' }
  }
  const blob = await res.blob()
  const disposition = res.headers.get('Content-Disposition')
  const match = disposition && disposition.match(/filename="(.+)"/)
  const filename = match ? match[1] : `pos-backup-${new Date().toISOString().slice(0, 10)}.xlsx`
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const authApi = {
  login: (username, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),
  register: (payload) =>
    request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  forgotPassword: (email) =>
    request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),
}

export const usersApi = {
  getAll: () => request('/users'),
  create: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/users/${id}`, { method: 'PATCH', body: JSON.stringify(payload) }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
}

export const productsApi = {
  getAll: (params) => request(`/products?${new URLSearchParams(params)}`),
  getById: (id) => request(`/products/${id}`),
  create: (payload) => request('/products', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/products/${id}`, { method: 'DELETE' }),
}

export const categoriesApi = {
  getAll: () => request('/categories'),
  create: (payload) => request('/categories', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/categories/${id}`, { method: 'DELETE' }),
}

export const salesApi = {
  getAll: (params) => request(`/sales?${new URLSearchParams(params)}`),
  getById: (id) => request(`/sales/${id}`),
  create: (payload) => request('/sales', { method: 'POST', body: JSON.stringify(payload) }),
  voidSale: (id) => request(`/sales/${id}/void`, { method: 'POST' }),
}

export const inventoryApi = {
  getMovements: (params) => request(`/inventory?${new URLSearchParams(params)}`),
  adjust: (payload) => request('/inventory/adjust', { method: 'POST', body: JSON.stringify(payload) }),
}

export const suppliersApi = {
  getAll: (params) => request(`/suppliers?${new URLSearchParams(params)}`),
  getById: (id) => request(`/suppliers/${id}`),
  create: (payload) => request('/suppliers', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/suppliers/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/suppliers/${id}`, { method: 'DELETE' }),
  productsBySupplier: (id) => request(`/suppliers/${id}/products`),
  compareByProduct: (params) => request(`/suppliers/compare/product?${new URLSearchParams(params)}`),
  setProductPrice: (payload) => request('/suppliers/products/price', { method: 'POST', body: JSON.stringify(payload) }),
}

export const auditLogsApi = {
  getAll: (params) => request(`/audit-logs?${new URLSearchParams(params)}`),
}

export const reportsApi = {
  summary: () => request('/reports/summary'),
  sales: (params) => request(`/reports/sales?${new URLSearchParams(params)}`),
  inventory: () => request('/reports/inventory'),
  profits: (params) => request(`/reports/profits?${new URLSearchParams(params)}`),
  bestSellers: (params) => request(`/reports/best-sellers?${new URLSearchParams(params)}`),
  dailySummaries: (params) => request(`/reports/daily-summaries?${new URLSearchParams(params)}`),
  paymentMethods: (params) => request(`/reports/payment-methods?${new URLSearchParams(params)}`),
  hourlySales: (params) => request(`/reports/hourly-sales?${new URLSearchParams(params)}`),
  activeUsers: () => request('/reports/active-users'),
  categorySales: (params) => request(`/reports/category-sales?${new URLSearchParams(params)}`),
}

export const configApi = {
  getAll: () => request('/config'),
  get: (key) => request(`/config/${key}`),
  set: (key, value) => request('/config/set', { method: 'POST', body: JSON.stringify({ key, value }) }),
  systemInfo: () => request('/config/system-info'),
  resetAuditLogs: () => request('/config/reset-audit-logs', { method: 'POST' }),
  backup: () => requestBlob('/config/backup', { method: 'POST' }),
}

export const permissionsApi = {
  getAll: () => request('/permissions'),
  getMyPermissions: () => request('/permissions/my'),
  getByRole: (role) => request(`/permissions/${role}`),
  set: (payload) => request('/permissions/set', { method: 'POST', body: JSON.stringify(payload) }),
  seedDefaults: () => request('/permissions/seed', { method: 'POST' }),
}

export const purchaseOrdersApi = {
  getAll: (params) => request(`/purchase-orders?${new URLSearchParams(params)}`),
  getById: (id) => request(`/purchase-orders/${id}`),
  create: (payload) => request('/purchase-orders', { method: 'POST', body: JSON.stringify(payload) }),
  updateStatus: (id, status) => request(`/purchase-orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  remove: (id) => request(`/purchase-orders/${id}`, { method: 'DELETE' }),
}

export const expensesApi = {
  getAll: (params) => request(`/expenses?${new URLSearchParams(params)}`),
  create: (payload) => request('/expenses', { method: 'POST', body: JSON.stringify(payload) }),
  remove: (id) => request(`/expenses/${id}`, { method: 'DELETE' }),
}

export const promoCodesApi = {
  getAll: () => request('/promo-codes'),
  getByCode: (code) => request(`/promo-codes/${code}`),
  create: (payload) => request('/promo-codes', { method: 'POST', body: JSON.stringify(payload) }),
  toggleActive: (id, isActive) => request(`/promo-codes/${id}/toggle`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  remove: (id) => request(`/promo-codes/${id}`, { method: 'DELETE' }),
}

export function downloadCSV(headers, rows, filename) {
  const csv = [headers.join(','), ...rows.map((r) => headers.map((h) => { const v = r[h]; const s = String(v ?? ''); return s.includes(',') || s.includes('"') ? `"${s.replace(/"/g, '""')}"` : s }).join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}
