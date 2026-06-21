import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authApi } from '../services/api.js'

const AuthContext = createContext(null)

function getStorage() {
  return localStorage.getItem('remember') === 'true' ? localStorage : sessionStorage
}

function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storage = localStorage.getItem('remember') === 'true' ? localStorage : sessionStorage
    const token = storage.getItem('token')
    const stored = storage.getItem('user')
    if (token && stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        storage.removeItem('token')
        storage.removeItem('user')
        localStorage.removeItem('remember')
      }
    }
    setLoading(false)
  }, [])

  const login = useCallback(async (username, password, remember = false) => {
    const data = await authApi.login(username, password)
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('token', data.token)
    storage.setItem('user', JSON.stringify(data.user))
    if (remember) {
      localStorage.setItem('remember', 'true')
    } else {
      localStorage.removeItem('remember')
    }
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('remember')
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    setUser(null)
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me()
      setUser(data.user)
      const storage = getStorage()
      storage.setItem('user', JSON.stringify(data.user))
    } catch {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { AuthProvider, useAuth }
