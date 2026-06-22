import { useState, useEffect } from 'react'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'
import { configApi } from '../../services/api.js'
import { SHORTCUT_ACTIONS, getDefaultShortcuts } from '../../constants/shortcuts.js'

function Config() {
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [maintenanceMode, setMaintenanceMode] = useState(false)
  const [registrationOpen, setRegistrationOpen] = useState(true)
  const [systemInfo, setSystemInfo] = useState(null)
  const [backupLoading, setBackupLoading] = useState(false)
  const [fullBackupLoading, setFullBackupLoading] = useState(false)
  const [shortcuts, setShortcuts] = useState(getDefaultShortcuts())
  const [shortcutSaving, setShortcutSaving] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const [cacheCleared, setCacheCleared] = useState(false)

  useEffect(() => {
    Promise.all([
      configApi.getAll().catch(() => ({})),
      configApi.systemInfo().catch(() => null),
    ])
      .then(([config, info]) => {
        setMaintenanceMode(config.maintenanceMode === 'true')
        setRegistrationOpen(config.registrationOpen !== 'false')
        setSystemInfo(info)
      })
      .catch(() => addToast('Failed to load config', 'error'))
    configApi.get('shortcuts').then((res) => {
      if (res && res.value) {
        try { const parsed = JSON.parse(res.value); setShortcuts(parsed) } catch {}
      }
    }).catch(() => {})
    setLoading(false)
  }, [])

  const toggleMaintenance = async () => {
    const next = !maintenanceMode
    try {
      await configApi.set('maintenanceMode', String(next))
      setMaintenanceMode(next)
      addToast(`Maintenance mode ${next ? 'enabled' : 'disabled'}`, 'success')
    } catch (err) {
      addToast(err.message || 'Failed to update', 'error')
    }
  }

  const toggleRegistration = async () => {
    const next = !registrationOpen
    try {
      await configApi.set('registrationOpen', String(next))
      setRegistrationOpen(next)
      addToast(`Registration ${next ? 'opened' : 'closed'}`, 'success')
    } catch (err) {
      addToast(err.message || 'Failed to update', 'error')
    }
  }

  const handleResetAuditLogs = async () => {
    if (!window.confirm('Are you sure you want to delete ALL audit logs? This cannot be undone.')) return
    setResetLoading(true)
    try {
      await configApi.resetAuditLogs()
      addToast('All audit logs cleared', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to reset', 'error')
    } finally {
      setResetLoading(false)
    }
  }

  const handleClearCache = () => {
    localStorage.clear()
    sessionStorage.clear()
    setCacheCleared(true)
    addToast('Local cache cleared', 'success')
    setTimeout(() => setCacheCleared(false), 3000)
  }

  const handleShortcutChange = (id, newKey) => {
    setShortcuts((prev) => ({ ...prev, [id]: { ...prev[id], key: newKey } }))
  }

  const handleSaveShortcuts = async () => {
    setShortcutSaving(true)
    try {
      await configApi.set('shortcuts', JSON.stringify(shortcuts))
      addToast('Shortcuts saved', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to save shortcuts', 'error')
    } finally {
      setShortcutSaving(false)
    }
  }

  const handleResetShortcuts = async () => {
    const defaults = getDefaultShortcuts()
    setShortcuts(defaults)
    try {
      await configApi.set('shortcuts', JSON.stringify(defaults))
      addToast('Shortcuts reset to defaults', 'success')
    } catch (err) {
      addToast(err.message || 'Failed to reset shortcuts', 'error')
    }
  }

  const handleBackup = async (full) => {
    const fn = full ? setFullBackupLoading : setBackupLoading
    fn(true)
    try {
      await configApi.backup(full)
      addToast(`${full ? 'Full ' : ''}Backup downloaded`, 'success')
    } catch (err) {
      addToast(err.message || 'Backup failed', 'error')
    } finally {
      fn(false)
    }
  }

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Maintenance Mode</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${maintenanceMode ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${maintenanceMode ? 'bg-red-500' : 'bg-green-500'}`} />
              {maintenanceMode ? 'Active' : 'Inactive'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">When enabled, only superadmins can access the system. All other users will be blocked.</p>
          <button onClick={toggleMaintenance} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${maintenanceMode ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
            {maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">User Registration</h3>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${registrationOpen ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${registrationOpen ? 'bg-green-500' : 'bg-red-500'}`} />
              {registrationOpen ? 'Open' : 'Closed'}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-4">Control whether new users can register themselves through the registration page.</p>
          <button onClick={toggleRegistration} className={`px-4 py-2 rounded-lg text-sm font-medium text-white transition-colors ${registrationOpen ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {registrationOpen ? 'Close Registration' : 'Open Registration'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Audit Logs</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-4">Permanently delete all audit log entries. This action cannot be undone.</p>
          <button onClick={handleResetAuditLogs} disabled={resetLoading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 transition-colors">
            {resetLoading ? 'Clearing...' : 'Reset Audit Logs'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Clear Cache</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-4">Clear all locally stored data (tokens, preferences, cached data). You will need to log in again.</p>
          <button onClick={handleClearCache} disabled={cacheCleared} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:opacity-50 transition-colors">
            {cacheCleared ? 'Cleared' : 'Clear Cache'}
          </button>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Backup</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 9.776c.112-.017.227-.026.344-.026h15.812c.117 0 .232.009.344.026m-16.5 0a2.25 2.25 0 00-1.883 2.542l.857 6a2.25 2.25 0 002.227 1.932H19.05a2.25 2.25 0 002.227-1.932l.857-6a2.25 2.25 0 00-1.883-2.542m-16.5 0V6A2.25 2.25 0 016 3.75h3.879a1.5 1.5 0 011.06.44l2.122 2.12a1.5 1.5 0 001.06.44H18A2.25 2.25 0 0120.25 9v.776" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-4">Export all system data (users, products, sales, inventory, audit logs). Full backup also includes customers, stock counts, and price history.</p>
          <div className="flex gap-2">
            <button onClick={() => handleBackup(false)} disabled={backupLoading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {backupLoading ? 'Exporting...' : 'Download Backup'}
            </button>
            <button onClick={() => handleBackup(true)} disabled={fullBackupLoading} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-gray-700 hover:bg-gray-800 disabled:opacity-50 transition-colors">
              {fullBackupLoading ? 'Exporting...' : 'Full Backup'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">Shortcut Keys</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.431.992a7.723 7.723 0 0 1 0 .255c-.007.378.138.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.378-.138-.75-.43-.991l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
            </svg>
          </div>
          <p className="text-sm text-gray-500 mb-4">Customize POS keyboard shortcuts. Press a key to change. Defaults: F2=Charge, F3=Scan, F4=Quick Keys, Esc=Close.</p>
          <div className="space-y-2 mb-3">
            {SHORTCUT_ACTIONS.map((action) => (
              <div key={action.id} className="flex items-center gap-3 text-sm">
                <div className="flex-1">
                  <span className="font-medium text-gray-800">{action.label}</span>
                  <p className="text-xs text-gray-400">{action.description}</p>
                </div>
                <input
                  value={shortcuts[action.id]?.key || ''}
                  onChange={(e) => {
                    const val = e.target.value
                    if (val.length <= 20) handleShortcutChange(action.id, val)
                  }}
                  placeholder="Key"
                  className="w-28 text-center border border-gray-300 rounded-lg px-2 py-1.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  onKeyDown={(e) => { e.preventDefault(); handleShortcutChange(action.id, e.key); e.target.blur() }}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={handleSaveShortcuts} disabled={shortcutSaving} className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
              {shortcutSaving ? 'Saving...' : 'Save Shortcuts'}
            </button>
            <button onClick={handleResetShortcuts} className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 border border-gray-300 hover:bg-gray-50 transition-colors">
              Reset to Default
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-800">System Info</h3>
            <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17l-5.44 5.44a1.5 1.5 0 01-2.12 0l-.88-.88a1.5 1.5 0 010-2.12l5.44-5.44m2.12-2.12l5.44-5.44a1.5 1.5 0 012.12 0l.88.88a1.5 1.5 0 010 2.12l-5.44 5.44m-6.36 1.42l1.42-1.42m3.54-3.54l1.42-1.42" />
            </svg>
          </div>
          {systemInfo ? (
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Node.js</span><span className="font-medium text-gray-800">{systemInfo.nodeVersion}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Platform</span><span className="font-medium text-gray-800 capitalize">{systemInfo.platform}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Uptime</span><span className="font-medium text-gray-800">{Math.floor(systemInfo.uptime / 60)}m {systemInfo.uptime % 60}s</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Users</span><span className="font-medium text-gray-800">{systemInfo.totalUsers}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Products</span><span className="font-medium text-gray-800">{systemInfo.totalProducts}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Total Sales</span><span className="font-medium text-gray-800">{systemInfo.totalSales.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Audit Log Entries</span><span className="font-medium text-gray-800">{systemInfo.auditLogCount.toLocaleString()}</span></div>
            </div>
          ) : (
            <p className="text-sm text-gray-400">Failed to load system info.</p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Config
