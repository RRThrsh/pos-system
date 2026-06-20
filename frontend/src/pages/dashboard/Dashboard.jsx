import { useState, useEffect } from 'react'
import { reportsApi } from '../../services/api.js'
import Spinner from '../../components/Spinner.jsx'

const cards = [
  { key: 'todaySales', label: 'Today Sales', color: 'bg-blue-500' },
  { key: 'todayRevenue', label: "Today's Revenue", prefix: '₱', color: 'bg-green-500' },
  { key: 'totalSales', label: 'Total Sales', color: 'bg-indigo-500' },
  { key: 'totalRevenue', label: 'Total Revenue', prefix: '₱', color: 'bg-teal-500' },
  { key: 'totalProducts', label: 'Total Products', color: 'bg-purple-500' },
  { key: 'lowStockCount', label: 'Low Stock Items', color: 'bg-orange-500' },
  { key: 'totalUsers', label: 'Total Users', color: 'bg-pink-500' },
  { key: 'totalCustomers', label: 'Total Customers', color: 'bg-cyan-500' },
]

function Dashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    reportsApi.summary()
      .then(setSummary)
      .catch((err) => setError(err.message || 'Failed to load summary'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Spinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
        {error}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
    </div>
  )
}

export default Dashboard
