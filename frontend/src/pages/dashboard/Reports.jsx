import { useState, useEffect } from 'react'
import { reportsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const tabs = ['Total Sales', 'Best-Selling Products', 'Inventory Status', 'Transaction Summaries', 'Profit & Loss', 'Slow-Moving']
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
  const [label, setLabel] = useState('')

  const isPeriodic = activeTab !== 2

  const fetchReport = async (tab, p) => {
    setLoading(true)
    setLabel(tab === 4 ? 'Profit & Loss' : tab === 5 ? 'Slow-Moving' : '')
    try {
      let res
      if (tab === 0) res = await reportsApi.sales({ period: p })
      else if (tab === 1) res = await reportsApi.bestSellers({ period: p })
      else if (tab === 2) res = await reportsApi.inventory()
      else if (tab === 3) res = await reportsApi.dailySummaries({ period: p })
      else if (tab === 4) res = await reportsApi.pnl({ period: p })
      else if (tab === 5) res = await reportsApi.slowMoving({ days: 90 })
      setData(res)
    } catch (err) {
      addToast(err.message || 'Failed to load report', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReport(activeTab, period) }, [activeTab, period])

  const totalRevenue = data?.summary?.revenue || data?.totalRevenue || 0

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
          {tabs.map((tab, i) => (
            <button key={tab} onClick={() => setActiveTab(i)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>
        {isPeriodic && (
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5 w-fit">
            {periods.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${period === p.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
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
                  <p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.summary?.revenue || 0).toLocaleString()}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500">
                  <p className="text-sm text-gray-500">Total Sales</p>
                  <p className="text-2xl font-bold text-gray-900">{data.summary?.totalSales || 0}</p>
                </div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500">
                  <p className="text-sm text-gray-500">Average Sale Value</p>
                  <p className="text-2xl font-bold text-gray-900">&#8369;{data.summary?.totalSales > 0 ? Number(data.summary.revenue / data.summary.totalSales).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '0.00'}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr><th className="text-left px-4 py-3 font-medium">Date</th><th className="text-right px-4 py-3 font-medium">Items</th><th className="text-right px-4 py-3 font-medium">Total</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {(data.sales || []).length === 0 ? <tr><td colSpan={3} className="text-center py-8 text-gray-400">No sales found.</td></tr> :
                      (data.sales || []).map((sale, i) => (
                        <tr key={i} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-900">{new Date(sale.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                          <td className="px-4 py-3 text-right">{(sale.items || []).reduce((s, i) => s + (i.qty || i.quantity || 0), 0)}</td>
                          <td className="px-4 py-3 text-right font-medium">&#8369;{Number(sale.total || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeTab === 1 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                {(() => { const items = data.bestSellers || []; const totalQty = items.reduce((s, i) => s + i.qty, 0); const totalRev = items.reduce((s, i) => s + i.revenue, 0); const top = items[0]; return (<><div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500"><p className="text-sm text-gray-500">Total Products Sold</p><p className="text-2xl font-bold text-gray-900">{totalQty}</p></div><div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(totalRev).toLocaleString()}</p></div><div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500"><p className="text-sm text-gray-500">Top Seller</p><p className="text-lg font-bold text-gray-900 truncate">{top ? `${top.productName} (${top.qty})` : 'N/A'}</p></div></>)})()}
              </div>
              <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-3 font-medium">#</th><th className="text-left px-4 py-3 font-medium">Product</th><th className="text-right px-4 py-3 font-medium">Qty Sold</th><th className="text-right px-4 py-3 font-medium">Revenue</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.bestSellers || []).length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data found.</td></tr> :
                    (data.bestSellers || []).map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-400">{i + 1}</td><td className="px-4 py-3 text-gray-900 font-medium">{item.productName}</td><td className="px-4 py-3 text-right">{item.qty}</td><td className="px-4 py-3 text-right font-medium">&#8369;{Number(item.revenue).toLocaleString()}</td></tr>
                    ))}
                </tbody></table></div>
            </>
          )}

          {activeTab === 2 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500"><p className="text-sm text-gray-500">Total Products</p><p className="text-2xl font-bold text-gray-900">{data.summary?.totalProducts || 0}</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500"><p className="text-sm text-gray-500">Items Below Reorder Point</p><p className="text-2xl font-bold text-gray-900">{data.summary?.lowStockCount || 0}</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500"><p className="text-sm text-gray-500">Total Inventory Value</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.summary?.totalValue || 0).toLocaleString()}</p></div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-3 font-medium">Product</th><th className="text-right px-4 py-3 font-medium">Stock</th><th className="text-right px-4 py-3 font-medium">Reorder</th><th className="text-right px-4 py-3 font-medium">Value</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.lowStock || []).length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No low stock items.</td></tr> :
                    (data.lowStock || []).map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-900">{p.name}</td><td className="px-4 py-3 text-right">{p.stock}</td><td className="px-4 py-3 text-right">{p.reorderPoint || '-'}</td><td className="px-4 py-3 text-right">&#8369;{Number(p.price * p.stock).toLocaleString()}</td></tr>
                    ))}
                </tbody></table></div>
            </>
          )}

          {activeTab === 3 && (
            <>
              {(() => { const days = data.dailySummaries || []; const totalTx = days.reduce((s, d) => s + d.sales, 0); const totalItems = days.reduce((s, d) => s + d.orders, 0); const totalRev = days.reduce((s, d) => s + d.revenue, 0); return (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500"><p className="text-sm text-gray-500">Total Transactions</p><p className="text-2xl font-bold text-gray-900">{totalTx}</p></div>
                  <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500"><p className="text-sm text-gray-500">Total Items Sold</p><p className="text-2xl font-bold text-gray-900">{totalItems}</p></div>
                  <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(totalRev).toLocaleString()}</p></div>
                </div>
              )})()}
              <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-3 font-medium">Date</th><th className="text-right px-4 py-3 font-medium">Transactions</th><th className="text-right px-4 py-3 font-medium">Items Sold</th><th className="text-right px-4 py-3 font-medium">Revenue</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.dailySummaries || []).length === 0 ? <tr><td colSpan={4} className="text-center py-8 text-gray-400">No data found.</td></tr> :
                    (data.dailySummaries || []).map((day, i) => (
                      <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-900 font-medium">{new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td><td className="px-4 py-3 text-right">{day.sales}</td><td className="px-4 py-3 text-right">{day.orders}</td><td className="px-4 py-3 text-right font-medium">&#8369;{Number(day.revenue).toLocaleString()}</td></tr>
                    ))}
                </tbody></table></div>
            </>
          )}

          {activeTab === 4 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500"><p className="text-sm text-gray-500">Total Revenue</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.totalRevenue || 0).toLocaleString()}</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-yellow-500"><p className="text-sm text-gray-500">Cost of Goods Sold</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.cogs || 0).toLocaleString()}</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-green-500"><p className="text-sm text-gray-500">Gross Profit</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.grossProfit || 0).toLocaleString()}</p><p className="text-xs text-gray-400">Margin: {Number(data.grossMargin || 0).toFixed(1)}%</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-blue-500"><p className="text-sm text-gray-500">Net Profit</p><p className={`text-2xl font-bold ${(data.netProfit || 0) >= 0 ? 'text-gray-900' : 'text-red-600'}`}>&#8369;{Number(data.netProfit || 0).toLocaleString()}</p><p className="text-xs text-gray-400">Margin: {Number(data.netMargin || 0).toFixed(1)}%</p></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Expenses Breakdown</h3>
                  {Object.keys(data.expensesByCategory || {}).length === 0 ? <p className="text-sm text-gray-400">No expenses recorded.</p> : (
                    <div className="space-y-2">
                      {Object.entries(data.expensesByCategory || {}).map(([cat, amt]) => (
                        <div key={cat} className="flex justify-between text-sm"><span className="text-gray-600">{cat}</span><span className="font-medium">&#8369;{Number(amt).toLocaleString()}</span></div>
                      ))}
                      <div className="border-t pt-2 flex justify-between text-sm font-bold"><span>Total Expenses</span><span>&#8369;{Number(data.totalExpenses || 0).toLocaleString()}</span></div>
                    </div>
                  )}
                </div>
                <div className="bg-white rounded-lg shadow p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Transactions</span><span>{data.totalTransactions || 0}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Voided Sales</span><span className="text-red-600">&#8369;{Number(data.voidedSales || 0).toLocaleString()}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Discounts Given</span><span className="text-red-600">-&#8369;{Number(data.totalDiscounts || 0).toLocaleString()}</span></div>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 5 && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-red-500"><p className="text-sm text-gray-500">Items Not Sold in {data.thresholdDays || 90} Days</p><p className="text-2xl font-bold text-gray-900">{data.totalItems || 0}</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-orange-500"><p className="text-sm text-gray-500">Total Value (at selling price)</p><p className="text-2xl font-bold text-gray-900">&#8369;{Number(data.totalValue || 0).toLocaleString()}</p></div>
                <div className="bg-white rounded-lg shadow p-5 border-l-4 border-indigo-500"><p className="text-sm text-gray-500">Threshold</p><p className="text-2xl font-bold text-gray-900">{data.thresholdDays || 90} days</p></div>
              </div>
              <div className="bg-white rounded-lg shadow overflow-x-auto"><table className="w-full text-sm"><thead className="bg-gray-50 text-gray-600"><tr><th className="text-left px-4 py-3 font-medium">Product</th><th className="text-left px-4 py-3 font-medium">SKU</th><th className="text-left px-4 py-3 font-medium">Category</th><th className="text-right px-4 py-3 font-medium">Stock</th><th className="text-right px-4 py-3 font-medium">Price</th><th className="text-right px-4 py-3 font-medium">Value</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {(data.slowMovers || []).length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-400">No slow-moving items found.</td></tr> :
                    (data.slowMovers || []).map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-900">{item.productName}</td><td className="px-4 py-3 text-gray-500">{item.sku}</td><td className="px-4 py-3 text-gray-500">{item.category}</td><td className="px-4 py-3 text-right">{item.stock}</td><td className="px-4 py-3 text-right">&#8369;{Number(item.price).toLocaleString()}</td><td className="px-4 py-3 text-right font-medium">&#8369;{Number(item.value).toLocaleString()}</td></tr>
                    ))}
                </tbody></table></div>
            </>
          )}
        </>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400"><p>Select a report tab to view data.</p></div>
      )}
    </div>
  )
}

export default Reports
