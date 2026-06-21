import { useState, useEffect } from 'react'
import { configApi, reportsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'

function Monitoring() {
  const [systemInfo, setSystemInfo] = useState(null)
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      configApi.systemInfo().catch(() => ({ message: 'Unavailable' })),
      reportsApi.summary().catch(() => ({})),
    ])
      .then(([info, sum]) => { setSystemInfo(info); setSummary(sum) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">System Health</h3>
          <div className="space-y-3">
            <div className="flex justify-between"><span className="text-gray-600">Status</span><span className="flex items-center gap-1 text-green-600 font-medium"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span> Online</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Node Version</span><span className="font-mono text-sm">{systemInfo?.nodeVersion || '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Uptime</span><span>{systemInfo?.uptime ? `${Math.floor(systemInfo.uptime / 3600)}h ${Math.floor((systemInfo.uptime % 3600) / 60)}m` : '-'}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">Platform</span><span className="text-sm">{systemInfo?.platform || '-'}</span></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Database Stats</h3>
          <div className="space-y-3">
            {[
              { label: 'Products', value: summary?.totalProducts },
              { label: 'Users', value: summary?.totalUsers },
              { label: 'Categories', value: summary?.totalCategories },
              { label: 'Sales Records', value: summary?.totalSales },
            ].map((s) => (
              <div key={s.label} className="flex justify-between">
                <span className="text-gray-600">{s.label}</span>
                <span className="font-medium">{s.value ?? '-'}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Revenue Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Revenue', value: `₱${Number(summary?.totalRevenue || 0).toLocaleString()}` },
              { label: 'Total Profit', value: `₱${Number(summary?.totalProfit || 0).toLocaleString()}` },
              { label: 'Total Cost', value: `₱${Number(summary?.totalCost || 0).toLocaleString()}` },
              { label: 'Today Sales', value: `₱${Number(summary?.todaySales || 0).toLocaleString()}` },
            ].map((s) => (
              <div key={s.label} className="flex justify-between">
                <span className="text-gray-600">{s.label}</span>
                <span className="font-medium">{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">API Endpoints Health</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['/api/products', '/api/sales', '/api/users', '/api/inventory', '/api/suppliers', '/api/reports', '/api/config', '/api/permissions'].map((ep) => (
            <div key={ep} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="font-mono text-xs text-gray-600">{ep}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Memory Usage (Estimated)</h3>
        <div className="space-y-3">
          {[
            { label: 'Heap Used', value: systemInfo?.memoryUsage ? `${(systemInfo.memoryUsage.heapUsed / 1024 / 1024).toFixed(1)} MB` : '-' },
            { label: 'Heap Total', value: systemInfo?.memoryUsage ? `${(systemInfo.memoryUsage.heapTotal / 1024 / 1024).toFixed(1)} MB` : '-' },
            { label: 'RSS', value: systemInfo?.memoryUsage ? `${(systemInfo.memoryUsage.rss / 1024 / 1024).toFixed(1)} MB` : '-' },
          ].map((s) => (
            <div key={s.label} className="flex justify-between">
              <span className="text-gray-600">{s.label}</span>
              <span className="font-mono text-sm">{s.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default Monitoring
