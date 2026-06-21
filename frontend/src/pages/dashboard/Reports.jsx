import { useState } from 'react'
import { reportsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { useToast } from '../../context/ToastContext.jsx'

const tabs = ['Sales Report', 'Inventory Report', 'Profit Report']

function Reports() {
  const { addToast } = useToast()
  const [activeTab, setActiveTab] = useState(0)
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [params, setParams] = useState({ dateFrom: '', dateTo: '', period: 'daily' })

  const fetchReport = async () => {
    setLoading(true)
    try {
      let res
      if (activeTab === 0) res = await reportsApi.sales({ ...params, period: params.period })
      else if (activeTab === 1) res = await reportsApi.inventory()
      else res = await reportsApi.profits({ dateFrom: params.dateFrom, dateTo: params.dateTo })
      setData(res)
    } catch (err) {
      addToast(err.message || 'Failed to load report', 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Reports</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {tabs.map((tab, i) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(i); setData(null) }}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${activeTab === i ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow p-5 mb-6">
        <div className="flex items-end gap-4 flex-wrap">
          {activeTab !== 1 && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
                <input type="date" value={params.dateFrom} onChange={(e) => setParams({ ...params, dateFrom: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
                <input type="date" value={params.dateTo} onChange={(e) => setParams({ ...params, dateTo: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" />
              </div>
            </>
          )}
          {activeTab === 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
              <select value={params.period} onChange={(e) => setParams({ ...params, period: e.target.value })} className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20">
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>
          )}
          <button onClick={fetchReport} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors">Generate</button>
        </div>
      </div>

      {loading ? <Spinner /> : data ? (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          {activeTab === 0 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-right px-4 py-3 font-medium">Sales Count</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.sales || data.data || data.reports || []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{row.period || row.date || row._id || '-'}</td>
                    <td className="px-4 py-3 text-right">{row.count || row.totalSales || 0}</td>
                    <td className="px-4 py-3 text-right font-medium">&#8369;{Number(row.revenue || row.totalRevenue || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 1 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Product</th>
                  <th className="text-right px-4 py-3 font-medium">Stock</th>
                  <th className="text-right px-4 py-3 font-medium">Value</th>
                  <th className="text-right px-4 py-3 font-medium">Low Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.products || data.data || data.inventory || []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{row.name || row.product || '-'}</td>
                    <td className="px-4 py-3 text-right">{row.stock || row.quantity || 0}</td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(row.value || row.totalValue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {(row.stock || row.quantity) <= (row.lowStockThreshold || 10) ? (
                        <span className="text-red-600 font-medium">Yes</span>
                      ) : 'No'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {activeTab === 2 && (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Period</th>
                  <th className="text-right px-4 py-3 font-medium">Revenue</th>
                  <th className="text-right px-4 py-3 font-medium">Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(data.profits || data.data || data.reports || []).map((row, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-900">{row.period || row.date || row._id || '-'}</td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(row.revenue || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">&#8369;{Number(row.cost || 0).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">&#8369;{Number(row.profit || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {(!data.sales && !data.products && !data.profits && !data.data && !data.reports && !data.inventory) && (
            <p className="text-center py-8 text-gray-400 text-sm">Report data loaded. Check console for details.</p>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-400">
          <p>Select filters and click Generate to view report.</p>
        </div>
      )}
    </div>
  )
}

export default Reports
