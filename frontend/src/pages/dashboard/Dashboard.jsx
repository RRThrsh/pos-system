import { useState, useEffect } from 'react'
import { reportsApi, salesApi, productsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'

const cards = [
  { key: 'todaySales', label: 'Today Sales', color: 'bg-blue-500' },
  { key: 'todayRevenue', label: "Today's Revenue", prefix: '₱', color: 'bg-green-500' },
  { key: 'totalSales', label: 'Total Sales', color: 'bg-indigo-500' },
  { key: 'totalRevenue', label: 'Total Revenue', prefix: '₱', color: 'bg-teal-500' },
  { key: 'totalProducts', label: 'Total Products', color: 'bg-purple-500' },
  { key: 'lowStockCount', label: 'Low Stock Items', color: 'bg-orange-500' },
  { key: 'totalUsers', label: 'Total Users', color: 'bg-pink-500' },

]

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [recentSales, setRecentSales] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      reportsApi.summary(),
      salesApi.getAll({ limit: '5' }),
      productsApi.getAll({ limit: '200' }),
    ])
      .then(([summaryData, salesData, prodData]) => {
        setSummary(summaryData)
        setRecentSales(salesData.data || salesData.sales || salesData || [])
        const allProducts = prodData.products || prodData.data || prodData || []
        setLowStock(allProducts.filter((p) => p.stock <= 10))
      })
      .catch((err) => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
    )
  }

  const barData = [
    { label: 'Today Sales', value: summary?.todaySales || 0, color: 'bg-blue-500' },
    { label: 'Total Sales', value: summary?.totalSales || 0, color: 'bg-indigo-500' },
    { label: 'Products', value: summary?.totalProducts || 0, color: 'bg-purple-500' },

    { label: 'Users', value: summary?.totalUsers || 0, color: 'bg-pink-500' },
  ]
  const maxBar = Math.max(...barData.map((b) => b.value), 1)

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {cards.map((card) => {
          const value = summary?.[card.key]
          const display = card.prefix
            ? `${card.prefix}${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
            : Number(value || 0).toLocaleString()

          return (
            <div key={card.key} className="bg-white rounded-lg shadow p-5">
              <div className={`w-10 h-10 rounded-lg ${card.color} flex items-center justify-center mb-3`}>
                <span className="text-white text-lg font-bold">{card.label.charAt(0)}</span>
              </div>
              <p className="text-2xl font-bold text-gray-800">{display}</p>
              <p className="text-sm text-gray-500 mt-1">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Overview</h2>
          <div className="flex items-end gap-4 h-40">
            {barData.map((bar) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-gray-600">{bar.value}</span>
                <div
                  className={`w-full rounded-t ${bar.color} transition-all`}
                  style={{ height: `${(bar.value / maxBar) * 100}%`, minHeight: bar.value > 0 ? '8px' : '0' }}
                />
                <span className="text-xs text-gray-500 text-center leading-tight">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Low Stock Alerts</h2>
          {lowStock.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-6">All products are well-stocked.</p>
          ) : (
            <div className="space-y-2 max-h-52 overflow-auto">
              {lowStock.slice(0, 8).map((p) => (
                <div key={p._id || p.id} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700 truncate flex-1">{p.name}</span>
                  <span className={`ml-2 font-medium ${p.stock === 0 ? 'text-red-600' : 'text-orange-500'}`}>{p.stock}</span>
                </div>
              ))}
              {lowStock.length > 8 && (
                <p className="text-xs text-gray-400 text-center pt-1">+{lowStock.length - 8} more items</p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        {recentSales.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No recent sales.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Date</th>
                  <th className="text-left px-4 py-2 font-medium">Items</th>
                  <th className="text-right px-4 py-2 font-medium">Total</th>
                  <th className="text-left px-4 py-2 font-medium">Payment</th>
                  <th className="text-center px-4 py-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.map((sale) => (
                  <tr key={sale._id || sale.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-gray-600 whitespace-nowrap">{formatDate(sale.createdAt || sale.date)}</td>
                    <td className="px-4 py-2">{sale.items?.length || 0} item{(sale.items?.length || 0) !== 1 ? 's' : ''}</td>
                    <td className="px-4 py-2 text-right font-medium">&#8369;{Number(sale.total || 0).toLocaleString()}</td>
                    <td className="px-4 py-2 capitalize text-gray-600">{sale.paymentMethod || sale.payment}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${sale.status === 'voided' ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {sale.status || 'completed'}
                      </span>
                    </td>
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

export default Dashboard
