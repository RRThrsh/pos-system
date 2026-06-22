import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { permissionsApi } from '../services/api.js'

const CACHE_TTL = 5 * 60 * 1000
let cachedList = null
let cachedAt = 0

export function clearPermCache() {
  cachedList = null
  cachedAt = 0
}

export function usePermission(page) {
  const { user } = useAuth()
  const role = user?.role
  const [perm, setPerm] = useState(null)

  useEffect(() => {
    if (!role || role === 'superadmin') {
      setPerm({ canRead: true, canWrite: true, canExecute: true })
      return
    }
    if (cachedList && Date.now() - cachedAt < CACHE_TTL) {
      const found = cachedList.find((p) => p.page === page)
      setPerm(found || { canRead: true, canWrite: false, canExecute: false })
      return
    }
    permissionsApi.getMyPermissions()
      .then((list) => {
        cachedList = list
        cachedAt = Date.now()
        const found = list.find((p) => p.page === page)
        setPerm(found || { canRead: true, canWrite: false, canExecute: false })
      })
      .catch(() => setPerm({ canRead: true, canWrite: false, canExecute: false }))
  }, [role, page])

  return perm || { canRead: true, canWrite: false, canExecute: false }
}
