import { useState, useEffect, useRef } from 'react'
import { reportsApi, salesApi, productsApi, auditLogsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts'

const icons = {
  todaySales: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  todayRevenue: 'M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 0 3 6h.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M3.75 6H9m6.75 0H21m-3.75 0v11.25M3 6v11.25M3 6h.75M3 17.25v.75c0 .621.504 1.125 1.125 1.125H18',
  totalSales: 'M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75Z M9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625Z M16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z',
  totalRevenue: 'M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  totalProducts: 'M20.25 7.5l-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z',
  lowStockCount: 'M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.572-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z',
  netProfit: 'M3 4.5h14.25M3 9h9.75M3 13.5h5.25m5.25-.75L17.25 9m0 0L21 12.75M17.25 9v12',
  avgOrder: 'M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 0 0-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 0 0-16.536-1.84M7.5 14.25 5.106 5.272M6 20.25a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Zm12.75 0a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0Z',
  momGrowth: 'M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.334-6.629l-.134 1.566a3.75 3.75 0 0 0 3.416 3.416l1.566-.134M16.5 6h3.75v3.75',
  activeUsers: 'M12 4.5v15m0 0 6.75-6.75M12 19.5l-6.75-6.75',
  totalUsers: 'M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z',
}

const periods = [
  { key: 'daily', label: 'Daily' },
  { key: 'weekly', label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
]

const PAYMENT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [dailyData, setDailyData] = useState([])
  const [recentSales, setRecentSales] = useState([])
  const [lowStock, setLowStock] = useState([])
  const [zeroStock, setZeroStock] = useState([])
  const [loading, setLoading] = useState(true)
  const [chartPeriod, setChartPeriod] = useState('weekly')
  const [error, setError] = useState('')

  const [profitData, setProfitData] = useState(null)
  const [prevProfit, setPrevProfit] = useState(null)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [hourlySales, setHourlySales] = useState([])
  const [bestSellers, setBestSellers] = useState([])
  const [activeUsers, setActiveUsers] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [categorySales, setCategorySales] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const initialLoad = useRef(true)

  const loadAll = () => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59).toISOString()

    return Promise.all([
      reportsApi.summary(),
      reportsApi.dailySummaries({ period: chartPeriod }),
      salesApi.getAll({ limit: '5' }),
      productsApi.getAll({ limit: '200' }),
      reportsApi.profits({ dateFrom: monthStart }),
      reportsApi.profits({ dateFrom: prevMonthStart, dateTo: prevMonthEnd }),
      reportsApi.paymentMethods({ period: chartPeriod }),
      reportsApi.hourlySales({ period: 'daily' }),
      reportsApi.bestSellers({ period: chartPeriod, limit: '5' }),
      reportsApi.activeUsers(),
      auditLogsApi.getAll({ limit: '10' }),
      reportsApi.categorySales({ period: chartPeriod }),
      reportsApi.inventory(),
    ]).then(([
      summaryData, dailyRes, salesData, prodData,
      profitsRes, prevProfitsRes, pmRes, hourlyRes, bestRes, activeRes, activityRes,
      catRes, invRes,
    ]) => {
      setSummary(summaryData)
      setDailyData(dailyRes.dailySummaries || [])
      setRecentSales(salesData.data || salesData.sales || salesData || [])
      const allProducts = prodData.products || prodData.data || prodData || []
      setLowStock(allProducts.filter((p) => p.stock <= 10))
      setZeroStock(allProducts.filter((p) => p.stock === 0))
      setProfitData(profitsRes)
      setPrevProfit(prevProfitsRes)
      setPaymentMethods(pmRes.paymentMethods || [])
      setHourlySales(hourlyRes.hourlySales || [])
      setBestSellers(bestRes.bestSellers || [])
      setActiveUsers(activeRes.users || [])
      setRecentActivity((activityRes.data || []).slice(0, 10))
      setCategorySales(catRes.categories || [])
      setLowStockItems((invRes.lowStock || []).filter((p) => p.stock > 0 && p.stock <= 10))
    })
  }

  useEffect(() => {
    loadAll()
      .catch((err) => setError(err.message || 'Failed to load data'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!initialLoad.current) {
      loadAll().catch((err) => setError(err.message || 'Failed to load data'))
    }
    initialLoad.current = false
  }, [chartPeriod])

  const formatDate = (d) => {
    if (!d) return '-'
    return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const formatShort = (d) => {
    return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
  }

  const formatHour = (h) => {
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hr = h % 12 || 12
    return `${hr}${ampm}`
  }

  const formatCurrency = (v) => `₱${Number(v || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`

  const netProfit = profitData?.profit || 0
  const avgOrder = summary?.totalSales ? (summary.totalRevenue / summary.totalSales) : 0
  const momGrowth = prevProfit?.profit && prevProfit.profit > 0
    ? ((netProfit - prevProfit.profit) / prevProfit.profit) * 100
    : null
  const activeCount = activeUsers.length

  const dodSales = summary?.yesterdaySales > 0 ? ((summary.todaySales - summary.yesterdaySales) / summary.yesterdaySales) * 100 : null
  const dodRevenue = summary?.yesterdayRevenue > 0 ? ((summary.todayRevenue - summary.yesterdayRevenue) / summary.yesterdayRevenue) * 100 : null
  const returnRate = summary?.totalSales > 0 ? ((summary.voidedCount || 0) / summary.totalSales) * 100 : 0
  const invValue = summary?.inventoryValue || 0
  const lowStockCount = summary?.lowStockCount || 0

  const mainCards = [
    { key: 'todaySales', label: 'Today Sales', icon: 'todaySales', color: 'from-blue-500 to-blue-600', dod: dodSales },
    { key: 'todayRevenue', label: "Today's Revenue", prefix: '₱', icon: 'todayRevenue', color: 'from-emerald-500 to-emerald-600', dod: dodRevenue },
    { key: 'totalRevenue', label: 'Total Revenue', prefix: '₱', icon: 'totalRevenue', color: 'from-teal-500 to-teal-600' },
    { key: 'totalSales', label: 'Total Sales', icon: 'totalSales', color: 'from-indigo-500 to-indigo-600' },
  ]

  const metricCards = [
    { label: 'Net Profit', value: netProfit, prefix: '₱', icon: 'netProfit', color: 'from-violet-500 to-violet-600' },
    { label: 'Avg Order Value', value: avgOrder, prefix: '₱', icon: 'avgOrder', color: 'from-cyan-500 to-cyan-600' },
    { label: 'Return Rate', value: returnRate, suffix: '%', icon: 'momGrowth', color: returnRate <= 5 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600' },
    { label: 'Active Users Today', value: activeCount, icon: 'activeUsers', color: 'from-amber-500 to-amber-600' },
  ]

  const bottomCards = [
    { label: 'MoM Growth', value: momGrowth, suffix: '%', icon: 'momGrowth', color: momGrowth >= 0 ? 'from-green-500 to-green-600' : 'from-red-500 to-red-600' },
    { label: 'Inventory Value', value: invValue, prefix: '₱', icon: 'totalProducts', color: 'from-indigo-500 to-indigo-600' },
    { label: 'Low Stock Items', value: lowStockCount, icon: 'lowStockCount', color: lowStockCount > 0 ? 'from-orange-500 to-orange-600' : 'from-green-500 to-green-600' },
    { label: 'Discount Impact Today', value: summary?.todayDiscAmount || 0, prefix: '₱', icon: 'avgOrder', color: 'from-rose-500 to-rose-600' },
  ]

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

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {mainCards.map((card) => {
          const value = summary?.[card.key]
          const display = card.prefix
            ? formatCurrency(value || 0)
            : Number(value || 0).toLocaleString()

          return (
            <div key={card.key} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-shadow">
              <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-3 shadow-sm`}>
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[card.icon]} />
                </svg>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold text-gray-800">{display}</p>
                {card.dod !== undefined && card.dod !== null && (
                  <span className={`text-xs font-medium ${card.dod >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {card.dod >= 0 ? '+' : ''}{card.dod.toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((card) => {
          let display
          if (card.suffix === '%') {
            const v = card.value
            display = v !== null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : 'N/A'
          } else if (card.prefix) {
            display = formatCurrency(card.value)
          } else {
            display = Number(card.value || 0).toLocaleString()
          }

          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0 shadow-sm`}>
                  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icons[card.icon]} />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</p>
                  <p className={`text-xl font-bold ${card.suffix === '%' && card.value < 0 ? 'text-red-600' : 'text-gray-800'} truncate`}>{display}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {bottomCards.map((card) => {
          let display
          if (card.suffix === '%') {
            const v = card.value
            display = v !== null ? `${v >= 0 ? '+' : ''}${v.toFixed(1)}%` : 'N/A'
          } else if (card.prefix) {
            display = formatCurrency(card.value)
          } else {
            display = Number(card.value || 0).toLocaleString()
          }
          return (
            <div key={card.label} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-xs text-gray-500">{card.label}</p>
                  <p className={`text-lg font-semibold mt-0.5 ${card.suffix === '%' && card.value < 0 ? 'text-red-600' : 'text-gray-800'}`}>{display}</p>
                </div>
                <svg className="w-5 h-5 text-gray-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icons[card.icon]} />
                </svg>
              </div>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Sales Trend</h2>
            </div>
            <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
              {periods.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setChartPeriod(p.key)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${chartPeriod === p.key ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          {dailyData.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">No sales data for this period.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={formatShort} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e5e7eb' }} labelFormatter={(d) => formatShort(d)} />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} name="Revenue" />
                <Line type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Sales" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sales by Payment</h2>
          {paymentMethods.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={paymentMethods} dataKey="revenue" nameKey="method" cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3}>
                  {paymentMethods.map((_, i) => (
                    <Cell key={i} fill={PAYMENT_COLORS[i % PAYMENT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} formatter={(v) => formatCurrency(v)} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Categories</h2>
          {categorySales.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">No data.</p>
          ) : (
            <div className="space-y-3">
              {categorySales.slice(0, 7).map((cat, i) => {
                const maxRev = Math.max(...categorySales.map((c) => c.revenue), 1)
                return (
                  <div key={cat.category}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate flex-1">{i + 1}. {cat.category}</span>
                      <span className="text-gray-500 ml-2">{formatCurrency(cat.revenue)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-teal-500 h-2 rounded-full" style={{ width: `${(cat.revenue / maxRev) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Revenue vs Cost</h2>
          {!profitData ? (
            <p className="text-sm text-gray-500 text-center py-12">No data.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Revenue</span>
                <span className="font-semibold text-gray-800">{formatCurrency(profitData.revenue)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Cost</span>
                <span className="font-semibold text-red-600">{formatCurrency(profitData.cost)}</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex items-center justify-between">
                <span className="font-medium text-gray-700">Profit</span>
                <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3 flex overflow-hidden">
                <div className="bg-blue-500 h-full transition-all" style={{ width: `${Math.max(0, 100 - (profitData.cost / (profitData.revenue || 1)) * 100)}%` }} />
                <div className="bg-red-400 h-full transition-all" style={{ width: `${Math.min(100, (profitData.cost / (profitData.revenue || 1)) * 100)}%` }} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-500">Margin</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span className="text-xs text-gray-500">Cost</span>
                </div>
                <span className="text-xs font-medium text-gray-600">{profitData.revenue ? ((netProfit / profitData.revenue) * 100).toFixed(1) : 0}% margin</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top 5 Products</h2>
          {bestSellers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">No data.</p>
          ) : (
            <div className="space-y-3">
              {bestSellers.map((p, i) => {
                const maxQty = Math.max(...bestSellers.map((b) => b.qty), 1)
                return (
                  <div key={p.productId}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700 truncate flex-1">{i + 1}. {p.productName}</span>
                      <span className="text-gray-500 ml-2">{p.qty} sold</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div className="bg-indigo-500 h-2 rounded-full" style={{ width: `${(p.qty / maxQty) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Hourly Sales</h2>
          {hourlySales.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-12">No data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={hourlySales}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="hour" tick={{ fontSize: 10 }} tickFormatter={formatHour} interval={2} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(h) => formatHour(h)} />
                <Bar dataKey="sales" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Sales" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent User Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">No activity.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {recentActivity.map((log) => (
                <div key={log._id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-2 h-2 rounded-full shrink-0 ${log.action?.includes('login') ? 'bg-green-400' : log.action?.includes('create') ? 'bg-blue-400' : log.action?.includes('void') ? 'bg-red-400' : 'bg-gray-400'}`} />
                    <span className="text-gray-700 truncate">{log.username}</span>
                  </div>
                  <span className="text-gray-500 text-xs shrink-0 ml-2">{log.action}</span>
                  <span className="text-gray-500 text-xs shrink-0 ml-2">{formatDate(log.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Stock Alerts</h2>
          {zeroStock.length === 0 && lowStockItems.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">All items well-stocked.</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-auto">
              {zeroStock.map((p) => (
                <div key={p._id || p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
                    <span className="text-gray-700 truncate">{p.name}</span>
                  </div>
                  <span className="text-xs font-medium text-red-600 shrink-0">Out of stock</span>
                </div>
              ))}
              {lowStockItems.filter((p) => p.stock > 0).map((p) => (
                <div key={p._id || p.id} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                    <span className="text-gray-700 truncate">{p.name}</span>
                  </div>
                  <span className="text-xs font-medium text-orange-500 shrink-0">{p.stock} remaining</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h2>
        {recentSales.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No recent sales.</p>
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
                    <td className="px-4 py-2 text-right font-medium">{formatCurrency(sale.total || 0)}</td>
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