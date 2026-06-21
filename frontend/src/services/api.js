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
  update: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
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
}

export const reportsApi = {
  summary: () => request('/reports/summary'),
  sales: (params) => request(`/reports/sales?${new URLSearchParams(params)}`),
  inventory: () => request('/reports/inventory'),
  profits: (params) => request(`/reports/profits?${new URLSearchParams(params)}`),
  bestSellers: (params) => request(`/reports/best-sellers?${new URLSearchParams(params)}`),
  dailySummaries: (params) => request(`/reports/daily-summaries?${new URLSearchParams(params)}`),
}
