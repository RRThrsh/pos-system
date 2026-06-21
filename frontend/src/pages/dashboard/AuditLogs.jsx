import { useState, useEffect } from 'react'
import { auditLogsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const actionLabels = {
  login: { label: 'Login', color: 'text-green-600 bg-green-100' },
  login_failed: { label: 'Login Failed', color: 'text-red-600 bg-red-100' },
  logout: { label: 'Logout', color: 'text-gray-600 bg-gray-100' },
  create_sale: { label: 'Sale', color: 'text-blue-600 bg-blue-100' },
  void_sale: { label: 'Void', color: 'text-orange-600 bg-orange-100' },
  create_user: { label: 'Created User', color: 'text-indigo-600 bg-indigo-100' },
  update_user: { label: 'Updated User', color: 'text-indigo-600 bg-indigo-100' },
  delete_user: { label: 'Deleted User', color: 'text-red-600 bg-red-100' },
  create_product: { label: 'Created Product', color: 'text-purple-600 bg-purple-100' },
  update_product: { label: 'Updated Product', color: 'text-purple-600 bg-purple-100' },
  delete_product: { label: 'Deleted Product', color: 'text-red-600 bg-red-100' },
  create_category: { label: 'Created Category', color: 'text-teal-600 bg-teal-100' },
  update_category: { label: 'Updated Category', color: 'text-teal-600 bg-teal-100' },
  delete_category: { label: 'Deleted Category', color: 'text-red-600 bg-red-100' },
  create_supplier: { label: 'Created Supplier', color: 'text-cyan-600 bg-cyan-100' },
  update_supplier: { label: 'Updated Supplier', color: 'text-cyan-600 bg-cyan-100' },
  delete_supplier: { label: 'Deleted Supplier', color: 'text-red-600 bg-red-100' },
  adjust_inventory: { label: 'Inventory Adj.', color: 'text-yellow-600 bg-yellow-100' },
  set_supplier_price: { label: 'Supplier Price', color: 'text-pink-600 bg-pink-100' },
}

function AuditLogs() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionFilter, setActionFilter] = useState('')
  const [total, setTotal] = useState(0)

  const load = (action) => {
    setLoading(true)
    const params = { limit: '100' }
    if (action) params.action = action
    auditLogsApi.getAll(params)
      .then((res) => { setLogs(res.data || []); setTotal(res.total || 0) })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load(actionFilter) }, [actionFilter])

  const allActions = Object.keys(actionLabels)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Audit Logs</h1>

      <div className="mb-4 flex items-center gap-3 flex-wrap">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
          <option value="">All Actions ({total})</option>
          {allActions.map((key) => (
            <option key={key} value={key}>{actionLabels[key].label}</option>
          ))}
        </select>
      </div>

      {loading ? <Spinner /> : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Timestamp</th>
                <th className="text-left px-4 py-3 font-medium">User</th>
                <th className="text-left px-4 py-3 font-medium">Action</th>
                <th className="text-left px-4 py-3 font-medium">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {logs.length === 0 ? (
                <tr><td colSpan={4} className="text-center py-8 text-gray-400">No audit logs yet.</td></tr>
              ) : (
                logs.map((log) => {
                  const act = actionLabels[log.action] || { label: log.action, color: 'text-gray-600 bg-gray-100' }
                  return (
                    <tr key={log._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                        {new Date(log.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-4 py-3 text-gray-900 font-medium">{log.username}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${act.color}`}>
                          {act.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 max-w-md truncate">{log.details || '—'}</td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default AuditLogs
