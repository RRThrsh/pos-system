import { useState, useEffect, useRef } from 'react'
import { auditLogsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const actionStyle = {
  login: 'text-[#3fb950]', login_failed: 'text-[#f85149]', logout: 'text-[#8b949e]',
  create_sale: 'text-[#58a6ff]', void_sale: 'text-[#d29922]',
  create_user: 'text-[#bc8cff]', update_user: 'text-[#bc8cff]', delete_user: 'text-[#f85149]',
  create_product: 'text-[#39d2c0]', update_product: 'text-[#39d2c0]', delete_product: 'text-[#f85149]',
  create_category: 'text-[#56d4dd]', update_category: 'text-[#56d4dd]', delete_category: 'text-[#f85149]',
  create_supplier: 'text-[#7ee787]', update_supplier: 'text-[#7ee787]', delete_supplier: 'text-[#f85149]',
  adjust_inventory: 'text-[#d29922]', set_supplier_price: 'text-[#f0883e]',
}

const actionLabels = {
  login: 'LOGIN', login_failed: 'LOGIN_FAIL', logout: 'LOGOUT',
  create_sale: 'SALE', void_sale: 'VOID',
  create_user: 'USER+', update_user: 'USER~', delete_user: 'USER-',
  create_product: 'PROD+', update_product: 'PROD~', delete_product: 'PROD-',
  create_category: 'CAT+', update_category: 'CAT~', delete_category: 'CAT-',
  create_supplier: 'SUPP+', update_supplier: 'SUPP~', delete_supplier: 'SUPP-',
  adjust_inventory: 'INV', set_supplier_price: 'PRICE',
}

function AuditLogs() {
  const { addToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const scrollRef = useRef(null)

  const load = () => {
    setLoading(true)
    auditLogsApi.getAll({ limit: '500' })
      .then((res) => { setLogs(res.data || []) })
      .catch((err) => addToast(err.message || 'Failed to load', 'error'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <h1 className="text-2xl font-bold text-gray-800 mb-4 shrink-0">Audit Logs</h1>

      {loading ? <Spinner /> : (
        <div ref={scrollRef} className="flex-1 bg-[#0d1117] rounded-lg border border-[#30363d] overflow-y-auto font-mono text-xs p-4 leading-5">
          {logs.length === 0 ? (
            <p className="text-[#8b949e] text-center pt-8">No audit logs yet.</p>
          ) : (
            logs.map((log) => {
              const st = actionStyle[log.action] || 'text-[#8b949e]'
              const label = actionLabels[log.action] || log.action.toUpperCase().slice(0, 8)
              const time = new Date(log.createdAt).toLocaleDateString('en-US', {
                year: 'numeric', month: '2-digit', day: '2-digit',
                hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
              })
              return (
                <div key={log._id} className="flex gap-3 hover:bg-[#161b22] px-1 rounded">
                  <span className="text-[#484f58] shrink-0 w-[165px]">{time}</span>
                  <span className="text-[#8b949e] shrink-0 w-[90px] truncate" title={log.username}>{log.username}</span>
                  <span className={`${st} shrink-0 w-[70px] font-bold`}>[{label}]</span>
                  <span className="text-[#c9d1d9] truncate">{log.details || '—'}</span>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}

export default AuditLogs
