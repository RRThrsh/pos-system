import { useState, useEffect } from 'react'
import { reportsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const tabs = ['Total Sales', 'Best-Selling Products', 'Inventory Status', 'Transaction Summaries']
const periods = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
]

function Reports() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState(0)
  const [period, setPeriod] = useState('daily')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchReport = async (tab, p) => {
    setLoading(true)
    try {
      let res
      if (tab === 0) res = await reportsApi.sales({ period: p })
      else if (tab === 1) res = await reportsApi.bestSellers({ period: p })
      else if (tab === 2) res = await reportsApi.inventory()
      else res = await reportsApi.dailySummaries({ period: p })
      setData(res)
    } catch (err) {
      addToast(err.message || 'Failed to load report', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReport(activeTab, period)
  }, [activeTab, period])

  const totalRevenue = data?.summary?.revenue || 0
  const totalSales = data?.summary?.totalSales || 0

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab}
            </button>
          ))}
        </div>
        {activeTab !== 2 && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
            {periods.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {loading ? <Spinner /> : data ? (
        <>
          {activeTab === 0 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">&#8369;{Number(totalRevenue).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{totalSales}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500">Average Sale Value</p>
                  <p className="text-2xl font-bold text-gray-900">
                    &#8369;{totalSales > 0 ? Number(totalRevenue / totalSales).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-right px-4 py-3 font-medium">Items</th>
                      <th className="text-right px-4 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.sales || []).length === 0 ? (
                      <tr><td colSpan={3} className="text-center py-8 text-gray-400">No sales found.</td></tr>
                    ) : (
                      (data.sales || []).map((sale, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">
                            {new Date(sale.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3 text-right">{(sale.items || []).reduce((s, i) => s + (i.qty || i.quantity || 0), 0)}</td>
                          <td className="px-4 py-3 text-right font-medium">&#8369;{Number(sale.total || 0).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 1 && (
            <>
              {(() => {
                const items = data.bestSellers || []
                const totalQty = items.reduce((s, i) => s + i.qty, 0)
                const totalRev = items.reduce((s, i) => s + i.revenue, 0)
                const top = items[0]
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500">
                      <p className="text-sm text-gray-500">Total Products Sold</p>
                      <p className="text-2xl font-bold text-gray-900">{totalQty}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">&#8369;{Number(totalRev).toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-500">Top Seller</p>
                      <p className="text-lg font-bold text-gray-900 truncate">{top ? `${top.productName} (${top.qty})` : 'N/A'}</p>
                    </div>
                  </div>
                )
              })()}
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">#</th>
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-right px-4 py-3 font-medium">Quantity Sold</th>
                      <th className="text-right px-4 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.bestSellers || []).length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">No sales data found.</td></tr>
                    ) : (
                      (data.bestSellers || []).map((item, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-400">{i + 1}</td>
                          <td className="px-4 py-3 text-gray-900 font-medium">{item.productName}</td>
                          <td className="px-4 py-3 text-right">{item.qty}</td>
                          <td className="px-4 py-3 text-right font-medium">&#8369;{Number(item.revenue).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500">
                  <p className="text-sm text-gray-500">Total Products</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary?.totalProducts || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500">
                  <p className="text-sm text-gray-500">Low Stock Items</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary?.lowStockCount || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                  <p className="text-sm text-gray-500">Total Inventory Value</p>
                  <p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.summary?.totalValue || 0).toLocaleString()}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Product</th>
                      <th className="text-right px-4 py-3 font-medium">Stock</th>
                      <th className="text-right px-4 py-3 font-medium">Value</th>
                      <th className="text-right px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.lowStock || []).length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">No low stock items found.</td></tr>
                    ) : (
                      (data.lowStock || []).map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{p.name}</td>
                          <td className="px-4 py-3 text-right">{p.stock}</td>
                          <td className="px-4 py-3 text-right">&#8369;{Number(p.price * p.stock).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">
                            {p.stock <= 0 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Out of Stock</span>
                            ) : p.stock <= 5 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800">Critical</span>
                            ) : p.stock <= 10 ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Low</span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 3 && (
            <>
              {(() => {
                const days = data.dailySummaries || []
                const totalTx = days.reduce((s, d) => s + d.sales, 0)
                const totalItems = days.reduce((s, d) => s + d.orders, 0)
                const totalRev = days.reduce((s, d) => s + d.revenue, 0)
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500">
                      <p className="text-sm text-gray-500">Total Transactions</p>
                      <p className="text-2xl font-bold text-gray-900">{totalTx}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                      <p className="text-sm text-gray-500">Total Items Sold</p>
                      <p className="text-2xl font-bold text-gray-900">{totalItems}</p>
                    </div>
                    <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                      <p className="text-sm text-gray-500">Total Revenue</p>
                      <p className="text-2xl font-bold text-gray-900">&#8369;{Number(totalRev).toLocaleString()}</p>
                    </div>
                  </div>
                )
              })()}
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="text-left px-4 py-3 font-medium">Date</th>
                      <th className="text-right px-4 py-3 font-medium">Transactions</th>
                      <th className="text-right px-4 py-3 font-medium">Items Sold</th>
                      <th className="text-right px-4 py-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.dailySummaries || []).length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data found for the selected period.</td></tr>
                    ) : (
                      (data.dailySummaries || []).map((day, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-4 py-3 text-right">{day.sales}</td>
                          <td className="px-4 py-3 text-right">{day.orders}</td>
                          <td className="px-4 py-3 text-right font-medium">&#8369;{Number(day.revenue).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          <p>Select a report tab to view data.</p>
        </div>
      )}
    </div>
  )
}

export default Reports
