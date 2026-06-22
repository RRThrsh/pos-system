import { useState, useEffect } from 'react'
import { reportsApi, salesApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts'

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316']

function Analytics() {
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('monthly')
  const [dailyData, setDailyData] = useState([])
  const [paymentData, setPaymentData] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [profitData, setProfitData] = useState({ revenue: 0, cost: 0, profit: 0 })
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      reportsApi.dailySummaries({ period }).catch(() => []),
      reportsApi.paymentMethods({ period }).catch(() => []),
      reportsApi.bestSellers({ period, limit: '10' }).catch(() => []),
      reportsApi.profits({ period }).catch(() => ({ revenue: 0, cost: 0, profit: 0 })),
      reportsApi.summary().catch(() => ({})),
    ])
      .then(([daily, payments, best, profits, sum]) => {
        setDailyData(Array.isArray(daily) ? daily : [])
        setPaymentData(Array.isArray(payments) ? payments : [])
        setBestSellers(Array.isArray(best) ? best : [])
        setProfitData(profits)
        setSummary(sum)
      })
      .finally(() => setLoading(false))
  }, [period])

  if (loading) return <Spinner />

  const totalSales = dailyData.reduce((s, d) => s + Number(d.totalSales || 0), 0)
  const totalTransactions = dailyData.reduce((s, d) => s + Number(d.transactionCount || 0), 0)
  const avgOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0
  const totalProfit = profitData.profit || 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Revenue', value: `₱${totalSales.toLocaleString()}` },
          { label: 'Total Profit', value: `₱${totalProfit.toLocaleString()}`, color: totalProfit >= 0 ? 'text-green-600' : 'text-red-600' },
          { label: 'Total Transactions', value: totalTransactions },
          { label: 'Avg Order Value', value: `₱${avgOrder.toLocaleString()}` },
          { label: 'Best Seller', value: bestSellers[0]?.productName || 'N/A' },
        ].map((c) => (
          <div key={c.label} className="bg-white rounded-lg shadow p-4 text-center">
            <div className={`text-xl font-bold ${c.color || ''}`}>{c.value}</div>
            <div className="text-xs text-gray-500 mt-1">{c.label}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-2">
        {['daily', 'weekly', 'monthly', 'yearly'].map((p) => (
          <button key={p} onClick={() => setPeriod(p)} className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${period === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Sales Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id || 'date'" tickFormatter={(v) => v ? new Date(v).toLocaleDateString().slice(0, 5) : ''} />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="totalSales" stroke="#3b82f6" name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Sales by Payment Method</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={paymentData} dataKey="total" nameKey="_id" cx="50%" cy="50%" outerRadius={100} label={({ _id, percent }) => `${_id} ${(percent * 100).toFixed(0)}%`}>
                {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Revenue vs Cost</h3>
          <div className="space-y-4">
            {[
              { label: 'Revenue', value: profitData.revenue || 0, color: 'bg-blue-500' },
              { label: 'Cost', value: profitData.cost || 0, color: 'bg-red-500' },
              { label: 'Profit', value: totalProfit, color: totalProfit >= 0 ? 'bg-green-500' : 'bg-red-500' },
            ].map((item) => {
              const max = Math.max(profitData.revenue || 1, 1)
              const pct = (item.value / max) * 100
              return (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.label}</span>
                    <span className="font-medium">₱{Number(item.value).toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-3">
                    <div className={`h-3 rounded-full ${item.color}`} style={{ width: `${Math.min(pct, 100)}%` }}></div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-4">Best Selling Products</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={bestSellers.slice(0, 10)} layout="vertical" margin={{ left: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="productName" tick={{ fontSize: 11 }} width={120} />
              <Tooltip />
              <Bar dataKey="totalQty" fill="#3b82f6" name="Qty Sold" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-sm font-medium text-gray-500 mb-4">Transaction Summary by Period</h3>
        <div className="overflow-x-auto max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead><tr className="bg-gray-50 border-b sticky top-0">{['Date', 'Transactions', 'Revenue', 'Profit'].map((h) => <th key={h} className="text-left px-4 py-2 font-medium text-gray-600">{h}</th>)}</tr></thead>
            <tbody>
              {dailyData.map((d, i) => (
                <tr key={i} className="border-b hover:bg-gray-50">
                  <td className="px-4 py-2">{new Date(d._id || d.date || d.createdAt || '').toLocaleDateString()}</td>
                  <td className="px-4 py-2">{d.transactionCount || d.count || 0}</td>
                  <td className="px-4 py-2">₱{Number(d.totalSales || d.revenue || 0).toLocaleString()}</td>
                  <td className="px-4 py-2">₱{Number(d.totalProfit || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default Analytics
