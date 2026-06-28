import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { productsApi, salesApi, reportsApi } from '../../services/api.js'
import { downloadCSV } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { ConfirmDialog } from '../../components/index.js'
import { useToast } from '../../context/ToastContext.jsx'

function Snapshots() {
  const [searchParams] = useSearchParams()
  const type = searchParams.get('type') || ''
  const { addToast } = useToast()
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState(null)
  const [csvConfirmOpen, setCsvConfirmOpen] = useState(false)

  useEffect(() => {
    if (!type) { setLoading(false); return }
    setLoading(true)
    const fetchers = {
      inventory: async () => {
        const res = await productsApi.getAll({ limit: '1000' })
        const products = res.products || res.data || res || []
        return {
          title: 'Inventory Snapshot',
          capturedAt: new Date().toISOString(),
          totalProducts: products.length,
          totalStock: products.reduce((s, p) => s + Number(p.stock || 0), 0),
          lowStock: products.filter((p) => Number(p.stock) <= 5).length,
          outOfStock: products.filter((p) => Number(p.stock) === 0).length,
          totalValue: products.reduce((s, p) => s + Number(p.stock || 0) * Number(p.cost || 0), 0),
          rows: products.map((p) => ({ name: p.name, sku: p.sku, stock: p.stock, cost: p.cost, value: Number(p.stock || 0) * Number(p.cost || 0) })),
        }
      },
      sales: async () => {
        const [summaryRes, dailyRes] = await Promise.all([reportsApi.summary().catch(() => ({})), reportsApi.dailySummaries({ period: 'monthly' }).catch(() => [])])
        const sales = Array.isArray(dailyRes) ? dailyRes : []
        const totalSales = sales.reduce((s, d) => s + Number(d.totalSales || 0), 0)
        const totalTransactions = sales.reduce((s, d) => s + Number(d.transactionCount || 0), 0)
        return {
          title: 'Sales Snapshot',
          capturedAt: new Date().toISOString(),
          totalSales,
          totalTransactions,
          averageOrderValue: totalTransactions > 0 ? totalSales / totalTransactions : 0,
          ...summaryRes,
          rows: sales,
        }
      },
      system: async () => {
        const res = await reportsApi.summary().catch(() => ({}))
        return {
          title: 'System Snapshot',
          capturedAt: new Date().toISOString(),
          totalProducts: res.totalProducts || 0,
          totalUsers: res.totalUsers || 0,
          totalCategories: res.totalCategories || 0,
          totalSales: res.totalSales || 0,
          totalRevenue: res.totalRevenue || 0,
          rows: [],
        }
      },
    }
    ;(fetchers[type] || (async () => ({ title: 'Snapshots', rows: [] })))()
      .then(setData)
      .catch(() => addToast('Failed to load snapshot', 'error'))
      .finally(() => setLoading(false))
  }, [type])

  if (!type) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-gray-500 py-12">
          <svg className="mx-auto h-12 w-12 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
          </svg>
          <p className="text-lg font-medium">Select a snapshot type from the sidebar</p>
          <p className="text-sm mt-1">Snapshots capture a point-in-time view of your data.</p>
        </div>
      </div>
    )
  }

  if (loading) return <Spinner />

  return (
    <div>
      <ConfirmDialog
        isOpen={csvConfirmOpen}
        onClose={() => setCsvConfirmOpen(false)}
        onConfirm={() => { downloadCSV(Object.keys(data.rows[0]), data.rows, `${type}-snapshot-${new Date().toISOString().slice(0, 10)}.csv`); setCsvConfirmOpen(false) }}
        title="Export Snapshot CSV"
        message="You are about to export this snapshot data to a CSV file."
        confirmText="Export"
      />

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold">{data?.title}</h2>
            <p className="text-sm text-gray-500">Captured: {data?.capturedAt ? new Date(data.capturedAt).toLocaleString() : ''}</p>
          </div>
          {data?.rows?.length > 0 && (
            <button onClick={() => setCsvConfirmOpen(true)} className="bg-gray-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-gray-700 min-w-[120px]">
              Export CSV
            </button>
          )}
        </div>

        {type === 'inventory' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[{ label: 'Total Products', value: data?.totalProducts }, { label: 'Total Stock', value: data?.totalStock?.toLocaleString() }, { label: 'Low Stock (≤5)', value: data?.lowStock, color: 'text-orange-600' }, { label: 'Out of Stock', value: data?.outOfStock, color: 'text-red-600' }, { label: 'Total Value', value: `₱${Number(data?.totalValue || 0).toLocaleString()}` }].map((c) => (
              <div key={c.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold ${c.color || ''}">{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {type === 'sales' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[{ label: 'Total Revenue', value: `₱${Number(data?.totalSales || 0).toLocaleString()}` }, { label: 'Transactions', value: data?.totalTransactions }, { label: 'Avg Order Value', value: `₱${Number(data?.averageOrderValue || 0).toLocaleString()}` }, { label: 'Period', value: 'Monthly' }].map((c) => (
              <div key={c.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {type === 'system' && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[{ label: 'Products', value: data?.totalProducts }, { label: 'Users', value: data?.totalUsers }, { label: 'Categories', value: data?.totalCategories }, { label: 'Total Sales', value: data?.totalSales }, { label: 'Revenue', value: `₱${Number(data?.totalRevenue || 0).toLocaleString()}` }].map((c) => (
              <div key={c.label} className="bg-gray-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold">{c.value}</div>
                <div className="text-xs text-gray-500 mt-1">{c.label}</div>
              </div>
            ))}
          </div>
        )}

        {data?.rows?.length > 0 && (
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead><tr className="bg-gray-50 border-b sticky top-0">{Object.keys(data.rows[0]).map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-gray-600 capitalize">{h}</th>)}</tr></thead>
              <tbody>
                {data.rows.map((r, i) => (
                  <tr key={i} className="border-b hover:bg-gray-50">
                    {Object.values(r).map((v, j) => <td key={j} className="px-4 py-2">{typeof v === 'number' ? v.toLocaleString() : String(v ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default Snapshots
