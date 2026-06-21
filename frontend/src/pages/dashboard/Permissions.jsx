import { useState, useEffect } from 'react'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { permissionsApi } from '../../services/api.js'
import { clearPermCache } from '../../hooks/usePermission.js'

const ALL_PAGES = [
  "Dashboard", "Products", "Categories", "Sales",
  "Inventory", "Reports", "Users", "Suppliers", "Returns",
  "Audit Logs", "Config", "Permissions", "Monitoring",
  "Snapshots", "Analytics", "Purchase Orders", "Expenses",
  "Promo Codes",
]

const ACTIONS = [
  { key: 'canRead', label: 'Read', color: 'bg-blue-500' },
  { key: 'canWrite', label: 'Write', color: 'bg-amber-500' },
  { key: 'canExecute', label: 'Execute', color: 'bg-red-500' },
]

function Permissions() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [entries, setEntries] = useState([])

  useEffect(() => {
    permissionsApi.seedDefaults()
      .catch(() => {})
      .then(() => permissionsApi.getByRole('admin'))
      .then((list) => {
        const map = {}
        for (const e of list) map[e.page] = e
        const merged = ALL_PAGES.map((page) => map[page] || { role: 'admin', page, canRead: false, canWrite: false, canExecute: false })
        setEntries(merged)
      })
      .catch(() => addToast('Failed to load permissions', 'error'))
      .finally(() => setLoading(false))
  }, [])

  const getPerm = (page) => entries.find((e) => e.page === page)

  const toggle = (page, key) => {
    setEntries((prev) =>
      prev.map((e) => (e.page === page ? { ...e, [key]: !e[key] } : e))
    )
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await Promise.all(
        entries.map((e) =>
          permissionsApi.set({ role: 'admin', page: e.page, canRead: e.canRead, canWrite: e.canWrite, canExecute: e.canExecute })
        )
      )
      clearPermCache()
      addToast('Permissions saved', 'success')
    } catch (err) {
      addToast(err.message || 'Save failed', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-semibold text-gray-700 min-w-[120px]">Page</th>
                <th colSpan={3} className="px-2 py-3 text-center font-semibold text-gray-700 capitalize border-l border-gray-200">Admin</th>
              </tr>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th />
                {ACTIONS.map((a) => (
                  <th key={a.key} className={`px-2 py-2 text-center text-xs font-medium text-gray-500 border-l border-gray-200`}>
                    {a.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PAGES.map((page, i) => (
                <tr key={page} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}>
                  <td className="px-4 py-3 font-medium text-gray-800 whitespace-nowrap">{page}</td>
                  {ACTIONS.map((a) => {
                    const p = getPerm(page)
                    const checked = p ? p[a.key] : false
                    return (
                      <td key={`admin-${page}-${a.key}`} className="px-2 py-3 text-center border-l border-gray-100">
                        <button
                          onClick={() => toggle(page, a.key)}
                          type="button"
                          className={`w-5 h-5 rounded border-2 inline-flex items-center justify-center transition-colors cursor-pointer ${checked ? `${a.color} border-transparent` : 'border-gray-300 bg-white'}`}
                        >
                          {checked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 8.25 6 6 9-9" />
                            </svg>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {saving ? 'Saving...' : 'Save Permissions'}
        </button>
      </div>
    </div>
  )
}

export default Permissions
