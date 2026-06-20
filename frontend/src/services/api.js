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
}

export const usersApi = {
  getAll: () => request('/users'),
  create: (payload) => request('/users', { method: 'POST', body: JSON.stringify(payload) }),
  update: (id, payload) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(payload) }),
  remove: (id) => request(`/users/${id}`, { method: 'DELETE' }),
}

export const reportsApi = {
  summary: () => request('/reports/summary'),
  sales: (params) => request(`/reports/sales?${new URLSearchParams(params)}`),
  inventory: () => request('/reports/inventory'),
  profits: (params) => request(`/reports/profits?${new URLSearchParams(params)}`),
}
